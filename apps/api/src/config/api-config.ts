import { z } from 'zod';

export const API_RUNTIME_CONFIG = Symbol('API_RUNTIME_CONFIG');
export const REDACTED_VALUE = '[REDACTED]' as const;

const LOCAL_DEVELOPMENT_DEFAULTS = {
  databasePassword: 'claims_local_password',
  redisPassword: 'claims_local_redis_password',
  storageAccessKey: 'claims_local_minio',
  storageSecretKey: 'claims_local_minio_secret',
} as const;

const nonEmptyString = z.string().trim().min(1, 'must not be empty');
const urlString = z.string().trim().url('must be a valid URL');
const portString = z
  .string()
  .regex(/^[0-9]+$/, 'must be an integer between 1 and 65535')
  .transform(Number)
  .pipe(z.number().int().min(1).max(65535));
const booleanString = z
  .enum(['true', 'false'], {
    error: 'must be either true or false',
  })
  .transform((value) => value === 'true');

function connectionUrl(protocols: readonly string[], label: string) {
  return urlString.refine((value) => {
    try {
      return protocols.includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, `${label} uses an unsupported protocol`);
}

const rawEnvironmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    API_HOST: nonEmptyString.default('127.0.0.1'),
    API_PORT: portString.default(4000),
    API_PUBLIC_URL: urlString,
    WEB_URL: urlString,
    CORS_ORIGINS: nonEmptyString.transform((value, context) => {
      const origins = value.split(',').map((origin) => origin.trim());

      for (const origin of origins) {
        const parsed = z.string().url().safeParse(origin);
        if (!parsed.success) {
          context.addIssue({
            code: 'custom',
            message: `contains an invalid origin`,
          });
          return z.NEVER;
        }
      }

      return origins;
    }),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),
    DATABASE_URL: connectionUrl(['postgres:', 'postgresql:'], 'DATABASE_URL'),
    REDIS_URL: connectionUrl(['redis:', 'rediss:'], 'REDIS_URL'),
    OBJECT_STORAGE_ENDPOINT: connectionUrl(
      ['http:', 'https:'],
      'OBJECT_STORAGE_ENDPOINT',
    ),
    OBJECT_STORAGE_REGION: nonEmptyString.default('us-east-1'),
    OBJECT_STORAGE_BUCKET: nonEmptyString.regex(
      /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/,
      'must be a valid S3 bucket name',
    ),
    OBJECT_STORAGE_ACCESS_KEY: nonEmptyString,
    OBJECT_STORAGE_SECRET_KEY: nonEmptyString,
    OBJECT_STORAGE_SECURE: booleanString.default(false),
    OBJECT_STORAGE_FORCE_PATH_STYLE: booleanString.default(true),
  })
  .superRefine((environment, context) => {
    let storageUrl: URL;
    try {
      storageUrl = new URL(environment.OBJECT_STORAGE_ENDPOINT);
    } catch {
      return;
    }
    const storageProtocol = storageUrl.protocol;

    if (
      (environment.OBJECT_STORAGE_SECURE && storageProtocol !== 'https:') ||
      (!environment.OBJECT_STORAGE_SECURE && storageProtocol !== 'http:')
    ) {
      context.addIssue({
        code: 'custom',
        path: ['OBJECT_STORAGE_SECURE'],
        message: 'must match the object-storage endpoint protocol',
      });
    }

    if (environment.NODE_ENV !== 'production') {
      return;
    }

    let databaseUrl: URL;
    let redisUrl: URL;
    try {
      databaseUrl = new URL(environment.DATABASE_URL);
      redisUrl = new URL(environment.REDIS_URL);
    } catch {
      return;
    }
    const localHosts = new Set(['127.0.0.1', 'localhost', 'minio', 'postgres']);

    if (
      localHosts.has(databaseUrl.hostname) ||
      databaseUrl.password === LOCAL_DEVELOPMENT_DEFAULTS.databasePassword
    ) {
      context.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'must not use local development defaults in production',
      });
    }

    if (
      localHosts.has(redisUrl.hostname) ||
      redisUrl.password === LOCAL_DEVELOPMENT_DEFAULTS.redisPassword
    ) {
      context.addIssue({
        code: 'custom',
        path: ['REDIS_URL'],
        message: 'must not use local development defaults in production',
      });
    }

    if (localHosts.has(storageUrl.hostname)) {
      context.addIssue({
        code: 'custom',
        path: ['OBJECT_STORAGE_ENDPOINT'],
        message: 'must not use a local endpoint in production',
      });
    }

    if (
      environment.OBJECT_STORAGE_ACCESS_KEY ===
      LOCAL_DEVELOPMENT_DEFAULTS.storageAccessKey
    ) {
      context.addIssue({
        code: 'custom',
        path: ['OBJECT_STORAGE_ACCESS_KEY'],
        message: 'must not use the local development default in production',
      });
    }

    if (
      environment.OBJECT_STORAGE_SECRET_KEY ===
      LOCAL_DEVELOPMENT_DEFAULTS.storageSecretKey
    ) {
      context.addIssue({
        code: 'custom',
        path: ['OBJECT_STORAGE_SECRET_KEY'],
        message: 'must not use the local development default in production',
      });
    }
  });

export interface ApiRuntimeConfig {
  readonly runtime: {
    readonly environment: 'development' | 'test' | 'production';
    readonly logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  };
  readonly server: {
    readonly host: string;
    readonly port: number;
    readonly publicUrl: string;
  };
  readonly http: {
    readonly webUrl: string;
    readonly corsOrigins: readonly string[];
  };
  readonly database: {
    readonly url: string;
  };
  readonly redis: {
    readonly url: string;
  };
  readonly objectStorage: {
    readonly endpoint: string;
    readonly region: string;
    readonly bucket: string;
    readonly accessKey: string;
    readonly secretKey: string;
    readonly secure: boolean;
    readonly forcePathStyle: boolean;
  };
}

export interface PublicWebRuntimeConfig {
  readonly apiUrl: string;
  readonly appUrl: string;
}

export type RedactedApiRuntimeConfig = Omit<
  ApiRuntimeConfig,
  'database' | 'redis' | 'objectStorage'
> & {
  readonly database: { readonly url: typeof REDACTED_VALUE };
  readonly redis: { readonly url: typeof REDACTED_VALUE };
  readonly objectStorage: Omit<
    ApiRuntimeConfig['objectStorage'],
    'accessKey' | 'secretKey'
  > & {
    readonly accessKey: typeof REDACTED_VALUE;
    readonly secretKey: typeof REDACTED_VALUE;
  };
};

export class RuntimeConfigurationError extends Error {
  constructor(readonly fields: readonly string[]) {
    super(`Invalid runtime configuration: ${fields.join('; ')}`);
    this.name = 'RuntimeConfigurationError';
  }
}

export function parseApiEnvironment(
  environment: Record<string, string | undefined>,
): ApiRuntimeConfig {
  const result = rawEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    throw new RuntimeConfigurationError(
      result.error.issues.map((issue) => {
        const field = issue.path.join('.') || 'environment';
        return `${field}: ${issue.message}`;
      }),
    );
  }

  const value = result.data;

  return Object.freeze({
    runtime: Object.freeze({
      environment: value.NODE_ENV,
      logLevel: value.LOG_LEVEL,
    }),
    server: Object.freeze({
      host: value.API_HOST,
      port: value.API_PORT,
      publicUrl: value.API_PUBLIC_URL,
    }),
    http: Object.freeze({
      webUrl: value.WEB_URL,
      corsOrigins: Object.freeze([...value.CORS_ORIGINS]),
    }),
    database: Object.freeze({ url: value.DATABASE_URL }),
    redis: Object.freeze({ url: value.REDIS_URL }),
    objectStorage: Object.freeze({
      endpoint: value.OBJECT_STORAGE_ENDPOINT,
      region: value.OBJECT_STORAGE_REGION,
      bucket: value.OBJECT_STORAGE_BUCKET,
      accessKey: value.OBJECT_STORAGE_ACCESS_KEY,
      secretKey: value.OBJECT_STORAGE_SECRET_KEY,
      secure: value.OBJECT_STORAGE_SECURE,
      forcePathStyle: value.OBJECT_STORAGE_FORCE_PATH_STYLE,
    }),
  });
}

export function redactApiRuntimeConfig(
  config: ApiRuntimeConfig,
): RedactedApiRuntimeConfig {
  return {
    runtime: config.runtime,
    server: config.server,
    http: config.http,
    database: { url: REDACTED_VALUE },
    redis: { url: REDACTED_VALUE },
    objectStorage: {
      endpoint: config.objectStorage.endpoint,
      region: config.objectStorage.region,
      bucket: config.objectStorage.bucket,
      secure: config.objectStorage.secure,
      forcePathStyle: config.objectStorage.forcePathStyle,
      accessKey: REDACTED_VALUE,
      secretKey: REDACTED_VALUE,
    },
  };
}

export function toPublicWebRuntimeConfig(
  config: ApiRuntimeConfig,
): PublicWebRuntimeConfig {
  return {
    apiUrl: new URL('/api/v1', config.server.publicUrl).toString(),
    appUrl: config.http.webUrl,
  };
}
