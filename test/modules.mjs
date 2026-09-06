import { chromium } from 'playwright'
const B='http://localhost:4173/'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const fails=[]
const ok=(n,c,d='')=>{ console.log(`  ${c?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`); if(!c) fails.push(n) }
const errs=[]
let p
const fresh = async () => {
  const ctx = await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})
  p = await ctx.newPage()
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())})
  await p.goto(B,{waitUntil:'networkidle'})
  await p.locator('.gate__input').fill('ABCD12-EFGH34-IJKL56')
  await p.getByRole('button',{name:'Start'}).click(); await p.waitForTimeout(250)
  await p.getByRole('button',{name:'Start'}).click(); await p.waitForTimeout(250)
}

console.log('\n=== BOTTOM DOCK ===')
await fresh()
const tabs = await p.locator('.dock__tab').allTextContents()
ok('five tabs, the documented cap', tabs.length===5, tabs.join(', '))
ok('active tab is backlit', (await p.locator('.dock__tab--active').count())===1)
await p.getByRole('button',{name:'Money'}).click(); await p.waitForTimeout(250)
ok('dock navigates', (await p.locator('.dock__tab--active').textContent())?.includes('Money'))

console.log('\n=== ROOM RESET ===')
await p.getByRole('button',{name:'Reset'}).click(); await p.waitForTimeout(250)
await p.getByRole('button',{name:'kitchen',exact:true}).click()
await p.getByRole('button',{name:'5 min',exact:true}).click()
await p.waitForSelector('.task__text',{timeout:3000})
ok('serves a task with the ring running', await p.locator('.ring__fill').isVisible())
ok('no swap in a fixed sequence', (await p.getByRole('button',{name:'Not this one'}).count())===0)
const t1=await p.locator('.task__text').textContent()
await p.getByRole('button',{name:'Done'}).click(); await p.waitForTimeout(300)
const t2=await p.locator('.task__text').textContent()
ok('advances through the sequence', t1!==t2, `${JSON.stringify(t1)} -> ${JSON.stringify(t2)}`)

console.log('\n=== DOOM-PILE: binary wizard, cap preserved ===')
await fresh()
await p.getByRole('button',{name:'Pile'}).click(); await p.waitForTimeout(200)
await p.getByRole('textbox',{name:'Pile name'}).fill('the chair')
await p.getByRole('button',{name:'Next'}).click(); await p.waitForTimeout(200)
for (let i=1;i<=12;i++){
  await p.getByRole('textbox',{name:'Item'}).fill(`item ${i}`)
  await p.getByRole('textbox',{name:'Item'}).press('Enter')
}
await p.getByRole('button',{name:/^Sort 12/}).click(); await p.waitForTimeout(350)
ok('step dots show 1 of 2', /Step 1 of 2/.test(await p.locator('.steps__text').textContent()||''))
ok('two binary choices', (await p.locator('.dp__choice').count())===2)
await p.getByRole('button',{name:/Keep/}).click(); await p.waitForTimeout(250)
ok('advances to step 2 of 2', /Step 2 of 2/.test(await p.locator('.steps__text').textContent()||''))
ok('second question is the location one', /live in this room/.test(await p.locator('.dp__q').textContent()||''))
await p.getByRole('button',{name:/Elsewhere/}).click(); await p.waitForTimeout(350)
ok('resolves and resets to step 1', /Step 1 of 2/.test(await p.locator('.steps__text').textContent()||''))
for (let i=0;i<10;i++){ await p.getByRole('button',{name:'Decide later'}).click(); await p.waitForTimeout(70) }
await p.getByRole('button',{name:'Decide later'}).click(); await p.waitForTimeout(220)
const refusal = await p.locator('.dp__refused').textContent().catch(()=>null)
ok('11th deferral refused at the cap', /Deferred pile is full/i.test(refusal||''), JSON.stringify(refusal))
ok('refusal names the fix', /clear one to defer another/i.test(refusal||''))
await p.getByRole('button',{name:/Trash/}).click(); await p.waitForTimeout(300)
ok('other decisions still work at the cap', (await p.locator('.dp__refused').count())===0)

console.log('\n=== BRAIN-DUMP ===')
await fresh()
await p.getByRole('button',{name:'Brain'}).click(); await p.waitForTimeout(200)
for (const t of ['ring the dentist','cancel the gym','find the passport']) {
  await p.locator('.bd__input').fill(t); await p.locator('.bd__input').press('Enter')
}
ok('captured without leaving the screen', (await p.locator('.bd__pill').count())===3)
await p.getByRole('button',{name:/^Sort 3/}).click(); await p.waitForTimeout(300)
ok('three triage choices', (await p.locator('.page__foot button').count())===3)
await p.getByRole('button',{name:'Never',exact:true}).click(); await p.waitForTimeout(220)
ok('never warns before first use', /deletes it for good/.test(await p.locator('.bd__warn').textContent()||''))
await p.getByRole('button',{name:'Yes, never'}).click(); await p.waitForTimeout(300)
await p.getByRole('button',{name:'Never',exact:true}).click(); await p.waitForTimeout(220)
ok('and never warns again', (await p.locator('.bd__warn').count())===0)

console.log('\n=== SETTINGS ===')
await fresh()
await p.getByRole('button',{name:'Your data'}).click(); await p.waitForTimeout(250)
const setItems = await p.locator('.set__item').allTextContents()
ok('exactly two controls', setItems.length===2, setItems.join(', '))

ok('no console or page errors', errs.length===0, errs.join(' | '))
await b.close()
console.log(`\n${fails.length===0?'ALL MODULE CHECKS PASSED':'FAILURES: '+fails.join(', ')}`)
process.exit(fails.length===0?0:1)
