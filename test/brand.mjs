import { chromium } from 'playwright'
const B = 'http://localhost:4173/'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const fails = []
const ok = (n, c, d = '') => { console.log(`  ${c ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); if (!c) fails.push(n) }

const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
await ctx.route('**/api/validate.php', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true}' }))
const p = await ctx.newPage()
const errs = []
p.on('pageerror', e => errs.push(e.message))
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })

console.log('\n=== NAME: NOWLINE IN, THE MARKETING NAME OUT ===')
await p.goto(B, { waitUntil: 'networkidle' })
ok('document title is Nowline', (await p.title()) === 'Nowline', await p.title())
const manifest = await p.evaluate(async () => (await fetch('/manifest.json')).json())
ok('manifest name is Nowline', manifest.name === 'Nowline' && manifest.short_name === 'Nowline',
  `${manifest.name} / ${manifest.short_name}`)
ok('manifest ground matches the app', manifest.theme_color === '#0A1017' && manifest.background_color === '#0A1017')
ok('maskable icon declared', manifest.icons.some(i => i.purpose === 'maskable'))
const appleTitle = await p.locator('meta[name="apple-mobile-web-app-title"]').getAttribute('content')
ok('iOS home-screen name is Nowline', appleTitle === 'Nowline', appleTitle)

console.log('\n=== THE WORD ADHD APPEARS NOWHERE A USER CAN READ IT ===')
await p.waitForTimeout(400)
const visible = await p.evaluate(() => document.body.innerText)
ok('not on the first screen', !/adhd/i.test(visible))
ok('not in the title or manifest', !/adhd/i.test(await p.title()) && !/adhd/i.test(JSON.stringify(manifest)))

console.log('\n=== SPLASH: THE MARK, NOTHING ELSE ===')
const splash = await p.evaluate(() => {
  const s = document.getElementById('splash')
  return s ? { text: s.innerText.trim(), svg: s.querySelectorAll('svg').length, gone: s.classList.contains('gone') } : null
})
ok('splash exists in the document', splash !== null)
ok('carries the mark and no text', splash.svg === 1 && splash.text === '', JSON.stringify(splash.text))
ok('no spinner invented', !(await p.evaluate(() => !!document.querySelector('#splash [class*=spin]'))))
ok('dismissed once the app paints', splash.gone === true)

console.log('\n=== LOGOMARK: AN ARC THAT DOES NOT CLOSE ===')
const mark = await p.locator('.mark').first()
ok('mark rendered on the gate', await mark.isVisible())
const parts = await p.evaluate(() => {
  const m = document.querySelector('.mark')
  return {
    arc: getComputedStyle(m.querySelector('path')).stroke,
    dot: getComputedStyle(m.querySelector('circle')).fill,
    closed: m.querySelector('path').getAttribute('d').includes('Z'),
  }
})
ok('arc is cyan', parts.arc === 'rgb(34, 211, 238)', parts.arc)
ok('dot is lime, marking the gap', parts.dot === 'rgb(226, 241, 99)', parts.dot)
ok('the arc is left open', !parts.closed)

console.log('\n=== TYPE: SPACE GROTESK ON DISPLAY, LEAGUE SPARTAN ON CONTROLS ===')
await p.locator('.gate__input').fill('ABCD12-EFGH34-IJKL56')
await p.getByRole('button', { name: 'start' }).click(); await p.waitForTimeout(400)
await p.getByRole('button', { name: 'start' }).click(); await p.waitForTimeout(400)
await p.getByRole('button', { name: 'low', exact: true }).click()
await p.getByRole('button', { name: '5 min', exact: true }).click()
await p.waitForSelector('.task__text')
const taskFont = await p.locator('.task__text').evaluate(e => getComputedStyle(e).fontFamily)
ok('task text is Space Grotesk', /Space Grotesk/.test(taskFont), taskFont)
ok('Poppins is gone', !/Poppins/.test(taskFont))
const btnFont = await p.locator('.btn--primary').evaluate(e => getComputedStyle(e).fontFamily)
ok('buttons stay League Spartan', /League Spartan/.test(btnFont), btnFont)

console.log('\n=== PRESS READS AS A RESPONSE, NOT A REPAINT ===')
const press = await p.evaluate(() => {
  const s = getComputedStyle(document.documentElement)
  return { inn: s.getPropertyValue('--t-press-in').trim(), out: s.getPropertyValue('--t-press-out').trim() }
})
ok('press timing is asymmetric', press.inn !== press.out, `${press.inn} in / ${press.out} out`)
const ms = (v) => v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000
ok('and takes the finger faster than it lets go',
  ms(press.inn) < ms(press.out), `${ms(press.inn)}ms in < ${ms(press.out)}ms out`)
const hasScale = await p.evaluate(() => [...document.styleSheets]
  .flatMap(s => { try { return [...s.cssRules].map(r => r.cssText) } catch { return [] } })
  .filter(t => t.includes(':active')).some(t => /scale\(/.test(t)))
ok('no scale transform on press, per spec', !hasScale)

console.log('\n=== SCREENS SLIDE, THEY DO NOT CUT ===')
const anim = await p.evaluate(() => {
  const el = document.querySelector('.screen')
  return el ? getComputedStyle(el).animationDuration : null
})
ok('the screen carries a transition', anim === '0.2s', String(anim))
const rctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
await rctx.route('**/api/validate.php', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true}' }))
const rp = await rctx.newPage()
await rp.goto(B, { waitUntil: 'networkidle' }); await rp.waitForTimeout(300)
const rAnim = await rp.evaluate(() => {
  const el = document.querySelector('.screen')
  return el ? getComputedStyle(el).animationName : null
})
ok('reduced motion turns it off', rAnim === 'none', String(rAnim))
await rctx.close()

console.log('\n=== DOOM-PILE: GEOMETRY ONLY, NEVER RANK ===')
await p.getByRole('button', { name: 'done' }).click(); await p.waitForTimeout(300)
await p.getByRole('button', { name: 'go again' }).click(); await p.waitForTimeout(300)
await p.getByRole('button', { name: 'something else' }).click(); await p.waitForTimeout(300)
await p.getByRole('button', { name: 'sort a pile' }).click(); await p.waitForTimeout(300)
await p.getByRole('textbox', { name: 'Name this pile' }).fill('desk')
await p.getByRole('button', { name: 'next' }).click(); await p.waitForTimeout(250)
for (const t of ['grey hoodie', 'phone charger']) {
  await p.getByRole('textbox', { name: 'Item' }).fill(t)
  await p.getByRole('textbox', { name: 'Item' }).press('Enter')
}
await p.getByRole('button', { name: 'start sorting' }).click(); await p.waitForTimeout(300)
const quad = await p.evaluate(() => [...document.querySelectorAll('.dp__grid button')].map(e => {
  const s = getComputedStyle(e), r = e.getBoundingClientRect()
  return { bg: s.backgroundColor, color: s.color, weight: s.fontWeight, size: s.fontSize,
           w: Math.round(r.width), h: Math.round(r.height), radius: s.borderRadius }
}))
ok('four decisions offered', quad.length === 4)
ok('identical fill, colour and weight — none outranks another',
  new Set(quad.map(q => `${q.bg}|${q.color}|${q.weight}|${q.size}`)).size === 1)
ok('identical size — none outranks another',
  new Set(quad.map(q => `${q.w}x${q.h}`)).size === 1, quad.map(q => `${q.w}x${q.h}`).join(' '))
ok('differentiated by corner geometry alone',
  new Set(quad.map(q => q.radius)).size === 4, quad.map(q => q.radius).join(' | '))

ok('no console or page errors', errs.length === 0, errs.join(' | '))
await b.close()
console.log(`\n${fails.length === 0 ? 'ALL BRAND CHECKS PASSED' : 'FAILURES: ' + fails.join(', ')}`)
process.exit(fails.length === 0 ? 0 : 1)
