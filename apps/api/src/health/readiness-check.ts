import { HealthDependencyName } from './health.contract';

export const READINESS_CHECKS = Symbol('READINESS_CHECKS');

export interface ReadinessCheck {
  readonly name: HealthDependencyName;
  check(this: void): Promise<void>;
}
