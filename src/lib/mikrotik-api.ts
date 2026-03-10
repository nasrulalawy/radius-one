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
 * Same-origin /api/mikrotik-proxy → di production ditangani Edge Middleware (no CORS).
 */
export async function invokeMikrotikFunction(
  name: MikrotikFunction,
  body?: Record<string, unknown>
): Promise<{ data: MikrotikApiResponse | null; error: { message: string } | null }> {
  const url = `/api/mikrotik-proxy?fn=${encodeURIComponent(name)}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    })
    const data = (await res.json().catch(() => ({}))) as MikrotikApiResponse
    const error = !res.ok ? { message: data?.message || res.statusText } : null
    return { data, error }
  } catch (e) {
    return { data: null, error: { message: (e as Error).message } }
  }
}
