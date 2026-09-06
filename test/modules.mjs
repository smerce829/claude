import { chromium } from 'playwright'
const B='http://localhost:4173/'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const fails=[]
const ok=(n,c,d='')=>{ console.log(`  ${c?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`); if(!c) fails.push(n) }

const errs=[]
let p
/* A fresh context per module: the app flushes state on pagehide, so clearing
   localStorage in place would be undone by the app's own (correct) save. */
const unlock = async () => {
  const ctx = await b.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true})
  p = await ctx.newPage()
  p.on('pageerror',e=>errs.push(e.message))
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text())})
  await p.goto(B,{waitUntil:'networkidle'})
  await p.locator('.gate__input').fill('ABCD12-EFGH34-IJKL56')
  await p.getByRole('button',{name:'start'}).click(); await p.waitForTimeout(250)
  // The living-situation question is asked once, before the first start screen.
  if (await p.locator('.prof__row').count()) {
    await p.getByRole('button',{name:'start'}).click(); await p.waitForTimeout(200)
  }
}
await unlock()

console.log('=== PERSISTENCE ===')
await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(300)
ok('a validated key skips the gate on every later load', await p.locator('.start').isVisible())

console.log('\n=== NAVIGATION ===')
ok('start screen is the entry point', await p.locator('.start').isVisible())
await p.getByRole('button',{name:'something else'}).click(); await p.waitForTimeout(200)
const menuItems = await p.locator('.menu__item').allTextContents()
ok('all five modules reachable', menuItems.length===5, menuItems.join(', '))
ok('menu carries no counts or stats', !/\d/.test(menuItems.join('')))

console.log('\n=== ROOM RESET ===')
await p.getByRole('button',{name:'reset a room'}).click(); await p.waitForTimeout(200)
await p.getByRole('button',{name:'kitchen',exact:true}).click()
await p.getByRole('button',{name:'5 min',exact:true}).click()
await p.waitForSelector('.task__text',{timeout:3000})
ok('room reset serves a task', (await p.locator('.task__text').textContent()).length>0)
ok('timer runs across the set', await p.locator('.timerbar').isVisible())
ok('no "not this one" in a fixed sequence', (await p.getByRole('button',{name:'not this one'}).count())===0)
const t1=await p.locator('.task__text').textContent()
await p.getByRole('button',{name:'done'}).click(); await p.waitForTimeout(250)
const t2=await p.locator('.task__text').textContent()
ok('advances through the sequence', t1!==t2, `${JSON.stringify(t1)} -> ${JSON.stringify(t2)}`)

console.log('\n=== DOOM-PILE: the hard cap is the product ===')
await unlock()
await p.getByRole('button',{name:'something else'}).click(); await p.waitForTimeout(150)
await p.getByRole('button',{name:'sort a pile'}).click(); await p.waitForTimeout(150)
await p.getByRole('textbox',{name:'Name this pile'}).fill('the chair')
await p.getByRole('button',{name:'next'}).click(); await p.waitForTimeout(150)
for (let i=1;i<=12;i++){
  await p.getByRole('textbox',{name:'Item'}).fill(`item ${i}`)
  await p.getByRole('textbox',{name:'Item'}).press('Enter')
}
ok('12 items added', (await p.locator('.dp__count').textContent()).includes('12'))
await p.getByRole('button',{name:'start sorting'}).click(); await p.waitForTimeout(200)
const btns = await p.locator('.dp__grid button').allTextContents()
ok('four decisions, none primary', btns.length===4 && (await p.locator('.dp__grid .btn--primary').count())===0, btns.join(', '))
for (let i=0;i<10;i++){ await p.getByRole('button',{name:'decide later'}).click(); await p.waitForTimeout(60) }
await p.getByRole('button',{name:'decide later'}).click(); await p.waitForTimeout(150)
const refusal = await p.locator('.dp__refused').textContent().catch(()=>null)
ok('11th deferral refused at the cap', /deferred pile is full/.test(refusal||''), JSON.stringify(refusal))
ok('refusal is specific, not generic', /clear one to defer another/i.test(refusal||''))
await p.getByRole('button',{name:'keep'}).click(); await p.waitForTimeout(150)
ok('other decisions still work at the cap', (await p.locator('.dp__refused').count())===0)

console.log('\n=== BRAIN-DUMP: never is said once ===')
await unlock()
await p.getByRole('button',{name:'something else'}).click(); await p.waitForTimeout(150)
await p.getByRole('button',{name:'brain dump'}).click(); await p.waitForTimeout(150)
for (const t of ['ring the dentist','cancel the gym','find the passport']) {
  await p.getByRole('textbox',{name:'One thing'}).fill(t)
  await p.getByRole('textbox',{name:'One thing'}).press('Enter')
}
await p.getByRole('button',{name:'sort it'}).click(); await p.waitForTimeout(200)
ok('three choices only', (await p.locator('.page__foot button').count())===3)
await p.getByRole('button',{name:'never',exact:true}).click(); await p.waitForTimeout(150)
const warn = await p.locator('.bd__warn').textContent().catch(()=>null)
ok('never warns plainly before first use', /deletes it for good/.test(warn||''), JSON.stringify(warn))
await p.getByRole('button',{name:'yes, never'}).click(); await p.waitForTimeout(200)
await p.getByRole('button',{name:'never',exact:true}).click(); await p.waitForTimeout(150)
ok('and never warns again', (await p.locator('.bd__warn').count())===0)

console.log('\n=== PAYDAY: not a budget app ===')
await unlock()
await p.getByRole('button',{name:'something else'}).click(); await p.waitForTimeout(150)
await p.getByRole('button',{name:'payday'}).click(); await p.waitForTimeout(150)
await p.getByRole('textbox',{name:'Day of the month'}).fill('25')
await p.getByRole('button',{name:'save'}).click(); await p.waitForTimeout(200)
const cyc = await p.locator('.pd__cycle').textContent()
ok('cycle date shown at the top', /^Next \w+ 25$/.test(cyc||''), JSON.stringify(cyc))
// Each bill now asks how often it recurs before it lands on the list.
for (const bl of ['rent','phone','electric']) {
  await p.getByRole('textbox',{name:'Bill name'}).fill(bl)
  await p.getByRole('textbox',{name:'Bill name'}).press('Enter')
  await p.waitForTimeout(200)
  await p.getByRole('button',{name:'monthly',exact:true}).click()
  await p.waitForTimeout(200)
}
ok('bills listed', (await p.locator('.pd__bill').count())===3)
await p.locator('.pd__tick').first().click(); await p.waitForTimeout(200)
ok('bill ticks off', (await p.locator('.pd__bill--paid').count())===1)
const pdText = await p.locator('.page').innerText()
ok('no totals, categories or charts', !/total|Ζ|\$|Ł|category|budget|spent/i.test(pdText))

console.log('\n=== SETTINGS: exactly two controls ===')
await p.getByRole('button',{name:'Back'}).click(); await p.waitForTimeout(150)
await p.getByRole('button',{name:'your data'}).click(); await p.waitForTimeout(150)
const setItems = await p.locator('.set__item').allTextContents()
ok('exactly two controls, nothing else', setItems.length===2, setItems.join(', '))
ok('no theme, font or customisation controls', !/theme|font|size|colour|color|notification/i.test(setItems.join(' ')))

console.log('\n=== SECTION 9: what must not exist ===')
const all = await p.evaluate(()=>document.body.innerText)
ok('no streaks, points, badges or levels anywhere', !/streak|points|badge|level|score/i.test(all))
ok('no console/page errors', errs.length===0, errs.join(' | '))

await b.close()
console.log(`\n${fails.length===0?'ALL MODULE CHECKS PASSED':'FAILURES: '+fails.join(', ')}`)
process.exit(fails.length===0?0:1)
