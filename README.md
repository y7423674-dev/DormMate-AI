# DormMate AI

DormMate AI is a Next.js App Router prototype for dorm collaboration workflows, including auth, announcements, duty scheduling, expenses, laundry, member status, and a lightweight AI assistant.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Recharts
- Supabase PostgreSQL

## Local Development

```bash
npm install
npm run dev
```

Visit:

```text
http://localhost:3000
```

If PowerShell blocks `npm.ps1`, use:

```bash
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

## Environment Variables

Required for server-side persistence:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional:

```env
DORM_SESSION_SECRET=your-session-secret
DORM_LAT=31.2304
DORM_LON=121.4737
DEEPSEEK_API_KEY=
```

## Data Storage

Server-side data is stored in Supabase PostgreSQL.

Current tables:

- `users`
- `dorm_states`

`dorm_states.state_json` stores the existing `DormState` JSON shape so the frontend data structure can stay unchanged during this migration.

Core server modules:

```text
src/lib/supabase.ts
src/lib/authStore.ts
src/lib/serverStore.ts
```

State and fixture types:

```text
src/data/types.ts
src/data/mock.ts
```

## Supabase Tables

```sql
create table if not exists public.users (
  id text primary key,
  username text not null unique,
  password_hash text not null,
  dorm_code text not null,
  role text not null default 'member' check (role in ('member', 'leader')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_dorm_code
  on public.users (dorm_code);

create table if not exists public.dorm_states (
  id text primary key,
  dorm_code text unique not null,
  state_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dorm_states_updated_at
  on public.dorm_states (updated_at);
```

## Auth Flow

- Register and login use the `users` table in Supabase.
- Passwords use the existing scrypt hash format.
- Session data remains in the signed `dormmate_session` cookie.
- Auth APIs keep returning the existing `{ session, state }` shape.
