import { supabase } from './supabase'

type MikrotikFunction = 'mikrotik-test' | 'mikrotik-check-all' | 'mikrotik-disconnect'

export type MikrotikApiResponse = {
  ok?: boolean
  message?: string
  checked?: number
  status?: string
  detail?: unknown
  last_checked?: string
}

/**
 * Panggil langsung ke Supabase Edge Function.
 * CORS diatasi dengan verify_jwt = false di supabase/config.toml agar preflight OPTIONS tidak diblokir.
 */
export async function invokeMikrotikFunction(
  name: MikrotikFunction,
  body?: Record<string, unknown>
): Promise<{ data: MikrotikApiResponse | null; error: { message: string } | null }> {
  const { data, error } = await supabase.functions.invoke(name, { body: body ?? {} })
  return {
    data: (data ?? null) as MikrotikApiResponse | null,
    error: error ? { message: error.message } : null,
  }
}
