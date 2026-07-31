# Data Model

## Project

Represents one construction/project expense workbook.

Fields:

- id
- name
- status: active/archived
- opening balance amount
- opening balance date
- created/updated/archived timestamps

## Category and Subcategory

Editable classification hierarchy.

- Category may be active or inactive.
- Subcategory belongs to one category.
- Referenced categories are deactivated rather than physically deleted.

## Payee

Represents a supplier, craftsman, worker, company, or other recipient.

- name
- type
- specialty
- optional phone
- optional company name
- notes

## Agreement

At most one agreement per project/payee pair.

- total amount
- paid is derived, not stored as authoritative
- remaining is derived

## Expense

Authoritative outgoing project transaction.

- project
- date
- description
- category
- optional subcategory
- optional payee
- optional invoice number
- optional quantity
- optional unit
- optional unit price
- amount
- optional payment method
- optional notes
- source
- optional import reference
- optional Telegram reference
- soft-delete timestamps

## Transfer

Incoming project funding.

- project
- date
- amount
- source
- soft-delete timestamps

Opening balance is stored on the project. A transfer represents only an incoming transfer. The UI exposes date and amount.

## Attachment

Optional file attached to an expense.

- object key
- original name
- MIME type
- size
- checksum
- created time

## Audit Event

Immutable history record.

- action
- entity type/id
- source
- before/after JSON
- correlation ID
- time

## Automation Draft

Temporary confirmation state used by n8n.

- Telegram chat/message
- intent
- structured payload
- status
- idempotency key
- expiration

## Import Job and Import Row

Tracks preview and committed import results.

- source workbook metadata
- row mapping
- validation status
- duplicate hash
- resulting entity ID
