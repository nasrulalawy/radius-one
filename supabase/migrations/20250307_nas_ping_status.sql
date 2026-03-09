-- Add ping status and last_checked for MikroTik integration
alter table public.nas_devices
  add column if not exists ping_status text,
  add column if not exists last_checked timestamptz;

comment on column public.nas_devices.ping_status is 'online | timeout | unreachable (set by Edge Function)';
comment on column public.nas_devices.last_checked is 'When ping/API was last checked';
