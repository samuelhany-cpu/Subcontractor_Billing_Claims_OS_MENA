import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { projectArchived, projectNotFound } from './project-errors';
import { ProjectDataClient, ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectStateService {
  constructor(private readonly projects: ProjectsRepository) {}

  async assertAcceptsWrites(
    projectId: string,
    client?: ProjectDataClient,
  ): Promise<Project> {
    const project = await this.projects.findById(projectId, client);
    if (project === null) {
      throw projectNotFound();
    }
    if (project.status === 'ARCHIVED') {
      throw projectArchived();
    }
    return project;
  }
}
