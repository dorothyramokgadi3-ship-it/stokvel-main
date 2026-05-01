-- ============================================================
-- INTUTHUKO — Append-Only Enforcement
-- Run AFTER prisma migrate. Prevents UPDATE/DELETE on money tables.
-- ============================================================

-- Create a restricted app role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user;
  END IF;
END
$$;

-- Grant normal access to all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- REVOKE mutations on append-only tables
REVOKE UPDATE, DELETE ON contributions FROM app_user;
REVOKE UPDATE, DELETE ON payouts FROM app_user;
REVOKE UPDATE, DELETE ON payout_approvals FROM app_user;
REVOKE UPDATE, DELETE ON ledger_entries FROM app_user;
REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
REVOKE UPDATE, DELETE ON wallet_transactions FROM app_user;

-- Allow specific columns to be updated on payouts (status transitions only)
-- This is handled via a trigger instead:
CREATE OR REPLACE FUNCTION enforce_payout_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow status and currentApprovals to change
  IF OLD."amountCents" != NEW."amountCents" THEN
    RAISE EXCEPTION 'Cannot modify payout amount';
  END IF;
  IF OLD."recipientUserId" != NEW."recipientUserId" THEN
    RAISE EXCEPTION 'Cannot modify payout recipient';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Allow status updates on contributions (PENDING -> CONFIRMED etc)
-- but prevent amount changes
CREATE OR REPLACE FUNCTION enforce_contribution_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."amountCents" != NEW."amountCents" THEN
    RAISE EXCEPTION 'Cannot modify contribution amount. Create a REFUND instead.';
  END IF;
  IF OLD."userId" != NEW."userId" THEN
    RAISE EXCEPTION 'Cannot modify contribution owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
