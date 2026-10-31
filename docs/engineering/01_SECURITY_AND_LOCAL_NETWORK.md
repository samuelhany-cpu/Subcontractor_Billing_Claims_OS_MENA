# Security and Local Network

## Confirmed access model

- Single user.
- No application login page.
- Web app available on the private LAN.
- Host computer runs Windows and remains on.

## Consequence

Any person/device able to reach the app on the LAN may be able to view or change data.

This is accepted as the current product decision. The UI must not pretend that user authentication exists.

## Required controls despite no login

- Bind web access only to private network interfaces/firewall scope.
- Do not publish database, Redis, or MinIO publicly.
- Keep API internal behind web/reverse proxy where practical.
- Validate all inputs.
- Protect against CSRF for state-changing browser operations.
- Use secure file upload validation.
- Do not serve MinIO objects publicly.
- Use short-lived signed URLs.
- Keep Telegram restricted to one chat ID.
- Do not log financial payloads unnecessarily.
- Do not commit secrets.
- Maintain audit history.
- Use backups.

## Windows deployment

- Docker Desktop/WSL2 is the expected container runtime unless the existing repository uses another confirmed local method.
- Windows firewall rule must target Private network only.
- Use a stable LAN hostname or DHCP reservation if needed for phone access.
- The app must display the LAN URL in deployment documentation, not hard-code an IP.
- Production-local Compose publishes only `web`. API, PostgreSQL, Redis, MinIO,
  migration, and bucket-initialization services have no host port publications.
- Default `WEB_BIND_ADDRESS=127.0.0.1` is deliberately loopback-only. Switching
  it to `0.0.0.0` requires a Windows Firewall rule restricted to Private
  networks and, preferably, the trusted local subnet.
- `WEB_PUBLIC_URL`, `CORS_ORIGINS`, and Next.js Server Action allowed origins
  must name the same chosen LAN hostname or IP. Wildcard origins are not used.

## n8n

- n8n editor UI should not be exposed publicly.
- Only the required Telegram webhook path may be exposed after a connectivity option is chosen.
- n8n credentials must use its credential store.
- Application data writes occur through API calls.
- Run n8n security audit after configuration.
- n8n is deferred and is intentionally absent from the current production-local
  Compose topology; no live Telegram/webhook behavior is enabled by deployment.

## Attachments

- Allowed image/document MIME types must be configured.
- Maximum size must be configured.
- Store server-generated object keys.
- Validate content, not only filename extension.
- Prevent path traversal.
- Never return storage credentials.

## Audit

Audit source identifies:

- WEB
- TELEGRAM
- EXCEL_IMPORT
- SYSTEM

No user ID exists.
