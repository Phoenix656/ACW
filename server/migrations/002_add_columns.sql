-- 002_add_columns.sql: Add/adjust columns for reminder thresholds and role handling

-- Add renewal_due_days to documents if missing (default to 30‑day reminder)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='documents' AND column_name='renewal_due_days'
  ) THEN
    ALTER TABLE documents
      ADD COLUMN renewal_due_days JSONB NOT NULL DEFAULT '[30]';
  END IF;
END $$;

-- Ensure role column on users (defaults to 'user')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='role'
  ) THEN
    ALTER TABLE users
      ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';
  END IF;
END $$;

-- Add a simple index for faster lookup of renewal_due_days (GIN index)
CREATE INDEX IF NOT EXISTS idx_documents_renewal_due_days ON documents USING GIN (renewal_due_days);
