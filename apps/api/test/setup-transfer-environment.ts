const isolatedDatabaseUrl = process.env.DATABASE_URL;
if (isolatedDatabaseUrl === undefined) {
  throw new Error('DATABASE_URL is required for Transfer integration tests');
}
Object.assign(process.env, {
  NODE_ENV: 'test',
  SERVICE_NAME: 'claims-os-api',
  API_HOST: '127.0.0.1',
  API_PORT: '4006',
  API_PUBLIC_URL: 'http://localhost:4006',
  WEB_URL: 'http://localhost:3000',
  CORS_ORIGINS: 'http://localhost:3000',
  LOG_LEVEL: 'error',
  LOG_FORMAT: 'json',
  REQUEST_LOGGING: 'false',
  HEALTH_CHECK_TIMEOUT_MS: '1000',
  DATABASE_URL: isolatedDatabaseUrl,
  REDIS_URL: 'redis://:claims_local_redis_password@127.0.0.1:6379/0',
  OBJECT_STORAGE_ENDPOINT: 'http://127.0.0.1:9000',
  OBJECT_STORAGE_REGION: 'us-east-1',
  OBJECT_STORAGE_BUCKET: 'claims-documents-local',
  OBJECT_STORAGE_ACCESS_KEY: 'claims_local_minio',
  OBJECT_STORAGE_SECRET_KEY: 'claims_local_minio_secret',
  OBJECT_STORAGE_SECURE: 'false',
  OBJECT_STORAGE_FORCE_PATH_STYLE: 'true',
  ATTACHMENT_ALLOWED_MIME_TYPES:
    'image/jpeg,image/png,image/webp,application/pdf',
  ATTACHMENT_MAX_BYTES: '10485760',
  ATTACHMENT_MAX_PER_EXPENSE: '10',
});
