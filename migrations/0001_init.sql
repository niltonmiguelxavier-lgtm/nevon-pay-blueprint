-- 0001_init: initial schema. Additive only (IF NOT EXISTS). No DROP/TRUNCATE.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext_placeholder_replaced_below
);
