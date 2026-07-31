import { spawn } from 'node:child_process';
import { Client } from 'pg';

const DEFAULT_ADMIN_URL =
  'postgresql://claims_local:claims_local_password@127.0.0.1:55432/postgres';
const databaseName = `expense_tracker_prj_001_${process.pid}_${Date.now()}`;
const adminUrl = new URL(
  process.env.PROJECT_DATABASE_ADMIN_URL ?? DEFAULT_ADMIN_URL,
);
adminUrl.pathname = '/postgres';
const databaseUrl = new URL(adminUrl);
databaseUrl.pathname = `/${databaseName}`;

function run(command: string, args: readonly string[]): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl.toString() },
      stdio: 'inherit',
      shell: false,
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited with code ${String(code)}`));
    });
  });
}

function runPnpm(args: readonly string[]): Promise<void> {
  const pnpmCli = process.env.npm_execpath;
  if (pnpmCli === undefined) throw new Error('pnpm CLI path is unavailable');
  return run(pnpmCli, args);
}

async function createDatabase(): Promise<void> {
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${databaseName}"`);
  } finally {
    await admin.end();
  }
}

async function dropDatabase(): Promise<void> {
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    await admin.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [databaseName],
    );
    await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
  } finally {
    await admin.end();
  }
}

async function main(): Promise<void> {
  await createDatabase();
  try {
    await runPnpm([
      'exec',
      'prisma',
      'migrate',
      'deploy',
      '--schema',
      'prisma/schema.prisma',
    ]);
    await runPnpm([
      'exec',
      'prisma',
      'migrate',
      'status',
      '--schema',
      'prisma/schema.prisma',
    ]);
    await runPnpm([
      'exec',
      'jest',
      '--config',
      'test/jest-projects.json',
      '--runInBand',
    ]);
  } finally {
    await dropDatabase();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(
    `Projects test harness failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
  );
  process.exitCode = 1;
});
