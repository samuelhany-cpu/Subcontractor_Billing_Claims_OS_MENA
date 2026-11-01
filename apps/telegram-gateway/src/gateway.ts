import {
  open,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';

export type TelegramUpdate = {
  readonly update_id: number;
  readonly message?: {
    readonly chat?: { readonly id?: number };
    readonly text?: string;
  };
  readonly callback_query?: {
    readonly message?: { readonly chat?: { readonly id?: number } };
  };
};

type PollState = { readonly nextOffset: number };

export type GatewayConfig = {
  readonly botToken: string;
  readonly allowedChatId: string;
  readonly n8nWebhookUrl: string;
  readonly n8nSecret: string;
  readonly statePath: string;
  readonly pollTimeoutSeconds: number;
  readonly fetch: typeof fetch;
};

function chatId(update: TelegramUpdate): string | undefined {
  const value =
    update.message?.chat?.id ?? update.callback_query?.message?.chat?.id;
  return value === undefined ? undefined : String(value);
}

export class TelegramGateway {
  private readonly lockPath: string;
  private locked = false;
  private stopped = false;

  constructor(private readonly config: GatewayConfig) {
    this.lockPath = join(dirname(config.statePath), 'poller.lock');
  }

  async acquireLock(): Promise<void> {
    try {
      const handle = await open(this.lockPath, 'wx');
      await handle.writeFile(String(process.pid));
      await handle.close();
      this.locked = true;
    } catch (error) {
      const details = await stat(this.lockPath).catch(() => undefined);
      if (details !== undefined && Date.now() - details.mtimeMs > 90_000) {
        await unlink(this.lockPath);
        return this.acquireLock();
      }
      throw new Error('Another Telegram gateway poller is already active', {
        cause: error,
      });
    }
  }

  async releaseLock(): Promise<void> {
    if (!this.locked) return;
    this.locked = false;
    await unlink(this.lockPath).catch(() => undefined);
  }

  stop(): void {
    this.stopped = true;
  }

  async pollOnce(): Promise<void> {
    const state = await this.readState();
    const endpoint = new URL(
      `https://api.telegram.org/bot${this.config.botToken}/getUpdates`,
    );
    endpoint.searchParams.set('offset', String(state.nextOffset));
    endpoint.searchParams.set(
      'timeout',
      String(this.config.pollTimeoutSeconds),
    );
    endpoint.searchParams.set(
      'allowed_updates',
      '["message","callback_query"]',
    );
    const response = await this.config.fetch(endpoint, {
      signal: AbortSignal.timeout((this.config.pollTimeoutSeconds + 10) * 1000),
    });
    if (!response.ok)
      throw new Error(`Telegram polling failed: ${response.status}`);
    const payload = (await response.json()) as {
      readonly ok: boolean;
      readonly result?: TelegramUpdate[];
    };
    if (!payload.ok || payload.result === undefined)
      throw new Error('Telegram returned an invalid polling response');
    for (const update of payload.result) {
      if (update.update_id < state.nextOffset) continue;
      if (chatId(update) === this.config.allowedChatId)
        await this.forward(update);
      await this.writeState({ nextOffset: update.update_id + 1 });
    }
  }

  async run(): Promise<void> {
    await this.acquireLock();
    let delay = 1_000;
    try {
      while (!this.stopped) {
        try {
          await this.pollOnce();
          delay = 1_000;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * 2, 30_000);
        }
      }
    } finally {
      await this.releaseLock();
    }
  }

  private async forward(update: TelegramUpdate): Promise<void> {
    const response = await this.config.fetch(this.config.n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-gateway-secret': this.config.n8nSecret,
        'x-telegram-update-id': String(update.update_id),
      },
      body: JSON.stringify({ update }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`n8n webhook failed: ${response.status}`);
  }

  private async readState(): Promise<PollState> {
    const serialized = await readFile(this.config.statePath, 'utf8').catch(
      () => undefined,
    );
    if (serialized === undefined) return { nextOffset: 0 };
    const state = JSON.parse(serialized) as PollState;
    if (!Number.isSafeInteger(state.nextOffset) || state.nextOffset < 0)
      throw new Error('Telegram gateway state is invalid');
    return state;
  }

  private async writeState(state: PollState): Promise<void> {
    const temporary = `${this.config.statePath}.tmp`;
    await writeFile(temporary, JSON.stringify(state), { mode: 0o600 });
    await rename(temporary, this.config.statePath);
  }
}
