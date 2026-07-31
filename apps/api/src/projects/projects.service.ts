import {
  CreateProjectRequest,
  ProjectDashboardResponse,
  ProjectFilter,
  ProjectResponse,
  UpdateProjectRequest,
} from '@claims-os/domain';
import { Injectable } from '@nestjs/common';
import {
  AuditAction,
  Prisma,
  Project,
  ProjectStatus,
  RecordSource,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { parseMoney } from '../shared/decimal/decimal';
import {
  invalidProjectTransition,
  projectArchived,
  projectNameConflict,
  projectNotFound,
} from './project-errors';
import {
  mapDashboard,
  mapProject,
  parseDateOnly,
  projectSnapshot,
  serializeDateOnly,
} from './project-mapper';
import { ProjectTotalsService } from './project-totals.service';
import { ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projects: ProjectsRepository,
    private readonly totals: ProjectTotalsService,
    private readonly audit: AuditService,
  ) {}

  async create(
    input: CreateProjectRequest,
    correlationId?: string,
  ): Promise<ProjectResponse> {
    const project = await this.withNameConflict(() =>
      this.projects.transaction(async (transaction) => {
        const created = await this.projects.create(
          {
            name: input.name,
            openingBalance: parseMoney(input.openingBalance ?? '0.00'),
            ...(input.openingBalanceDate === undefined
              ? {}
              : {
                  openingBalanceDate:
                    input.openingBalanceDate === null
                      ? null
                      : parseDateOnly(input.openingBalanceDate),
                }),
          },
          transaction,
        );
        await this.audit.append(
          {
            action: AuditAction.CREATE,
            entityType: 'Project',
            entityId: created.id,
            source: RecordSource.WEB,
            after: projectSnapshot(created),
            ...(correlationId === undefined ? {} : { correlationId }),
          },
          transaction,
        );
        return created;
      }),
    );
    return mapProject(project, await this.totals.forProject(project));
  }

  async update(
    projectId: string,
    input: UpdateProjectRequest,
    correlationId?: string,
  ): Promise<ProjectResponse> {
    const project = await this.withNameConflict(() =>
      this.projects.transaction(async (transaction) => {
        const current = await this.projects.findById(projectId, transaction);
        if (current === null) {
          throw projectNotFound();
        }
        if (current.status === ProjectStatus.ARCHIVED) {
          throw projectArchived();
        }

        const data: Prisma.ProjectUpdateInput = {};
        if (input.name !== undefined && input.name !== current.name) {
          data.name = input.name;
        }
        if (
          input.openingBalance !== undefined &&
          !current.openingBalance.equals(parseMoney(input.openingBalance))
        ) {
          data.openingBalance = parseMoney(input.openingBalance);
        }
        if (input.openingBalanceDate !== undefined) {
          const incomingDate =
            input.openingBalanceDate === null
              ? null
              : parseDateOnly(input.openingBalanceDate);
          if (
            serializeDateOnly(incomingDate) !==
            serializeDateOnly(current.openingBalanceDate)
          ) {
            data.openingBalanceDate = incomingDate;
          }
        }

        if (Object.keys(data).length === 0) {
          return current;
        }

        const updated = await this.projects.update(
          projectId,
          data,
          transaction,
        );
        await this.audit.append(
          {
            action: AuditAction.UPDATE,
            entityType: 'Project',
            entityId: projectId,
            source: RecordSource.WEB,
            before: projectSnapshot(current),
            after: projectSnapshot(updated),
            ...(correlationId === undefined ? {} : { correlationId }),
          },
          transaction,
        );
        return updated;
      }),
    );
    return mapProject(project, await this.totals.forProject(project));
  }

  async archive(
    projectId: string,
    correlationId?: string,
  ): Promise<ProjectResponse> {
    return this.transition(
      projectId,
      ProjectStatus.ACTIVE,
      ProjectStatus.ARCHIVED,
      AuditAction.ARCHIVE,
      correlationId,
    );
  }

  async restore(
    projectId: string,
    correlationId?: string,
  ): Promise<ProjectResponse> {
    return this.transition(
      projectId,
      ProjectStatus.ARCHIVED,
      ProjectStatus.ACTIVE,
      AuditAction.UNARCHIVE,
      correlationId,
    );
  }

  async list(filter: ProjectFilter): Promise<readonly ProjectResponse[]> {
    const projects = await this.projects.list(
      filter === 'ALL' ? undefined : ProjectStatus[filter],
    );
    const totals = await this.totals.forProjects(projects);
    return projects.map((project) =>
      mapProject(project, this.requiredTotals(totals, project.id)),
    );
  }

  async get(projectId: string): Promise<ProjectResponse> {
    const project = await this.requireProject(projectId);
    return mapProject(project, await this.totals.forProject(project));
  }

  async dashboard(projectId: string): Promise<ProjectDashboardResponse> {
    const project = await this.requireProject(projectId);
    return mapDashboard(project, await this.totals.forProject(project));
  }

  private async transition(
    projectId: string,
    expected: ProjectStatus,
    target: ProjectStatus,
    action: AuditAction,
    correlationId?: string,
  ): Promise<ProjectResponse> {
    const project = await this.projects.transaction(async (transaction) => {
      const current = await this.projects.findById(projectId, transaction);
      if (current === null) {
        throw projectNotFound();
      }
      if (current.status !== expected) {
        throw invalidProjectTransition(
          target === ProjectStatus.ARCHIVED
            ? 'Project is already archived.'
            : 'Project is already active.',
        );
      }
      const updated = await this.projects.update(
        projectId,
        {
          status: target,
          archivedAt: target === ProjectStatus.ARCHIVED ? new Date() : null,
        },
        transaction,
      );
      await this.audit.append(
        {
          action,
          entityType: 'Project',
          entityId: projectId,
          source: RecordSource.WEB,
          before: projectSnapshot(current),
          after: projectSnapshot(updated),
          ...(correlationId === undefined ? {} : { correlationId }),
        },
        transaction,
      );
      return updated;
    });
    return mapProject(project, await this.totals.forProject(project));
  }

  private async requireProject(projectId: string): Promise<Project> {
    const project = await this.projects.findById(projectId);
    if (project === null) {
      throw projectNotFound();
    }
    return project;
  }

  private requiredTotals<T>(totals: ReadonlyMap<string, T>, id: string): T {
    const result = totals.get(id);
    if (result === undefined) {
      throw new Error('Project totals were not produced');
    }
    return result;
  }

  private async withNameConflict<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw projectNameConflict();
      }
      throw error;
    }
  }
}
