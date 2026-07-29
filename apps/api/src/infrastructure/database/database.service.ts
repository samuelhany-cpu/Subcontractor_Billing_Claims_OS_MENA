import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { InfrastructureDependencyError } from '../infrastructure-error';

export const DATABASE_CLIENT = Symbol('DATABASE_CLIENT');

export interface DatabaseClient {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $queryRawUnsafe<T>(query: string): Promise<T>;
}

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private connected = false;

  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabaseClient,
  ) {}

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      await this.client.$connect();
      this.connected = true;
    } catch {
      throw new InfrastructureDependencyError('postgresql');
    }
  }

  async checkReadiness(): Promise<void> {
    await this.connect();

    try {
      await this.client.$queryRawUnsafe<readonly [{ ready: number }]>(
        'SELECT 1 AS ready',
      );
    } catch {
      throw new InfrastructureDependencyError('postgresql');
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    await this.client.$disconnect();
    this.connected = false;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.disconnect();
  }
}
