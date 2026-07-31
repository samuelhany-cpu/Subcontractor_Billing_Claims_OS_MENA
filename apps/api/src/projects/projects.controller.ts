import {
  CreateProjectRequest,
  CreateProjectSchema,
  ProjectDashboardResponse,
  ProjectFilterSchema,
  ProjectIdSchema,
  ProjectResponse,
  UpdateProjectRequest,
  UpdateProjectSchema,
} from '@claims-os/domain';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CorrelationContext } from '../observability/correlation-context';
import { parseRequest } from './project-errors';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly correlation: CorrelationContext,
  ) {}

  @Get()
  list(@Query('status') status?: string): Promise<readonly ProjectResponse[]> {
    return this.projects.list(
      parseRequest(ProjectFilterSchema, status ?? 'ALL'),
    );
  }

  @Post()
  create(@Body() body: unknown): Promise<ProjectResponse> {
    return this.projects.create(
      parseRequest<CreateProjectRequest>(CreateProjectSchema, body),
      this.correlation.getCorrelationId(),
    );
  }

  @Get(':projectId/dashboard')
  dashboard(
    @Param('projectId') projectId: string,
  ): Promise<ProjectDashboardResponse> {
    return this.projects.dashboard(parseRequest(ProjectIdSchema, projectId));
  }

  @Get(':projectId')
  get(@Param('projectId') projectId: string): Promise<ProjectResponse> {
    return this.projects.get(parseRequest(ProjectIdSchema, projectId));
  }

  @Patch(':projectId')
  update(
    @Param('projectId') projectId: string,
    @Body() body: unknown,
  ): Promise<ProjectResponse> {
    return this.projects.update(
      parseRequest(ProjectIdSchema, projectId),
      parseRequest<UpdateProjectRequest>(UpdateProjectSchema, body),
      this.correlation.getCorrelationId(),
    );
  }

  @Post(':projectId/archive')
  @HttpCode(HttpStatus.OK)
  archive(@Param('projectId') projectId: string): Promise<ProjectResponse> {
    return this.projects.archive(
      parseRequest(ProjectIdSchema, projectId),
      this.correlation.getCorrelationId(),
    );
  }

  @Post(':projectId/restore')
  @HttpCode(HttpStatus.OK)
  restore(@Param('projectId') projectId: string): Promise<ProjectResponse> {
    return this.projects.restore(
      parseRequest(ProjectIdSchema, projectId),
      this.correlation.getCorrelationId(),
    );
  }
}
