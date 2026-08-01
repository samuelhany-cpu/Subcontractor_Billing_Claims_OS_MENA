import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ProjectsModule } from '../projects/projects.module';
import { AgreementsController, PayeesController } from './payees.controller';
import { PayeesRepository } from './payees.repository';
import { PayeesService } from './payees.service';

@Module({
  imports: [InfrastructureModule, ProjectsModule],
  controllers: [PayeesController, AgreementsController],
  providers: [PayeesRepository, PayeesService],
  exports: [PayeesService],
})
export class PayeesModule {}
