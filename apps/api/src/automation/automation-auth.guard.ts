import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import {
  API_RUNTIME_CONFIG,
  type ApiRuntimeConfig,
} from '../config/api-config';

@Injectable()
export class AutomationAuthGuard implements CanActivate {
  constructor(
    @Inject(API_RUNTIME_CONFIG) private readonly config: ApiRuntimeConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined> }>().headers[
      'x-automation-secret'
    ];
    const expected = Buffer.from(this.config.automation.secret);
    const received = Buffer.from(secret ?? '');
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    )
      throw new UnauthorizedException();
    return true;
  }
}
