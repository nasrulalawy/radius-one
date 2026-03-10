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

// Nama function di Supabase (bisa beda dari nama logika)
const FUNCTION_NAMES: Record<MikrotikFunction, string> = {
  'mikrotik-test': 'rapid-handler',
  'mikrotik-check-all': 'smart-function',
  'mikrotik-disconnect': 'mikrotik-disconnect',
}

/**
 * Panggil langsung ke Supabase Edge Function.
 * mikrotik-test → rapid-handler; lainnya sesuai nama.
 */
export async function invokeMikrotikFunction(
  name: MikrotikFunction,
  body?: Record<string, unknown>
): Promise<{ data: MikrotikApiResponse | null; error: { message: string } | null }> {
  const functionName = FUNCTION_NAMES[name]
  const { data, error } = await supabase.functions.invoke(functionName, { body: body ?? {} })
  return {
    data: (data ?? null) as MikrotikApiResponse | null,
    error: error ? { message: error.message } : null,
  }
}
