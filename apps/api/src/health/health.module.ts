import { Module } from '@nestjs/common';
import { DatabaseService } from '../infrastructure/database/database.service';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ObjectStorageService } from '../infrastructure/object-storage/object-storage.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { HealthController } from './health.controller';
import { HEALTH_CLOCK, HealthService } from './health.service';
import { READINESS_CHECKS, ReadinessCheck } from './readiness-check';

@Module({
  imports: [InfrastructureModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    {
      provide: HEALTH_CLOCK,
      useValue: (): Date => new Date(),
    },
    {
      provide: READINESS_CHECKS,
      inject: [DatabaseService, RedisService, ObjectStorageService],
      useFactory: (
        database: DatabaseService,
        redis: RedisService,
        objectStorage: ObjectStorageService,
      ): readonly ReadinessCheck[] => [
        {
          name: 'postgresql',
          check: () => database.checkReadiness(),
        },
        {
          name: 'redis',
          check: () => redis.checkReadiness(),
        },
        {
          name: 'objectStorage',
          check: () => objectStorage.checkReadiness(),
        },
      ],
    },
  ],
  exports: [HealthService, READINESS_CHECKS],
})
export class HealthModule {}
