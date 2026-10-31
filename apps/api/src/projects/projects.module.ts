import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ProjectStateService } from './project-state.service';
import { ProjectTotalsService } from './project-totals.service';
import { ProjectsController } from './projects.controller';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';
import { DashboardService } from './dashboard.service';
import { DashboardsController } from './dashboards.controller';

@Module({
  imports: [InfrastructureModule],
  controllers: [ProjectsController, DashboardsController],
  providers: [
    ProjectsRepository,
    ProjectTotalsService,
    DashboardService,
    ProjectStateService,
    ProjectsService,
  ],
  exports: [ProjectStateService],
})
export class ProjectsModule {}
