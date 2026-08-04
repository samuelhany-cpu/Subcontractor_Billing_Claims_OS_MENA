import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ProjectsModule } from '../projects/projects.module';
import { ObservabilityModule } from '../observability/observability.module';
import { TransfersController } from './transfers.controller';
import { TransfersRepository } from './transfers.repository';
import { TransfersService } from './transfers.service';

@Module({
  imports: [InfrastructureModule, ProjectsModule, ObservabilityModule],
  controllers: [TransfersController],
  providers: [TransfersRepository, TransfersService],
  exports: [TransfersService, TransfersRepository],
})
export class TransfersModule {}
