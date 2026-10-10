-- 0001_init: initial schema. Additive only (IF NOT EXISTS). No DROP/TRUNCATE.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  full_name     text,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uniq ON users (lower(email));

CREATE TABLE IF NOT EXISTS merchants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id  uuid NOT NULL REFERENCES users(id),
  legal_name     text NOT NULL,
  trade_name     text,
  country        char(2) NOT NULL,
  currency       char(3) NOT NULL,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS merchants_owner_idx ON merchants (owner_user_id);

CREATE TABLE IF NOT EXISTS payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id      uuid NOT NULL REFERENCES merchants(id),
  amount_minor     bigint NOT NULL CHECK (amount_minor > 0),
  currency         char(3) NOT NULL,
  status           text NOT NULL DEFAULT 'created'
                   CHECK (status IN ('created','pending','succeeded','failed','cancelled','refunded')),
  mode             text NOT NULL DEFAULT 'sandbox' CHECK (mode IN ('sandbox')),
  idempotency_key  text NOT NULL,
  provider         text,
  provider_ref     text,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS payments_merchant_created_idx ON payments (merchant_id, created_at DESC);

-- Append-only audit trail.
CREATE TABLE IF NOT EXISTS audit_logs (
  id            bigserial PRIMARY KEY,
  actor_user_id uuid REFERENCES users(id),
  merchant_id   uuid REFERENCES merchants(id),
  action        text NOT NULL,
  entity_type   text NOT NULL,
  entity_id     text,
  request_id    text,
  ip            inet,
  data          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id);

CREATE OR REPLACE FUNCTION audit_logs_block_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_logs_no_update_delete') THEN
    CREATE TRIGGER audit_logs_no_update_delete BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION audit_logs_block_mutation();
  END IF;
END $$;
