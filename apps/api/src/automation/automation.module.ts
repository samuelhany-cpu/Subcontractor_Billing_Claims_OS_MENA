import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { TransfersModule } from '../transfers/transfers.module';
import { AutomationAuthGuard } from './automation-auth.guard';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
@Module({
  imports: [InfrastructureModule, ExpensesModule, TransfersModule],
  controllers: [AutomationController],
  providers: [AutomationService, AutomationAuthGuard],
})
export class AutomationModule {}
