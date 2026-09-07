import { chromium } from 'playwright'
const B = 'http://localhost:4173/'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const fails = []
const ok = (n, c, d = '') => { console.log(`  ${c ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); if (!c) fails.push(n) }

const KEY = 'ABCD12-EFGH34-IJKL56'

/** Stand the endpoint up with a chosen answer and count the calls. */
async function withEndpoint(handler) {
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 } })
  const calls = []
  await ctx.route('**/api/validate.php', async (route) => {
    calls.push(JSON.parse(route.request().postData() || '{}'))
    await handler(route)
  })
  const p = await ctx.newPage()
  await p.goto(B, { waitUntil: 'networkidle' })
  return { ctx, p, calls }
}

const enter = async (p, key) => {
  await p.locator('.gate__input').fill(key)
  await p.getByRole('button', { name: /start|retry/ }).click()
  await p.waitForTimeout(350)
}

console.log('\n=== THE GATE ACTUALLY CALLS THE ENDPOINT ===')
{
  const { ctx, p, calls } = await withEndpoint(r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true}' }))
  await enter(p, KEY)
  ok('a valid key is checked server-side', calls.length === 1, `${calls.length} call(s)`)
  ok('the key is sent in the body', calls[0]?.key === KEY, JSON.stringify(calls[0]))
  ok('a valid key gets in', await p.locator('.prof__row').isVisible() || await p.locator('.start').isVisible())
  await ctx.close()
}

console.log('\n=== A KEY THE SERVER REJECTS DOES NOT GET IN ===')
{
  const { ctx, p } = await withEndpoint(r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":false}' }))
  await enter(p, KEY)
  ok('rejected key stays out', await p.locator('.gate__input').isVisible())
  ok('and is told why, specifically',
    /wasn't recognised/.test(await p.locator('.gate__error').textContent() || ''))
  await ctx.close()
}

console.log('\n=== A WELL-FORMED FAKE KEY IS NO LONGER ENOUGH ===')
{
  const { ctx, p, calls } = await withEndpoint(r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":false}' }))
  await enter(p, 'AAAA11-BBBB22-CCCC33')
  ok('shape alone does not unlock the app', await p.locator('.gate__input').isVisible())
  ok('the server had the final say', calls.length === 1)
  await ctx.close()
}

console.log('\n=== A PAYING CUSTOMER IS NEVER LOCKED OUT BY AN OUTAGE ===')
for (const [label, handler] of [
  ['endpoint missing (404)', r => r.fulfill({ status: 404, body: 'Not Found' })],
  ['endpoint erroring (500)', r => r.fulfill({ status: 500, body: 'Server Error' })],
  ['upstream unreachable (502)', r => r.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"upstream"}' })],
  ['unconfigured (503)', r => r.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"unconfigured"}' })],
  ['connection dropped', r => r.abort('connectionfailed')],
  ['a captive portal HTML page', r => r.fulfill({ status: 200, contentType: 'text/html', body: '<html>login</html>' })],
  ['a 200 that is not the contract', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":1}' })],
]) {
  const { ctx, p } = await withEndpoint(handler)
  await enter(p, KEY)
  const err = await p.locator('.gate__error').textContent().catch(() => '')
  const retry = await p.getByRole('button', { name: 'retry' }).count()
  ok(`${label}: offers retry, never rejects`,
    /couldn't run/.test(err || '') && retry === 1, JSON.stringify(err))
  await ctx.close()
}

console.log('\n=== RETRY WORKS ONCE THE ENDPOINT COMES BACK ===')
{
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 } })
  let down = true
  await ctx.route('**/api/validate.php', async (route) => {
    if (down) { await route.fulfill({ status: 502, body: '{}' }); return }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true}' })
  })
  const p = await ctx.newPage()
  await p.goto(B, { waitUntil: 'networkidle' })
  await enter(p, KEY)
  ok('first attempt fails softly', (await p.getByRole('button', { name: 'retry' }).count()) === 1)
  down = false
  await p.getByRole('button', { name: 'retry' }).click(); await p.waitForTimeout(400)
  ok('retry lets them in', (await p.locator('.gate__input').count()) === 0)
  await ctx.close()
}

console.log('\n=== A MALFORMED KEY COSTS NO ROUND TRIP ===')
{
  const { ctx, p, calls } = await withEndpoint(r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true}' }))
  await enter(p, 'nope')
  ok('rejected locally, endpoint not called', calls.length === 0 && await p.locator('.gate__input').isVisible())
  await ctx.close()
}

console.log('\n=== VALIDATION HAPPENS ONCE, THEN THE FLAG IS TRUSTED (§4) ===')
{
  const { ctx, p, calls } = await withEndpoint(r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true}' }))
  await enter(p, KEY)
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(400)
  ok('no second call on a later load', calls.length === 1, `${calls.length} call(s)`)
  ok('and it goes straight past the gate', (await p.locator('.gate__input').count()) === 0)
  await ctx.close()
}

await b.close()
console.log(`\n${fails.length === 0 ? 'ALL LICENSE CHECKS PASSED' : 'FAILURES: ' + fails.join(', ')}`)
process.exit(fails.length === 0 ? 0 : 1)
