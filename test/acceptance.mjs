import { chromium } from 'playwright'
const B='http://localhost:4173/'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const fails=[]
const ok=(n,c,d='')=>{ console.log(`  ${c?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`); if(!c) fails.push(n) }

const ctx = await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})
const p = await ctx.newPage()
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())})

console.log('\n=== GATE ===')
await p.goto(B,{waitUntil:'networkidle'})
ok('gate is first screen', await p.getByText('Paste your key').isVisible())
ok('no app chrome before unlock', (await p.locator('.dock').count())===0 && (await p.locator('.hdr').count())===0)
await p.locator('.gate__input').fill('nope')
await p.getByRole('button',{name:'Start'}).click(); await p.waitForTimeout(220)
ok('invalid key gives a specific reason', /wasn't recognised/.test(await p.locator('.gate__error').textContent()||''))
await p.locator('.gate__input').fill('ABCD12-EFGH34-IJKL56')
await p.getByRole('button',{name:'Start'}).click(); await p.waitForTimeout(300)
await p.getByRole('button',{name:'Start'}).click(); await p.waitForTimeout(300)

console.log('\n=== TWO TAPS TO A RUNNING TASK ===')
ok('app chrome present after unlock', await p.locator('.dock').isVisible() && await p.locator('.hdr').isVisible())
const t0=Date.now()
await p.getByRole('button',{name:'Low',exact:true}).click()
await p.getByRole('button',{name:'5 min',exact:true}).click()
await p.waitForSelector('.task__text',{timeout:3000})
ok('two taps, under 3 seconds', Date.now()-t0<3000, `${Date.now()-t0}ms`)
ok('task text present', ((await p.locator('.task__text').textContent())||'').length>0)

console.log('\n=== RADIAL TIMER ===')
ok('ring rendered', await p.locator('.ring__fill').isVisible())
ok('countdown digits shown', /^\d+:\d{2}$/.test((await p.locator('.ring__time').textContent())||''))
ok('tabular numerals', (await p.locator('.ring__time').evaluate(e=>getComputedStyle(e).fontVariantNumeric))==='tabular-nums')
const off = () => p.locator('.ring__fill').evaluate(e=>parseFloat(e.getAttribute('stroke-dashoffset')))
const o1=await off(); await p.waitForTimeout(2000); const o2=await off()
ok('ring empties as time passes', o2>o1, `${o1.toFixed(1)} -> ${o2.toFixed(1)}`)
// 2s of a 300s timer over a 540.4 circumference is ~3.6 units.
const drop=o2-o1, want=2*Math.PI*86*2/300
ok('depletion matches wall clock', Math.abs(drop-want)<1.2, `${drop.toFixed(2)} vs ~${want.toFixed(2)}`)

console.log('\n=== LAYOUT & TARGETS ===')
const sc = await p.evaluate(()=>({w:document.documentElement.scrollWidth,iw:innerWidth}))
ok('no horizontal scroll', sc.w<=sc.iw+1, `${sc.w} vs ${sc.iw}`)
const small = await p.evaluate(()=>[...document.querySelectorAll('button')]
  .filter(b=>b.offsetParent!==null)
  .filter(b=>{const r=b.getBoundingClientRect();return r.height<44||r.width<44})
  .map(b=>(b.getAttribute('aria-label')||b.textContent||'?').trim()+':'+Math.round(b.getBoundingClientRect().height)))
ok('every visible control >= 44px', small.length===0, small.join(', '))
const dockClear = await p.evaluate(()=>{
  const d=document.querySelector('.dock').getBoundingClientRect()
  const f=document.querySelector('.page__foot')
  return !f || f.getBoundingClientRect().bottom <= d.top + 1
})
ok('content never sits under the dock', dockClear)

console.log('\n=== ACCENT CONTRAST (directive fails with white; must be ink) ===')
const lum=(r,g,b)=>{const f=c=>{c/=255;return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)}
const rgb=s=>s.match(/\d+/g).map(Number)
const btn = await p.locator('.btn--action').first().evaluate(e=>({fg:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor}))
const [L1,L2]=[lum(...rgb(btn.fg)),lum(...rgb(btn.bg))]
const cr=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05)
ok('primary button label passes AA', cr>=4.5, `${cr.toFixed(2)}:1 (${btn.fg} on ${btn.bg})`)

console.log('\n=== COMPLETION & STREAK ===')
await p.getByRole('button',{name:'Done'}).click(); await p.waitForTimeout(400)
ok('completion screen', /Done/.test(await p.locator('.done__word').textContent()||''))
ok('streak badge appears after first completion', await p.locator('.streak').isVisible())
ok('streak reads 1 day', /1-day streak/.test(await p.locator('.streak').textContent()||''))

console.log('\n=== LOW-ENERGY MODE ===')
await p.getByRole('button',{name:'Go again'}).click(); await p.waitForTimeout(300)
await p.getByRole('switch',{name:'Low-energy mode'}).click(); await p.waitForTimeout(600)
ok('root flags low-energy', (await p.evaluate(()=>document.documentElement.getAttribute('data-energy')))==='low')
ok('exactly three micro-actions', (await p.locator('.micro__card').count())===3)
ok('choosers are gone', (await p.locator('.pill').count())===0)
ok('streak badge dimmed away', (await p.locator('.dim-on-low').first().evaluate(e=>getComputedStyle(e).opacity))==='0')
const accent = await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim())
ok('accent warms to amber', accent==='#f59e0b' || accent==='var(--amber)', accent)
await p.getByRole('switch',{name:'Low-energy mode'}).click(); await p.waitForTimeout(500)
ok('toggling back restores the choosers', (await p.locator('.pill').count())===6)

console.log('\n=== PERSISTENCE + REDUCED MOTION ===')
await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400)
ok('key and profile survive reload', await p.locator('.start').isVisible())
const rctx = await b.newContext({viewport:{width:390,height:844}, reducedMotion:'reduce'})
const rp = await rctx.newPage(); await rp.goto(B,{waitUntil:'networkidle'})
await rp.locator('.gate__input').fill('ABCD12-EFGH34-IJKL56')
await rp.getByRole('button',{name:'Start'}).click(); await rp.waitForTimeout(300)
await rp.getByRole('button',{name:'Start'}).click(); await rp.waitForTimeout(300)
await rp.getByRole('button',{name:'Low',exact:true}).click()
await rp.getByRole('button',{name:'5 min',exact:true}).click()
await rp.waitForSelector('.task__text')
const r1=await rp.locator('.ring__fill').evaluate(e=>parseFloat(e.getAttribute('stroke-dashoffset')))
await rp.waitForTimeout(2500)
const r2=await rp.locator('.ring__fill').evaluate(e=>parseFloat(e.getAttribute('stroke-dashoffset')))
ok('timer still advances under reduced motion', r2>r1, `${r1.toFixed(1)} -> ${r2.toFixed(1)}`)

ok('no console or page errors', errs.length===0, errs.join(' | '))
await b.close()
console.log(`\n${fails.length===0?'ALL CHECKS PASSED':'FAILURES: '+fails.join(', ')}`)
process.exit(fails.length===0?0:1)
