import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { API_RUNTIME_CONFIG, ApiRuntimeConfig } from '../config/api-config';
import {
  DATABASE_CLIENT,
  DatabaseClient,
  DatabaseService,
} from './database/database.service';
import {
  OBJECT_STORAGE_BUCKET,
  OBJECT_STORAGE_CLIENT,
  OBJECT_STORAGE_SIGNER,
  ObjectStorageService,
} from './object-storage/object-storage.service';
import { REDIS_CLIENT, RedisClient, RedisService } from './redis/redis.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Module({
  providers: [
    {
      provide: DATABASE_CLIENT,
      inject: [API_RUNTIME_CONFIG],
      useFactory: (config: ApiRuntimeConfig): DatabaseClient => {
        const adapter = new PrismaPg({
          connectionString: config.database.url,
        });
        return new PrismaClient({ adapter });
      },
    },
    {
      provide: REDIS_CLIENT,
      inject: [API_RUNTIME_CONFIG],
      useFactory: (config: ApiRuntimeConfig): RedisClient =>
        new Redis(config.redis.url, {
          enableOfflineQueue: false,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        }),
    },
    {
      provide: OBJECT_STORAGE_CLIENT,
      inject: [API_RUNTIME_CONFIG],
      useFactory: (config: ApiRuntimeConfig): S3Client =>
        new S3Client({
          endpoint: config.objectStorage.endpoint,
          region: config.objectStorage.region,
          forcePathStyle: config.objectStorage.forcePathStyle,
          credentials: {
            accessKeyId: config.objectStorage.accessKey,
            secretAccessKey: config.objectStorage.secretKey,
          },
        }),
    },
    {
      provide: OBJECT_STORAGE_BUCKET,
      inject: [API_RUNTIME_CONFIG],
      useFactory: (config: ApiRuntimeConfig): string =>
        config.objectStorage.bucket,
    },
    {
      provide: OBJECT_STORAGE_SIGNER,
      useValue: getSignedUrl,
    },
    DatabaseService,
    RedisService,
    {
      provide: ObjectStorageService,
      inject: [
        OBJECT_STORAGE_CLIENT,
        OBJECT_STORAGE_BUCKET,
        OBJECT_STORAGE_SIGNER,
      ],
      useFactory: (
        client: S3Client,
        bucket: string,
        signer: typeof getSignedUrl,
      ): ObjectStorageService =>
        new ObjectStorageService(client, bucket, signer),
    },
  ],
  exports: [DatabaseService, RedisService, ObjectStorageService],
})
export class InfrastructureModule {}
