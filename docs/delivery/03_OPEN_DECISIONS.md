# Open Decisions

Codex must not choose these values silently.

## OPEN-001 — Telegram public connectivity

No method has been selected.

Candidates for later owner decision:

- Secure tunnel.
- Public domain/reverse proxy.
- Other supported Telegram delivery method.

Until selected:

- Build n8n workflows exportably.
- Build application automation APIs.
- Do not expose services publicly.

## OPEN-002 — Natural-language parser provider

No AI/provider has been selected for Arabic intent parsing.

Until selected:

- Define provider-neutral structured output.
- Keep parser outside the application.
- n8n workflow may use a placeholder/manual mapping.
- Do not add paid credentials or SDKs.

## OPEN-003 — Daily backup time

Daily frequency is confirmed, exact Cairo time is not.

## OPEN-004 — Google Drive folder

Folder/location is not selected.

## OPEN-005 — Backup retention

Number of daily backups and local archive cleanup policy are not selected.

These decisions do not block core application development.
OPEN-001 and OPEN-002 block final live Telegram activation only.
OPEN-003 through OPEN-005 block final backup scheduling only.
