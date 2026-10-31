-- Preserve the truth of legacy records whose date was never captured. This is
-- intentionally nullable only at storage/import level; normal expense writes
-- continue to require a date through the public API validation schema.
ALTER TABLE "Expense" ALTER COLUMN "expenseDate" DROP NOT NULL;
