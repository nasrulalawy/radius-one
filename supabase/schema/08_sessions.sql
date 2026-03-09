-- 08. Active sessions (online users) - butuh: radius_users, nas_devices
-- RadiusOne - Supabase schema part 8/14

create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.radius_users(id) on delete cascade,
  username text not null,
  nas_id uuid references public.nas_devices(id) on delete set null,
  framed_ip inet,
  session_id text,
  start_time timestamptz default now(),
  data_in bigint default 0,
  data_out bigint default 0,
  terminate_cause text
);
