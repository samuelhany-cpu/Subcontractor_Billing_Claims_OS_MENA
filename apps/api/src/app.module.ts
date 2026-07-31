import { Module } from '@nestjs/common';
import { ApiConfigModule } from './config/api-config.module';
import { HealthModule } from './health/health.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ObservabilityModule } from './observability/observability.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ApiConfigModule,
    ObservabilityModule,
    InfrastructureModule,
    HealthModule,
    ProjectsModule,
  ],
})
export class AppModule {}
