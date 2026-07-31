import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { InfrastructureDependencyError } from '../infrastructure-error';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export interface RedisClient {
  connect(): Promise<void>;
  disconnect(reconnect?: boolean): void;
  ping(): Promise<string>;
  quit(): Promise<string>;
}

@Injectable()
export class RedisService implements OnApplicationShutdown {
  private connected = false;
  private closed = false;

  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClient) {}

  async connect(): Promise<void> {
    if (this.closed) {
      throw new InfrastructureDependencyError('redis');
    }

    if (this.connected) {
      return;
    }

    try {
      await this.client.connect();
      this.connected = true;
    } catch {
      throw new InfrastructureDependencyError('redis');
    }
  }

  async checkReadiness(): Promise<void> {
    await this.connect();

    try {
      const response = await this.client.ping();
      if (response !== 'PONG') {
        throw new Error('Unexpected Redis readiness response');
      }
    } catch {
      throw new InfrastructureDependencyError('redis');
    }
  }

  async disconnect(): Promise<void> {
    if (this.closed) {
      return;
    }

    try {
      if (this.connected) {
        await this.client.quit();
      } else {
        this.client.disconnect(false);
      }
    } finally {
      this.connected = false;
      this.closed = true;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.disconnect();
  }
}
