-- 14. Seed default settings (jalankan terakhir)
-- RadiusOne - Supabase schema part 14/14

insert into public.settings (key, value) values
  ('company_name', '"RadiusOne"'),
  ('radius_server_address', '"43.173.164.210"'),
  ('radius_auth_port', '1812'),
  ('radius_acct_port', '1813'),
  ('session_timeout', '3600')
on conflict (key) do nothing;
