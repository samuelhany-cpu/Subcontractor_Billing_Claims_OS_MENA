import { Inject, Injectable } from '@nestjs/common';
import { API_RUNTIME_CONFIG } from '../config/api-config';
import type { ApiRuntimeConfig } from '../config/api-config';
import { StructuredLoggerService } from '../observability/structured-logger.service';
import { HEALTH_DEPENDENCY_NAMES } from './health.contract';
import type { LivenessResponse, ReadinessResponse } from './health.contract';
import { READINESS_CHECKS } from './readiness-check';
import type { ReadinessCheck } from './readiness-check';

export const HEALTH_CLOCK = Symbol('HEALTH_CLOCK');
export type HealthClock = () => Date;

@Injectable()
export class HealthService {
  constructor(
    @Inject(API_RUNTIME_CONFIG) private readonly config: ApiRuntimeConfig,
    @Inject(READINESS_CHECKS)
    private readonly readinessChecks: readonly ReadinessCheck[],
    @Inject(HEALTH_CLOCK) private readonly clock: HealthClock,
    private readonly logger: StructuredLoggerService,
  ) {}

  liveness(): LivenessResponse {
    return {
      status: 'ok',
      service: this.config.runtime.serviceName,
      timestamp: this.clock().toISOString(),
    };
  }

  async readiness(): Promise<ReadinessResponse> {
    const checkResults = await Promise.all(
      this.readinessChecks.map(async (check) => ({
        name: check.name,
        status: await this.runBounded(check),
      })),
    );
    const resultByName = new Map(
      checkResults.map((result) => [result.name, result.status] as const),
    );
    const checks = {
      postgresql: { status: resultByName.get('postgresql') ?? 'down' },
      redis: { status: resultByName.get('redis') ?? 'down' },
      objectStorage: {
        status: resultByName.get('objectStorage') ?? 'down',
      },
    } as const;
    const ready = HEALTH_DEPENDENCY_NAMES.every(
      (name) => checks[name].status === 'up',
    );

    if (!ready) {
      this.logger.event('warn', 'health.readiness.failed', {
        checks,
      });
    }

    return {
      status: ready ? 'ready' : 'not_ready',
      service: this.config.runtime.serviceName,
      timestamp: this.clock().toISOString(),
      checks,
    };
  }

  private async runBounded(
    readinessCheck: ReadinessCheck,
  ): Promise<'down' | 'up'> {
    let timeout: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        readinessCheck.check(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error('Readiness check timed out')),
            this.config.diagnostics.healthCheckTimeoutMs,
          );
        }),
      ]);
      return 'up';
    } catch {
      return 'down';
    } finally {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
    }
  }
}
