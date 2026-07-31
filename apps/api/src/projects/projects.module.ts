import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ProjectStateService } from './project-state.service';
import { ProjectTotalsService } from './project-totals.service';
import { ProjectsController } from './projects.controller';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

@Module({
  imports: [InfrastructureModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsRepository,
    ProjectTotalsService,
    ProjectStateService,
    ProjectsService,
  ],
  exports: [ProjectStateService],
})
export class ProjectsModule {}
