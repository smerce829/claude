import { chromium } from 'playwright'
const B='http://localhost:4173/'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const fails=[]
const ok=(n,c,d='')=>{ console.log(`  ${c?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`); if(!c) fails.push(n) }

// iPhone SE — the smallest realistic phone.
const ctx = await b.newContext({ viewport:{width:375,height:667}, deviceScaleFactor:2, isMobile:true, hasTouch:true })
await ctx.route('**/api/validate.php', r => r.fulfill({status:200,contentType:'application/json',body:'{"valid":true}'}))
const p = await ctx.newPage()
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())})

console.log('\n=== GATE ===')
await p.goto(B,{waitUntil:'networkidle'})
ok('gate is first screen', await p.getByText('Paste your key').isVisible())

// Invalid key -> specific error, not generic
await p.locator('.gate__input').fill('nope')
await p.getByRole('button',{name:'start'}).click()
await p.waitForTimeout(200)
const invalidMsg = await p.locator('.gate__error').textContent()
ok('invalid key gives specific error', /wasn't recognised/.test(invalidMsg||''), JSON.stringify(invalidMsg))

// Valid-shaped key passes
await p.locator('.gate__input').fill('ABCD12-EFGH34-IJKL56')
await p.getByRole('button',{name:'start'}).click()
await p.waitForTimeout(300)
if (await p.locator('.prof__row').count()) {
  await p.getByRole('button',{name:'start'}).click(); await p.waitForTimeout(200)
}

console.log('\n=== START INPUT: two taps to a running task ===')
ok('input screen shown', await p.locator('.start').isVisible())
const tiles = await p.locator('.tile').count()
ok('exactly 6 choice tiles', tiles===6, `got ${tiles}`)

const t0=Date.now()
await p.getByRole('button',{name:'low',exact:true}).click()
await p.getByRole('button',{name:'5 min',exact:true}).click()
await p.waitForSelector('.task__text',{timeout:3000})
const elapsed=Date.now()-t0
ok('two taps reach a running task', true)
ok('under 3 seconds', elapsed<3000, `${elapsed}ms`)

const taskText = (await p.locator('.task__text').textContent())||''
ok('task text present', taskText.length>0, JSON.stringify(taskText))
ok('task under nine words', taskText.trim().split(/\s+/).length<=8, `${taskText.trim().split(/\s+/).length} words`)

console.log('\n=== TIMER BAR ===')
ok('timer bar rendered', await p.locator('.timerbar').isVisible())
const box = await p.locator('.timerbar').boundingBox()
ok('bar is 6px tall at top edge', box.height===6 && box.y===0, `h=${box.height} y=${box.y}`)
const rect = () => p.evaluate(()=>document.querySelector('.timerbar__fill').getBoundingClientRect().width)
const w1 = await rect()
await p.waitForTimeout(1500)
const w2 = await rect()
ok('bar depletes left to right', w2<w1, `${w1.toFixed(1)}px -> ${w2.toFixed(1)}px`)
// 1.5s of a 5 min timer across 375px is 1.875px. Proves it tracks wall clock,
// which is what a counter-based timer would silently get wrong.
const drop=w1-w2, want=375*1.5/300
ok('depletion matches wall clock', Math.abs(drop-want)<0.6, `dropped ${drop.toFixed(2)}px, expected ~${want.toFixed(2)}px`)
ok('no digits/percentage on screen', !/\d+\s*%|\d+:\d+/.test(await p.locator('main').innerText()))

console.log('\n=== NO SCROLL, TOUCH TARGETS ===')
const sc = await p.evaluate(()=>({h:document.documentElement.scrollHeight,ih:innerHeight,w:document.documentElement.scrollWidth,iw:innerWidth}))
ok('no vertical scroll on task screen', sc.h<=sc.ih+1, `${sc.h} vs ${sc.ih}`)
ok('no horizontal scroll', sc.w<=sc.iw+1, `${sc.w} vs ${sc.iw}`)
const small = await p.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().height<56).map(b=>b.textContent+':'+Math.round(b.getBoundingClientRect().height)))
ok('every button >= 56px tall', small.length===0, small.join(', '))

console.log('\n=== SWAP KEEPS TIMER RUNNING ===')
const before=await rect()
await p.getByRole('button',{name:'not this one'}).click()
await p.waitForTimeout(300)
const after=await rect()
ok('swap does not restart the timer', after<=before, `${before.toFixed(1)} -> ${after.toFixed(1)}`)
ok('still on task screen', await p.locator('.task__text').isVisible())

console.log('\n=== COMPLETION: only screen with lime ===')
await p.getByRole('button',{name:'done'}).click()
await p.waitForTimeout(300)
ok('shows the word done', (await p.locator('.complete__word').textContent())==='done')
const limeBtn = await p.locator('.btn--completion').evaluate(e=>getComputedStyle(e).backgroundColor)
ok('completion button is lime', limeBtn==='rgb(226, 241, 99)', limeBtn)
const body = await p.locator('main').innerText()
ok('no stats/streak/confetti', !/streak|day|total|complete[d]?\s*\d/i.test(body), JSON.stringify(body))
const purpleOnScreen = await p.evaluate(()=>[...document.querySelectorAll('main *')].some(e=>getComputedStyle(e).backgroundColor==='rgb(137, 108, 254)'))
ok('purple and lime never on screen together', !purpleOnScreen)

console.log('\n=== 320px NARROW PHONE ===')
await p.setViewportSize({width:320,height:568})
await p.waitForTimeout(200)
const n = await p.evaluate(()=>({w:document.documentElement.scrollWidth,iw:innerWidth}))
ok('no horizontal scroll at 320px', n.w<=n.iw+1, `${n.w} vs ${n.iw}`)

console.log('\n=== DARK MODE ===')
const dctx = await b.newContext({viewport:{width:375,height:667},colorScheme:'dark'})
await dctx.route('**/api/validate.php', r => r.fulfill({status:200,contentType:'application/json',body:'{"valid":true}'}))
const dp = await dctx.newPage(); await dp.goto(B,{waitUntil:'networkidle'})
const bg = await dp.evaluate(()=>getComputedStyle(document.body).backgroundColor)
ok('dark surface applied automatically', bg==='rgb(35, 35, 35)', bg)
ok('no theme toggle exists', (await dp.getByRole('button',{name:/theme|dark|light/i}).count())===0)

console.log('\n=== JS ERRORS ===')
ok('no console/page errors', errs.length===0, errs.join(' | '))


console.log('\n=== REDUCED MOTION ===')
const rctx = await b.newContext({viewport:{width:375,height:667}, reducedMotion:'reduce'})
await rctx.route('**/api/validate.php', r => r.fulfill({status:200,contentType:'application/json',body:'{"valid":true}'}))
const rp = await rctx.newPage(); await rp.goto(B,{waitUntil:'networkidle'})
await rp.locator('.gate__input').fill('ABCD12-EFGH34-IJKL56')
await rp.getByRole('button',{name:'start'}).click(); await rp.waitForTimeout(300)
if (await rp.locator('.prof__row').count()) {
  await rp.getByRole('button',{name:'start'}).click(); await rp.waitForTimeout(200)
}
await rp.getByRole('button',{name:'low',exact:true}).click()
await rp.getByRole('button',{name:'5 min',exact:true}).click()
await rp.waitForSelector('.task__text')
const rrect = () => rp.evaluate(()=>document.querySelector('.timerbar__fill').getBoundingClientRect().width)
const r1 = await rrect(); await rp.waitForTimeout(2500); const r2 = await rrect()
ok('timer still advances under reduced motion', r2<r1, `${r1.toFixed(2)} -> ${r2.toFixed(2)}`)
ok('reduced motion task screen renders', await rp.locator('.task__text').isVisible())

await b.close()
console.log(`\n${fails.length===0?'ALL CHECKS PASSED':'FAILURES: '+fails.join(', ')}`)
process.exit(fails.length===0?0:1)
