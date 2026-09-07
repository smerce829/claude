import { chromium } from 'playwright'
const B='http://localhost:4173/'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const fails=[]
const ok=(n,c,d='')=>{ console.log(`  ${c?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`); if(!c) fails.push(n) }

/** Tasks tagged `requires` in the low/5 bucket. Gated entirely on the profile. */
const GATED = ["Refill the pet's water bowl", 'Put one toy in its bin']

async function session(pick) {
  const ctx = await b.newContext({viewport:{width:375,height:667}})
  await ctx.route('**/api/validate.php', r => r.fulfill({status:200,contentType:'application/json',body:'{"valid":true}'}))
  const p = await ctx.newPage()
  await p.goto(B,{waitUntil:'networkidle'})
  await p.locator('.gate__input').fill('ABCD12-EFGH34-IJKL56')
  await p.getByRole('button',{name:'start'}).click(); await p.waitForTimeout(250)
  for (const label of pick) await p.getByRole('button',{name:label,exact:true}).click()
  await p.getByRole('button',{name:'start'}).click(); await p.waitForTimeout(250)
  return { ctx, p }
}

/** Draw n tasks from the low/5 bucket and report which distinct ones appeared. */
async function draw(p, n) {
  const seen = new Set()
  for (let i=0;i<n;i++){
    await p.getByRole('button',{name:'low',exact:true}).click()
    await p.getByRole('button',{name:'5 min',exact:true}).click()
    await p.waitForSelector('.task__text')
    seen.add((await p.locator('.task__text').textContent()).trim())
    await p.getByRole('button',{name:'done'}).click()
    await p.getByRole('button',{name:'go again'}).click()
    await p.waitForSelector('.start')
  }
  return seen
}

console.log('\n=== PROFILE IS ASKED ONCE ===')
{
  const ctx = await b.newContext({viewport:{width:375,height:667}})
  await ctx.route('**/api/validate.php', r => r.fulfill({status:200,contentType:'application/json',body:'{"valid":true}'}))
  const p = await ctx.newPage()
  await p.goto(B,{waitUntil:'networkidle'})
  await p.locator('.gate__input').fill('ABCD12-EFGH34-IJKL56')
  await p.getByRole('button',{name:'start'}).click(); await p.waitForTimeout(250)
  ok('asked after the gate on first run', await p.locator('.prof__row').isVisible())
  ok('three options, nothing else', (await p.locator('.prof__tile').count())===3)
  await p.getByRole('button',{name:'start'}).click(); await p.waitForTimeout(250)
  ok('skippable in one tap', await p.locator('.start').isVisible())
  await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(300)
  ok('never asked again', (await p.locator('.prof__row').count())===0 && await p.locator('.start').isVisible())
  await ctx.close()
}

console.log('\n=== WITHOUT THE PROFILE, GATED TASKS MUST NEVER APPEAR ===')
{
  const { ctx, p } = await session([])
  const seen = await draw(p, 45)
  const leaked = GATED.filter(t => seen.has(t))
  ok('no profile-gated task served in 45 draws', leaked.length===0, leaked.join(', ') || `${seen.size} distinct tasks seen`)
  await ctx.close()
}

console.log('\n=== WITH THE PROFILE, THEY MUST BECOME ELIGIBLE ===')
{
  const { ctx, p } = await session(['kids','pets'])
  const seen = await draw(p, 45)
  const got = GATED.filter(t => seen.has(t))
  ok('profile-gated tasks now served', got.length>0, got.join(', ') || `only saw ${seen.size} distinct`)
  await ctx.close()
}

console.log('\n=== PAYDAY DEFAULTS ===')
{
  const { ctx, p } = await session([])
  await p.getByRole('button',{name:'something else'}).click(); await p.waitForTimeout(150)
  await p.getByRole('button',{name:'payday'}).click(); await p.waitForTimeout(150)
  await p.getByRole('textbox',{name:'Day of the month'}).fill('25')
  await p.getByRole('button',{name:'save'}).click(); await p.waitForTimeout(200)
  const chips = await p.locator('.pd__chip').allTextContents()
  ok('empty state offers quick adds', chips.length>=5, chips.join(', '))
  ok('nothing pre-added without a tap', (await p.locator('.pd__bill').count())===0)
  await p.getByRole('button',{name:'rent',exact:true}).click(); await p.waitForTimeout(250)
  ok('a default asks how often before adding', (await p.locator('.pd__freq .tile').count())===6)
  await p.getByRole('button',{name:'monthly',exact:true}).click(); await p.waitForTimeout(250)
  ok('choosing a frequency adds it', (await p.locator('.pd__bill').count())===1)
  await p.getByRole('textbox',{name:'Bill name'}).fill('typo bill')
  await p.getByRole('textbox',{name:'Bill name'}).press('Enter'); await p.waitForTimeout(250)
  await p.getByRole('button',{name:'monthly',exact:true}).click(); await p.waitForTimeout(250)
  ok('two bills now', (await p.locator('.pd__bill').count())===2)
  await p.getByRole('button',{name:'Remove typo bill'}).click(); await p.waitForTimeout(200)
  ok('a mistyped bill can be removed', (await p.locator('.pd__bill').count())===1)
  await ctx.close()
}

await b.close()
console.log(`\n${fails.length===0?'ALL PROFILE CHECKS PASSED':'FAILURES: '+fails.join(', ')}`)
process.exit(fails.length===0?0:1)
