export type InfrastructureDependency =
  'object-storage' | 'postgresql' | 'redis';

export class InfrastructureDependencyError extends Error {
  constructor(readonly dependency: InfrastructureDependency) {
    super(`${dependency} dependency operation failed`);
    this.name = 'InfrastructureDependencyError';
  }
}
