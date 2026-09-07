/**
 * Whop licensing.
 *
 * The app is a static build and cannot hold an API key, so validation goes
 * through one small server endpoint (public/api/validate.php) that holds the
 * key and proxies a single check to Whop.
 *
 * The rule that governs everything here: a paying customer must never be
 * locked out. Only an explicit `{"valid": false}` counts as a rejection.
 * A missing endpoint, an unreachable server, a timeout, a proxy error page,
 * anything that is not that exact answer, is reported as "couldn't run" and
 * offers a retry.
 */

const ENDPOINT = import.meta.env.VITE_LICENSE_ENDPOINT as string | undefined

export type Result =
  | { ok: true }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'network' }

/** Whop keys look like XXXXXX-XXXXXX-XXXXXX. */
const SHAPE = /^[A-Za-z0-9]{4,}(-[A-Za-z0-9]{4,}){1,4}$/

export async function validateLicense(key: string): Promise<Result> {
  const trimmed = key.trim()
  // Wrong shape is knowable without a round trip, and saying so immediately
  // is more useful than a spinner.
  if (!SHAPE.test(trimmed)) return { ok: false, reason: 'invalid' }

  // Unset only in the preview build, which has no server behind it.
  if (!ENDPOINT) return { ok: true }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: trimmed }),
    })
    if (!res.ok) return { ok: false, reason: 'network' }

    const data = (await res.json()) as { valid?: unknown }
    if (data.valid === true) return { ok: true }
    if (data.valid === false) return { ok: false, reason: 'invalid' }
    // A 200 that isn't the contract — a captive portal, an HTML error page
    // parsed loosely, a proxy. Not a rejection.
    return { ok: false, reason: 'network' }
  } catch {
    // Offline, DNS, timeout, CORS. Never a rejection.
    return { ok: false, reason: 'network' }
  }
}
