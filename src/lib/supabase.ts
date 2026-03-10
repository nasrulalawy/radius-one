import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

if (!supabaseUrl) {
  throw new Error(
    'VITE_SUPABASE_URL is missing. Set it in Vercel: Project → Settings → Environment Variables. Use the same name (VITE_SUPABASE_URL) and your Supabase project URL.'
  )
}
if (!supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY is missing. Set it in Vercel: Project → Settings → Environment Variables. Use the same name and your Supabase anon key.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Service = {
  id: string
  name: string
  description: string | null
  billing_type: 'prepaid' | 'postpaid'
  router_id: string | null
  data_limit_mb: number | null
  speed_limit_down_kbps: number | null
  speed_limit_up_kbps: number | null
  price: number
  validity_days: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type NasDevice = {
  id: string
  nasname: string
  shortname: string | null
  type: string
  ports: number | null
  auth_port: number | null
  acct_port: number | null
  time_zone: string | null
  api_port: number | null
  api_username: string | null
  api_password: string | null
  secret: string
  server: string | null
  community: string | null
  due_notice_url: string | null
  description: string | null
  ping_status: string | null
  last_checked: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RadiusUser = {
  id: string
  username: string
  email: string | null
  full_name: string | null
  phone: string | null
  address: string | null
  service_id: string | null
  group_id: string | null
  static_ip: string | null
  max_sessions: number | null
  status: string
  expiry_date: string | null
  data_used_mb: number
  balance: number
  created_at: string
  updated_at: string
}

export type IpPool = {
  id: string
  name: string
  range_start: string
  range_end: string
  description: string | null
  created_at: string
}

export type AdminProfile = {
  id: string
  username: string
  full_name: string | null
  role: string
  created_at: string
  updated_at: string
}

export type Session = {
  id: string
  user_id: string | null
  username: string
  nas_id: string | null
  framed_ip: string | null
  session_id: string | null
  start_time: string
  data_in: number
  data_out: number
}
