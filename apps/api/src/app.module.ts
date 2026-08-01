import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { ApiConfigModule } from './config/api-config.module';
import { HealthModule } from './health/health.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ObservabilityModule } from './observability/observability.module';
import { PayeesModule } from './payees/payees.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ApiConfigModule,
    CategoriesModule,
    ObservabilityModule,
    InfrastructureModule,
    HealthModule,
    PayeesModule,
    ProjectsModule,
  ],
})
export class AppModule {}
