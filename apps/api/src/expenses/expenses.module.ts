import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { API_RUNTIME_CONFIG, ApiRuntimeConfig } from '../config/api-config';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ProjectsModule } from '../projects/projects.module';
import { AttachmentsService } from './attachments.service';
import { ExpenseAmountService } from './expense-amount.service';
import {
  AttachmentContentController,
  ExpensesController,
} from './expenses.controller';
import { ExpensesRepository } from './expenses.repository';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [
    InfrastructureModule,
    ProjectsModule,
    MulterModule.registerAsync({
      inject: [API_RUNTIME_CONFIG],
      useFactory: (config: ApiRuntimeConfig) => ({
        limits: {
          fileSize: config.attachments.maxBytes,
          files: 1,
        },
      }),
    }),
  ],
  controllers: [ExpensesController, AttachmentContentController],
  providers: [
    AttachmentsService,
    ExpenseAmountService,
    ExpensesRepository,
    ExpensesService,
  ],
})
export class ExpensesModule {}
