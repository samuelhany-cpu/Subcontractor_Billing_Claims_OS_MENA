# TEL-002A — Verification report

Status: PRODUCTION ACTIVATED AND LIVE-VERIFIED

## Executed checks

- `pnpm --filter @claims-os/telegram-gateway test` — 4 passed: authorized
  forwarding plus restart offset recovery, unauthorized-update rejection with
  offset advancement, failed webhook delivery without state advancement, and
  singleton poller lock.
- `pnpm --filter @claims-os/telegram-gateway typecheck` — passed.
- Workflow JSON parsing — passed.
- `pnpm format:check` — passed.
- `pnpm lint` — passed with the repository's pre-existing seven warnings and
  no errors.
- `pnpm typecheck` — passed.
- `pnpm test` — passed; API remains 25 suites / 148 tests, plus gateway tests.
- `pnpm build` — passed, including the gateway build.
- Production Compose rendering with `.env.production` — passed. Resolved
  services place only Web on a host port; n8n and gateway are backend-only.
- Docker build of `claims-os-prod-telegram-gateway` — passed.
- Official `n8nio/n8n` image inspected successfully and pinned to
  `sha256:5450af5dbde41b9a770a1e4cc67752e256aa9898294c903f91dccb638eeb86cf`.

## Runtime activation evidence

- n8n 1.123.91 is healthy, uses its persistent volume, and has enforced
  settings-file permissions (`0600`). The Router workflow is active with a
  persisted `activeVersionId`.
- Initial production-webhook failure root cause: the imported Webhook node had
  no stable `webhookId`. n8n therefore recorded the workflow as active but did
  not register `POST /webhook/telegram-update`.
- The corrected Webhook has a stable `webhookId`; after n8n restart, missing
  and invalid gateway secrets are rejected (HTTP 500 from the workflow before
  processing), while a correct-secret synthetic test-mode update returns HTTP
  200 with `ok`, `accepted`, and `synthetic` true. It sends no Telegram message
  and performs no financial write.
- Restart persistence passed: after n8n restart the active workflow and its
  private production route remained available and accepted the same safe
  synthetic delivery.
- Gateway is healthy, runs as UID 1000, is the only gateway container, and has
  a durable `state.json` in its dedicated volume. The state advances only after
  a successful n8n response.
- Gateway restart recovery passed: its persisted offset was unchanged before
  and after a Gateway-only restart, and the restarted process returned healthy.
- n8n and Gateway have no host-published ports. Their non-published egress
  network enables outbound Telegram HTTPS while backend traffic remains on the
  internal backend network. Web remains the only host-published production
  service.

## Live acceptance

The owner sent a private `/start` and received the deployed Arabic welcome
reply. The Gateway offset advanced only after the successful n8n execution.
Initial delivery failed because the locally configured allowed chat was not a
valid Telegram chat for the bot; it was securely corrected from a queued owner
update, then n8n was recreated to load it. No financial workflow was invoked.
