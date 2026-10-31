import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AutomationAuthGuard } from './automation-auth.guard';
import { AutomationService } from './automation.service';

@Controller('automation')
@UseGuards(AutomationAuthGuard)
export class AutomationController {
  constructor(private readonly automation: AutomationService) {}

  @Post('drafts')
  create(@Body() body: unknown) {
    return this.automation.create(body);
  }

  @Get('drafts/:id')
  get(@Param('id') id: string) {
    return this.automation.get(id);
  }

  @Post('drafts/:id/confirm')
  confirm(@Param('id') id: string) {
    return this.automation.confirm(id);
  }

  @Post('drafts/:id/cancel')
  cancel(@Param('id') id: string) {
    return this.automation.cancel(id);
  }
}
