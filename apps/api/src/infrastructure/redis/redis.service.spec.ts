import { InfrastructureDependencyError } from '../infrastructure-error';
import { RedisClient, RedisService } from './redis.service';

function createClient(): jest.Mocked<RedisClient> {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
  };
}

describe('RedisService', () => {
  it('uses controlled connection and clean shutdown lifecycles', async () => {
    const client = createClient();
    const service = new RedisService(client);

    await service.checkReadiness();
    await service.checkReadiness();
    await service.onApplicationShutdown();
    await service.onApplicationShutdown();

    expect(client.connect.mock.calls).toHaveLength(1);
    expect(client.ping.mock.calls).toHaveLength(2);
    expect(client.quit.mock.calls).toHaveLength(1);
  });

  it('translates ping failures without leaking the Redis URL', async () => {
    const client = createClient();
    client.ping.mockRejectedValueOnce(
      new Error('redis://:secret@private-host:6379'),
    );
    const service = new RedisService(client);

    await expect(service.checkReadiness()).rejects.toEqual(
      new InfrastructureDependencyError('redis'),
    );
    await expect(service.checkReadiness()).resolves.toBeUndefined();
  });
});
