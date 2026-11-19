-- Contact form messages, newsletter subscribers and Stripe order events.
-- Length checks repeat the API validation, so bad data cannot get in even if
-- a bug or a future script bypasses the API.

CREATE TABLE messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  first_name  text        NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 60),
  last_name   text        NOT NULL CHECK (char_length(last_name) BETWEEN 1 AND 60),
  email       text        NOT NULL CHECK (char_length(email) <= 120),
  message     text        NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000)
);

CREATE TABLE subscribers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  email       text        NOT NULL CHECK (char_length(email) <= 120)
);
-- One row per address, whatever the letter case.
CREATE UNIQUE INDEX subscribers_email_lower_key ON subscribers (lower(email));

CREATE TABLE order_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  session_id  text        NOT NULL CHECK (session_id ~ '^cs_(test|live)_[A-Za-z0-9]+$'),
  type        text        NOT NULL CHECK (type IN ('created', 'paid', 'expired', 'mismatch')),
  service_id  text,
  amount      integer     CHECK (amount IS NULL OR amount >= 0),
  email       text,
  -- Stripe may repeat a webhook: the same event is stored once.
  UNIQUE (session_id, type)
);
