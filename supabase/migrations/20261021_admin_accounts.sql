CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE CHECK (username = lower(username)),
  password_hash TEXT NOT NULL,
  recovery_email TEXT NOT NULL,
  credential_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_auth_challenges (
  id UUID PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES public.admin_accounts(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('login', 'password_reset')),
  code_hash TEXT NOT NULL,
  credential_version INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS admin_auth_challenges_account ON public.admin_auth_challenges(account_id, purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_auth_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_auth_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_auth_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_accounts, public.admin_auth_challenges, public.admin_auth_limits FROM PUBLIC, anon, authenticated;
