/**
 * Whop licensing.
 *
 * The spec requires no server runtime and a static build. Whop's license
 * validation endpoint needs a bearer API key, and a static bundle cannot hold
 * a secret — anything shipped here is readable by anyone who opens devtools.
 * So this is a soft gate: it checks the key's shape locally and records it.
 *
 * Everything server-dependent is behind this one function. To harden later,
 * deploy a single endpoint that holds the key and calls Whop, then set
 * VITE_LICENSE_ENDPOINT — no other file changes.
 */

const ENDPOINT = import.meta.env.VITE_LICENSE_ENDPOINT as string | undefined

export type Result =
  | { ok: true }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'network' }

/** Whop keys look like XXXXXX-XXXXXX-XXXXXX. Shape check only. */
const SHAPE = /^[A-Za-z0-9]{4,}(-[A-Za-z0-9]{4,}){1,4}$/

export async function validateLicense(key: string): Promise<Result> {
  const trimmed = key.trim()
  if (!SHAPE.test(trimmed)) return { ok: false, reason: 'invalid' }

  if (!ENDPOINT) return { ok: true }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: trimmed }),
    })
    if (res.status === 404 || res.status === 403) return { ok: false, reason: 'invalid' }
    if (!res.ok) return { ok: false, reason: 'network' }
    const data = (await res.json()) as { valid?: boolean }
    return data.valid ? { ok: true } : { ok: false, reason: 'invalid' }
  } catch {
    // Never lock out a paying customer because their wifi dropped.
    return { ok: false, reason: 'network' }
  }
}
