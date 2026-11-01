import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { GatewayConfig, TelegramGateway } from './gateway.js';

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function requestUrl(input: unknown): string {
  if (input instanceof URL) return input.toString();
  return typeof input === 'string' ? input : 'request-object';
}

function gatewayConfig(
  directory: string,
  fetch: typeof globalThis.fetch,
): GatewayConfig {
  return {
    botToken: 'test-token',
    allowedChatId: '42',
    n8nWebhookUrl: 'http://n8n/webhook/telegram-update',
    n8nSecret: 'test-secret',
    statePath: join(directory, 'state.json'),
    pollTimeoutSeconds: 1,
    fetch,
  };
}

void test('forwards one allowed update, persists offset, and rejects duplicate polling', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'telegram-gateway-'));
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  const gateway = new TelegramGateway({
    botToken: 'test-token',
    allowedChatId: '42',
    n8nWebhookUrl: 'http://n8n/webhook/telegram-update',
    n8nSecret: 'test-secret',
    statePath: join(directory, 'state.json'),
    pollTimeoutSeconds: 1,
    fetch: (input, init) => {
      calls.push({ url: requestUrl(input), init });
      return Promise.resolve(
        calls.length === 1
          ? response({
              ok: true,
              result: [
                { update_id: 8, message: { chat: { id: 42 }, text: '/start' } },
              ],
            })
          : response({
              ok: true,
              result: [
                { update_id: 8, message: { chat: { id: 42 }, text: '/start' } },
              ],
            }),
      );
    },
  });
  await gateway.pollOnce();
  const restarted = new TelegramGateway({
    ...gatewayConfig(directory, (input, init) => {
      calls.push({ url: requestUrl(input), init });
      return Promise.resolve(
        response({
          ok: true,
          result: [
            { update_id: 8, message: { chat: { id: 42 }, text: '/start' } },
          ],
        }),
      );
    }),
  });
  await restarted.pollOnce();
  assert.equal(
    calls.filter((call) => call.url.startsWith('http://n8n')).length,
    1,
  );
  assert.match(
    await readFile(join(directory, 'state.json'), 'utf8'),
    /"nextOffset":9/,
  );
});

void test('does not forward an unauthorized chat but advances its offset', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'telegram-gateway-'));
  const calls: string[] = [];
  const gateway = new TelegramGateway({
    botToken: 'test-token',
    allowedChatId: '42',
    n8nWebhookUrl: 'http://n8n/webhook/telegram-update',
    n8nSecret: 'test-secret',
    statePath: join(directory, 'state.json'),
    pollTimeoutSeconds: 1,
    fetch: (input) => {
      calls.push(requestUrl(input));
      return Promise.resolve(
        response({
          ok: true,
          result: [
            { update_id: 4, message: { chat: { id: 9 }, text: '/start' } },
          ],
        }),
      );
    },
  });
  await gateway.pollOnce();
  assert.equal(calls.filter((url) => url.startsWith('http://n8n')).length, 0);
  assert.match(
    await readFile(join(directory, 'state.json'), 'utf8'),
    /"nextOffset":5/,
  );
});

void test('does not advance the offset when n8n rejects delivery', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'telegram-gateway-'));
  let calls = 0;
  const gateway = new TelegramGateway({
    botToken: 'test-token',
    allowedChatId: '42',
    n8nWebhookUrl: 'http://n8n/webhook/telegram-update',
    n8nSecret: 'test-secret',
    statePath: join(directory, 'state.json'),
    pollTimeoutSeconds: 1,
    fetch: () => {
      calls += 1;
      return Promise.resolve(
        calls === 1
          ? response({
              ok: true,
              result: [
                { update_id: 7, message: { chat: { id: 42 }, text: '/start' } },
              ],
            })
          : new Response('', { status: 503 }),
      );
    },
  });
  await assert.rejects(gateway.pollOnce());
  await assert.rejects(readFile(join(directory, 'state.json'), 'utf8'));
});

void test('enforces a singleton poller lock', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'telegram-gateway-'));
  const config = gatewayConfig(directory, () =>
    Promise.resolve(response({ ok: true, result: [] })),
  );
  const first = new TelegramGateway(config);
  const second = new TelegramGateway(config);
  await first.acquireLock();
  await assert.rejects(second.acquireLock(), /already active/);
  await first.releaseLock();
  await second.acquireLock();
  await second.releaseLock();
});
