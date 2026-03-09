-- Add MixRadius-style fields to nas_devices (Router [NAS])
-- Run this if you already have nas_devices table.

alter table public.nas_devices
  add column if not exists auth_port int default 1812,
  add column if not exists acct_port int default 1813,
  add column if not exists time_zone text,
  add column if not exists api_port int default 8728,
  add column if not exists api_username text,
  add column if not exists api_password text,
  add column if not exists due_notice_url text;

comment on column public.nas_devices.auth_port is 'RADIUS authentication port (default 1812)';
comment on column public.nas_devices.acct_port is 'RADIUS accounting port (default 1813)';
comment on column public.nas_devices.due_notice_url is 'Full path URL for expired PPPoE redirect (no http/https)';
