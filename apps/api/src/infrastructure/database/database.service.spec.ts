import {
  DATABASE_CLIENT,
  DatabaseClient,
  DatabaseService,
} from './database.service';
import { InfrastructureDependencyError } from '../infrastructure-error';

function createClient(): jest.Mocked<DatabaseClient> {
  return {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRawUnsafe: jest.fn().mockResolvedValue([{ ready: 1 }]),
  };
}

describe('DatabaseService', () => {
  it('connects once, checks readiness, and shuts down cleanly', async () => {
    const client = createClient();
    const service = new DatabaseService(client);

    await service.checkReadiness();
    await service.checkReadiness();
    await service.onApplicationShutdown();
    await service.onApplicationShutdown();

    expect(client.$connect.mock.calls).toHaveLength(1);
    expect(client.$queryRawUnsafe.mock.calls).toEqual([
      ['SELECT 1 AS ready'],
      ['SELECT 1 AS ready'],
    ]);
    expect(client.$disconnect.mock.calls).toHaveLength(1);
  });

  it('translates connection failures without exposing connection details', async () => {
    const client = createClient();
    client.$connect.mockRejectedValueOnce(
      new Error('postgresql://user:secret@private-host/database'),
    );
    const service = new DatabaseService(client);

    const error = await service.connect().catch((caught: unknown) => caught);

    expect(error).toEqual(new InfrastructureDependencyError('postgresql'));
    expect(error).not.toHaveProperty(
      'message',
      expect.stringContaining('secret'),
    );
  });

  it('exports a stable injection token', () => {
    expect(typeof DATABASE_CLIENT).toBe('symbol');
  });
});
