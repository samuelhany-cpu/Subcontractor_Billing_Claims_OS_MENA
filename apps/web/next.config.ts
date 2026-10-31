import type { NextConfig } from 'next';
import path from 'node:path';

const allowedOrigins = process.env.NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS?.split(
  ',',
)
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  experimental: {
    serverActions: {
      bodySizeLimit: '11mb',
      ...(allowedOrigins && allowedOrigins.length > 0
        ? { allowedOrigins }
        : {}),
    },
  },
  reactCompiler: true,
};

export default nextConfig;
