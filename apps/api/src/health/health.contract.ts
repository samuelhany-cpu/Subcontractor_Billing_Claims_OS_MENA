export const HEALTH_DEPENDENCY_NAMES = [
  'postgresql',
  'redis',
  'objectStorage',
] as const;

export type HealthDependencyName = (typeof HEALTH_DEPENDENCY_NAMES)[number];

export interface LivenessResponse {
  readonly status: 'ok';
  readonly service: string;
  readonly timestamp: string;
}

export interface ReadinessCheckResponse {
  readonly status: 'down' | 'up';
}

export interface ReadinessResponse {
  readonly status: 'not_ready' | 'ready';
  readonly service: string;
  readonly timestamp: string;
  readonly checks: Readonly<
    Record<HealthDependencyName, ReadinessCheckResponse>
  >;
}
