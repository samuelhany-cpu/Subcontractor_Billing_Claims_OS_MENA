# TEL-002A — Telegram polling transport and router

Status: ACTIVATED AND LIVE-VERIFIED

TEL-002A adds the private transport required for the first Telegram response;
it does not add any financial-write conversation. TEL-001 remains the sole
owner of financial validation, confirmation, audit, and idempotency.

## Components

- `apps/telegram-gateway` obtains updates with Telegram Bot API long polling.
  It atomically persists the next update offset in a dedicated Docker volume,
  forwards only the configured private chat, and uses a filesystem lock to
  prevent a second poller from using the same persistent state.
- Gateway-to-n8n delivery uses the internal `backend` Docker network and a
  dedicated `x-gateway-secret`. A non-successful delivery does not advance the
  Telegram offset, so it can be retried safely.
- The n8n Router workflow is imported at n8n startup from the read-only
  workflow mount. It validates the gateway secret and allowed chat ID, handles
  `/start`, `/help`, and other text in Arabic, and sends replies through the
  Telegram Bot API. It creates no financial data.

## Deployment boundaries

- `n8n` and `telegram-gateway` retain private backend access and have no
  published host port. Their separate non-published `egress` network provides
  the outbound HTTPS path required for Telegram; it does not expose either
  service to the Windows host or LAN. The existing Web service remains the
  only host-published service.
- n8n state and gateway polling state have their own production-local named
  volumes. Existing PostgreSQL, Redis, MinIO, Web, and API volumes are not
  changed.
- Secrets are read only from ignored `.env.production`; examples contain
  placeholders. A new gateway-to-n8n secret was generated locally without
  revealing or committing it. Existing secrets and the n8n encryption key were
  retained.
- Before activation, Telegram `getWebhookInfo` reported no configured webhook,
  no last error, and one pending update. No webhook configuration was changed.

## Runtime correction and activation

n8n 1.123.91 imported the original Router as active but did not register its
production route because its Webhook node had no `webhookId`. The corrected
Webhook node is type `n8n-nodes-base.webhook` 2.2, with stable ID
`976cc293-f539-4a30-9bd6-c6dce5e972b3`, POST path `telegram-update`, and an
active persisted workflow version. Its verified production route is
`http://n8n:5678/webhook/telegram-update` on the backend network.

The Router returns an error before processing missing/invalid gateway secrets,
and accepts a correct-secret synthetic test header without sending a Telegram
message or persisting the synthetic update. Its ordinary route sends the
Arabic response before recording an update ID; a failed Telegram send therefore
leaves the gateway offset unacknowledged for retry.

The Gateway image initializes only `/data` as root then drops to the `node`
user. It uses the dedicated persistent volume for the lock and atomic offset
state. Both new services are running. The Gateway advances its offset after
n8n accepts an update. The owner sent `/start` and received the Arabic reply.

The initial configured `TELEGRAM_ALLOWED_CHAT_ID` was not a Telegram chat for
this bot (`chat not found`). The value was securely corrected from an update
queued after the owner sent `/start`, and n8n was recreated to load that local
environment change. No token, chat ID, or other secret is recorded here.
