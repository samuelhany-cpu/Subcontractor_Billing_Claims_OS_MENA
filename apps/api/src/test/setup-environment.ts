Object.assign(process.env, {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '4001',
  API_PUBLIC_URL: 'http://localhost:4001',
  WEB_URL: 'http://localhost:3000',
  CORS_ORIGINS: 'http://localhost:3000',
  LOG_LEVEL: 'error',
  DATABASE_URL:
    'postgresql://test_user:test_password@127.0.0.1:55432/claims_test',
  REDIS_URL: 'redis://:test_password@127.0.0.1:6379/0',
  OBJECT_STORAGE_ENDPOINT: 'http://127.0.0.1:9000',
  OBJECT_STORAGE_REGION: 'us-east-1',
  OBJECT_STORAGE_BUCKET: 'claims-test-private',
  OBJECT_STORAGE_ACCESS_KEY: 'test_access_key',
  OBJECT_STORAGE_SECRET_KEY: 'test_secret_key',
  OBJECT_STORAGE_SECURE: 'false',
  OBJECT_STORAGE_FORCE_PATH_STYLE: 'true',
});
