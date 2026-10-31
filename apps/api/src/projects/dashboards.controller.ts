import { GlobalDashboardResponse } from '@claims-os/domain';
import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardsController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  global(): Promise<GlobalDashboardResponse> {
    return this.dashboard.global();
  }
}
