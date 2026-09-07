import { chromium } from 'playwright'
const B = 'http://localhost:4173/'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const fails = []
const ok = (n, c, d = '') => { console.log(`  ${c ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); if (!c) fails.push(n) }
const errs = []
let p

const fresh = async (seed) => {
  const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true })
  await ctx.route('**/api/validate.php', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true}' }))
  if (seed) {
    await ctx.addInitScript((s) => {
      if (!localStorage.getItem('adhdos:v1')) localStorage.setItem('adhdos:v1', JSON.stringify(s))
    }, seed)
  }
  p = await ctx.newPage()
  p.on('pageerror', e => errs.push(e.message))
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
  await p.goto(B, { waitUntil: 'networkidle' })
  if (await p.locator('.gate__input').count()) {
    await p.locator('.gate__input').fill('ABCD12-EFGH34-IJKL56')
    await p.getByRole('button', { name: 'start' }).click(); await p.waitForTimeout(250)
  }
  if (await p.locator('.prof__row').count()) {
    await p.getByRole('button', { name: 'start' }).click(); await p.waitForTimeout(250)
  }
}

console.log('\n=== §6 LOCKED DESIGN SYSTEM RESTORED ===')
await fresh()
const css = await p.evaluate(() => [...document.styleSheets]
  .flatMap(s => { try { return [...s.cssRules].map(r => r.cssText) } catch { return [] } }).join('\n'))
for (const [name, re] of [['gradient', /gradient/i], ['backdrop blur', /backdrop-filter/i], ['box-shadow', /box-shadow/i]])
  ok(`no ${name} in shipped CSS`, !re.test(css))
const bodyBg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor)
ok('light surface by default', bodyBg === 'rgb(255, 255, 255)', bodyBg)
const font = await p.evaluate(() => getComputedStyle(document.querySelector('.tile')).fontFamily)
ok('League Spartan on controls', /League Spartan/.test(font), font)
ok('no bottom dock', (await p.locator('.dock').count()) === 0)
ok('no streak badge', (await p.locator('.streak').count()) === 0)
ok('no energy toggle', (await p.getByRole('switch').count()) === 0)

console.log('\n=== §6.7 TIMER IS A BAR, NOT A RING ===')
await p.getByRole('button', { name: 'low', exact: true }).click()
await p.getByRole('button', { name: '5 min', exact: true }).click()
await p.waitForSelector('.task__text')
ok('bar present', await p.locator('.timerbar').isVisible())
ok('no ring element', (await p.locator('.ring').count()) === 0)
ok('no digits on screen', !/\d+:\d{2}/.test(await p.locator('main').innerText()))
const box = await p.locator('.timerbar').boundingBox()
ok('6px, pinned to the top edge', box.height === 6 && box.y === 0, `h=${box.height} y=${box.y}`)

console.log('\n=== §7.5 BRAIN-DUMP TAKES PRIORITY OVER THE LIBRARY ===')
await fresh({
  license: { key: 'ABCD12-EFGH34-IJKL56', validatedAt: Date.now() },
  meta: { version: 2, createdAt: Date.now(), profileSet: true, lastExportAt: Date.now() },
  braindump: { inbox: [], today: ['call the landlord', 'cancel the free trial'], thisWeek: [], todayDate: new Date().toDateString() },
})
await p.getByRole('button', { name: 'good', exact: true }).click()
await p.getByRole('button', { name: '30 min', exact: true }).click()
await p.waitForSelector('.task__text')
ok('today item served first, whatever tiles are picked',
  (await p.locator('.task__text').textContent()) === 'call the landlord',
  JSON.stringify(await p.locator('.task__text').textContent()))
await p.getByRole('button', { name: 'not this one' }).click(); await p.waitForTimeout(250)
ok('"not this one" moves to the next untagged item',
  (await p.locator('.task__text').textContent()) === 'cancel the free trial')
await p.getByRole('button', { name: 'not this one' }).click(); await p.waitForTimeout(250)
const third = await p.locator('.task__text').textContent()
ok('then falls through to the tagged library',
  third !== 'call the landlord' && third !== 'cancel the free trial', JSON.stringify(third))
// Start over so the oldest untagged item is served, then finish it.
await p.getByRole('button', { name: 'done' }).click(); await p.waitForTimeout(250)
await p.getByRole('button', { name: 'go again' }).click(); await p.waitForTimeout(250)
await p.getByRole('button', { name: 'low', exact: true }).click()
await p.getByRole('button', { name: '5 min', exact: true }).click()
await p.waitForSelector('.task__text')
ok('a new run serves the oldest untagged item again',
  (await p.locator('.task__text').textContent()) === 'call the landlord')
await p.getByRole('button', { name: 'done' }).click(); await p.waitForTimeout(250)
await p.getByRole('button', { name: 'go again' }).click(); await p.waitForTimeout(250)
await p.getByRole('button', { name: 'low', exact: true }).click()
await p.getByRole('button', { name: '5 min', exact: true }).click()
await p.waitForSelector('.task__text')
ok('completing it removes it from today',
  (await p.locator('.task__text').textContent()) === 'cancel the free trial',
  JSON.stringify(await p.locator('.task__text').textContent()))

console.log('\n=== §7.3 DEFERRED REVIEW FREES A SLOT ===')
await fresh()
await p.getByRole('button', { name: 'something else' }).click(); await p.waitForTimeout(200)
await p.getByRole('button', { name: 'sort a pile' }).click(); await p.waitForTimeout(200)
ok('no review link when nothing is deferred', (await p.getByRole('button', { name: /review deferred/ }).count()) === 0)
const pileInput = p.getByRole('textbox', { name: 'Name this pile' })
ok('placeholder matches the spec',
  (await pileInput.getAttribute('placeholder')) === 'e.g. desk, junk drawer, car')
await pileInput.fill('desk')
await p.getByRole('button', { name: 'next' }).click(); await p.waitForTimeout(200)
for (let i = 1; i <= 12; i++) {
  await p.getByRole('textbox', { name: 'Item' }).fill(`item ${i}`)
  await p.getByRole('textbox', { name: 'Item' }).press('Enter')
}
await p.getByRole('button', { name: 'start sorting' }).click(); await p.waitForTimeout(200)
for (let i = 0; i < 10; i++) { await p.getByRole('button', { name: 'decide later' }).click(); await p.waitForTimeout(60) }
await p.getByRole('button', { name: 'decide later' }).click(); await p.waitForTimeout(200)
ok('cap refuses the 11th deferral', /deferred pile is full/i.test(await p.locator('.dp__refused').textContent() || ''))
await p.getByRole('button', { name: 'Back' }).click(); await p.waitForTimeout(250)
await p.getByRole('button', { name: 'sort a pile' }).click(); await p.waitForTimeout(250)
const review = p.getByRole('button', { name: /review deferred \(10\)/ })
ok('review link appears with the count', (await review.count()) === 1)
await review.click(); await p.waitForTimeout(250)
ok('review offers three decisions, not four', (await p.locator('.dp__grid button').count()) === 3)
ok('no "decide later" in review', (await p.getByRole('button', { name: 'decide later' }).count()) === 0)
await p.getByRole('button', { name: 'bin' }).click(); await p.waitForTimeout(300)
ok('resolving frees a slot', (await p.locator('.dp__count').textContent() || '').includes('9'))

console.log('\n=== §7.4 FREQUENCY IS ASKED ON ADD ===')
await fresh()
await p.getByRole('button', { name: 'something else' }).click(); await p.waitForTimeout(200)
await p.getByRole('button', { name: 'payday' }).click(); await p.waitForTimeout(200)
await p.getByRole('textbox', { name: 'Day of the month' }).fill('25')
await p.getByRole('button', { name: 'save' }).click(); await p.waitForTimeout(250)
await p.getByRole('button', { name: 'rent', exact: true }).click(); await p.waitForTimeout(250)
const tiles = await p.locator('.pd__freq .tile').allTextContents()
ok('frequency tiles offered', tiles.length === 6, tiles.join(', '))
ok('every N months expanded, so no second input', tiles.includes('every 3 months') && tiles.includes('yearly'))
await p.getByRole('button', { name: 'monthly', exact: true }).click(); await p.waitForTimeout(300)
ok('one tap adds the bill, no confirm step', (await p.locator('.pd__bill').count()) === 1)
ok('no amounts or totals anywhere', !/\$|total|budget/i.test(await p.locator('.page').innerText()))

console.log('\n=== §8 COPY ===')
ok('no exclamation marks', !(await p.locator('.page').innerText()).includes('!'))
ok('the word ADHD never appears in the app', !/adhd/i.test(await p.evaluate(() => document.body.innerText)))

console.log('\n=== §10.9 EVERY ROOM HAS A SEQUENCE ===')
await fresh()
await p.getByRole('button', { name: 'something else' }).click(); await p.waitForTimeout(200)
await p.getByRole('button', { name: 'reset a room' }).click(); await p.waitForTimeout(200)
const rooms = await p.locator('.rr__room').allTextContents()
ok('six rooms offered', rooms.length === 6, rooms.join(', '))
for (const room of rooms) {
  await p.getByRole('button', { name: room, exact: true }).click()
  await p.getByRole('button', { name: '20 min', exact: true }).click()
  await p.waitForSelector('.task__text', { timeout: 3000 })
  const first = (await p.locator('.task__text').textContent()) || ''
  await p.getByRole('button', { name: 'done' }).click(); await p.waitForTimeout(200)
  const second = (await p.locator('.task__text').textContent()) || ''
  ok(`${room}: sequenced and advances`,
    first.length > 0 && second.length > 0 && first !== second, `${first} -> ${second}`)
  await p.goto(B, { waitUntil: 'networkidle' }); await p.waitForTimeout(200)
  await p.getByRole('button', { name: 'something else' }).click(); await p.waitForTimeout(150)
  await p.getByRole('button', { name: 'reset a room' }).click(); await p.waitForTimeout(150)
}

ok('no console or page errors', errs.length === 0, errs.join(' | '))
await b.close()
console.log(`\n${fails.length === 0 ? 'ALL v6 CHECKS PASSED' : 'FAILURES: ' + fails.join(', ')}`)
process.exit(fails.length === 0 ? 0 : 1)
