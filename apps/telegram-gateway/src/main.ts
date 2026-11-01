import { createServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { TelegramGateway } from './gateway.js';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const statePath = process.env.TELEGRAM_GATEWAY_STATE_PATH ?? '/data/state.json';
await mkdir(dirname(statePath), { recursive: true });
const gateway = new TelegramGateway({
  botToken: required('TELEGRAM_BOT_TOKEN'),
  allowedChatId: required('TELEGRAM_ALLOWED_CHAT_ID'),
  n8nWebhookUrl: required('N8N_GATEWAY_WEBHOOK_URL'),
  n8nSecret: required('GATEWAY_N8N_SECRET'),
  statePath,
  pollTimeoutSeconds: Number(process.env.TELEGRAM_POLL_TIMEOUT_SECONDS ?? '25'),
  fetch,
});

const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end('{"status":"ok"}');
});
server.listen(8080, '0.0.0.0');
void gateway.run().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Telegram gateway failed',
  );
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    gateway.stop();
    server.close();
  });
}
