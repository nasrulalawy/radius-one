type MikrotikFunction = 'mikrotik-test' | 'mikrotik-check-all' | 'mikrotik-disconnect'

/**
 * Selalu lewat same-origin /api agar tidak kena CORS (tidak pernah panggil Supabase langsung dari browser).
 */
export async function invokeMikrotikFunction(
  name: MikrotikFunction,
  body?: Record<string, unknown>
): Promise<{ data: unknown; error: { message: string } | null }> {
  const url = `/api/${name}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    })
    const data = await res.json().catch(() => ({}))
    const error = !res.ok ? { message: (data as { message?: string })?.message || res.statusText } : null
    return { data, error }
  } catch (e) {
    return { data: null, error: { message: (e as Error).message } }
  }
}
