# AthleteOS React

Mobile-first React/Vite app for offseason baseball training.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

## Supabase setup

This sprint adds an optional Supabase data layer while keeping the app usable offline.

1. Create a Supabase project.
2. In the Supabase dashboard, create these tables:

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table app_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now(),
  unique (user_id)
);
```

3. Enable email/password authentication in Supabase Auth.
4. Copy the project URL and anon key into .env.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Behavior

- The app works locally without any sign-in.
- If Supabase is configured and the user signs in, the app can sync app state to the cloud.
- If the user is offline or not signed in, the app falls back to localStorage.

## Deploy to Vercel

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: blank if these files are at the repo root
