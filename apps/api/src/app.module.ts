import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { ApiConfigModule } from './config/api-config.module';
import { HealthModule } from './health/health.module';
import { ExpensesModule } from './expenses/expenses.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ObservabilityModule } from './observability/observability.module';
import { PayeesModule } from './payees/payees.module';
import { ProjectsModule } from './projects/projects.module';
import { TransfersModule } from './transfers/transfers.module';
import { AutomationModule } from './automation/automation.module';

@Module({
  imports: [
    ApiConfigModule,
    CategoriesModule,
    ExpensesModule,
    ObservabilityModule,
    InfrastructureModule,
    HealthModule,
    PayeesModule,
    ProjectsModule,
    TransfersModule,
    AutomationModule,
  ],
})
export class AppModule {}
