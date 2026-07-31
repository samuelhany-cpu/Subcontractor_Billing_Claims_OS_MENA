import {
  BeforeApplicationShutdown,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { StructuredLoggerService } from './structured-logger.service';

@Injectable()
export class ApplicationLifecycleService
  implements
    OnApplicationBootstrap,
    BeforeApplicationShutdown,
    OnApplicationShutdown
{
  constructor(private readonly logger: StructuredLoggerService) {}

  onApplicationBootstrap(): void {
    this.logger.event('info', 'application.started');
  }

  beforeApplicationShutdown(signal?: string): void {
    this.logger.event('info', 'application.shutdown.started', {
      signal: signal ?? 'application-close',
    });
  }

  onApplicationShutdown(signal?: string): void {
    this.logger.event('info', 'application.shutdown.completed', {
      signal: signal ?? 'application-close',
    });
  }
}
