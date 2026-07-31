import 'dotenv/config';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import {
  RuntimeConfigurationError,
  parseApiEnvironment,
} from '../config/api-config';
import { DatabaseService } from './database/database.service';
import { ObjectStorageService } from './object-storage/object-storage.service';
import { RedisService } from './redis/redis.service';

async function checkInfrastructure(): Promise<void> {
  const config = parseApiEnvironment(process.env);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: config.database.url }),
  });
  const redisClient = new Redis(config.redis.url, {
    connectTimeout: config.diagnostics.healthCheckTimeoutMs,
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  const storageClient = new S3Client({
    endpoint: config.objectStorage.endpoint,
    region: config.objectStorage.region,
    forcePathStyle: config.objectStorage.forcePathStyle,
    credentials: {
      accessKeyId: config.objectStorage.accessKey,
      secretAccessKey: config.objectStorage.secretKey,
    },
  });
  const database = new DatabaseService(prisma);
  const redis = new RedisService(redisClient);
  const storage = new ObjectStorageService(
    storageClient,
    config.objectStorage.bucket,
    getSignedUrl,
  );

  try {
    await database.checkReadiness();
    await redis.checkReadiness();
    await storage.checkReadiness();

    console.log(
      JSON.stringify({
        dependencies: {
          objectStorage: 'ready',
          postgresql: 'ready',
          redis: 'ready',
        },
      }),
    );
  } finally {
    storageClient.destroy();
    await Promise.allSettled([database.disconnect(), redis.disconnect()]);
  }
}

void checkInfrastructure().catch((error: unknown) => {
  const configurationErrors =
    error instanceof RuntimeConfigurationError ? error.fields : undefined;
  const dependency =
    error instanceof Error && 'dependency' in error
      ? String(error.dependency)
      : 'configuration';
  console.error(
    JSON.stringify({
      dependencies: {
        [dependency]: 'unavailable',
      },
      ...(configurationErrors === undefined ? {} : { configurationErrors }),
    }),
  );
  process.exitCode = 1;
});
