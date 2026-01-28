# Factor APY Screener PWA

Liquid-glass PWA for real-time wallet balances, exposure, and APY. Uses
local passkeys plus optional Supabase for account + wallet storage.

## Run

```bash
npm install
npm run dev -- --host
```

## Supabase (optional)

Create a Supabase project and copy the values into `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Tables

```sql
create table if not exists passkey_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  username text not null,
  credential_id text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists tracked_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  credential_id text,
  wallet_id uuid not null,
  label text not null,
  address text not null,
  created_at timestamptz not null default now()
);
```

### RLS (recommended)

```sql
alter table passkey_accounts enable row level security;
alter table tracked_wallets enable row level security;

create policy "passkey owner" on passkey_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "wallet owner" on tracked_wallets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists tracked_wallets_credential_id
  on tracked_wallets (credential_id);
```

Passkey auth is handled client-side via WebAuthn and synced to Supabase
after registration/login.
