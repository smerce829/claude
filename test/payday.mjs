/* Pure-logic checks for the v6 payday rules. No browser needed. */
import { execSync } from 'child_process'
import fs from 'fs'
// Compile the module under test to plain JS so node can import it.
fs.mkdirSync('/tmp/pdtest', { recursive: true })
execSync('npx esbuild src/lib/payday.ts --bundle --format=esm --outfile=/tmp/pdtest/payday.mjs --log-level=error')
const { isDue, advanceCycles, visibleBills, cyclesElapsed, nextCycleDate } = await import('/tmp/pdtest/payday.mjs')

const fails=[]
const ok=(n,c,d='')=>{ console.log(`  ${c?'PASS':'FAIL'}  ${n}${d?' — '+d:''}`); if(!c) fails.push(n) }
const bill=(o)=>({ name:'x', frequency:'monthly', anchorDay:25, anchorCycle:0, checked:false, ...o })

console.log('\n=== §7.4 A BILL ONLY APPEARS WHEN IT IS ACTUALLY DUE ===')
ok('monthly is due every cycle', [0,1,2,3,11].every(c=>isDue(bill({}),c)))
const yearly = bill({frequency:'everyNMonths', months:12})
ok('yearly is due on cycle 0', isDue(yearly,0))
ok('yearly is NOT due on cycles 1-11', [1,2,3,6,11].every(c=>!isDue(yearly,c)), 'the v6 bug: flagged overdue for 11 months')
ok('yearly is due again on cycle 12', isDue(yearly,12))
const q = bill({frequency:'everyNMonths', months:3})
ok('every 3 months: due on 0,3,6', [0,3,6].every(c=>isDue(q,c)))
ok('every 3 months: not due on 1,2,4', [1,2,4].every(c=>!isDue(q,c)))
ok('biweekly recurs inside every monthly cycle', isDue(bill({frequency:'biweekly'}),5))

console.log('\n=== §7.4 CARRYOVER ONLY APPLIES TO BILLS THAT WERE DUE ===')
const jan = new Date(2026,0,25).getTime()
const feb = new Date(2026,1,26)
// The yearly bill is paid in cycle 0, so it has no reason to carry. What is
// under test is whether cycles 1-11, where it is simply not due, wrongly
// flag it — the exact regression v6 exists to prevent.
let pd = { cycle:25, lastRun:jan, cycleIndex:0, carryover:[],
  bills:[ bill({name:'rent'}), bill({name:'phone', checked:true}),
          bill({name:'car insurance', frequency:'everyNMonths', months:12, checked:true}) ] }
const after = advanceCycles(pd, feb)
ok('cycle advanced', after.changed && after.payday.cycleIndex===1, `index ${after.payday.cycleIndex}`)
ok('unchecked due bill carries over', after.payday.carryover.includes('rent'))
ok('checked bill does not carry', !after.payday.carryover.includes('phone'))
ok('a bill not due is NOT flagged as carryover', !after.payday.carryover.includes('car insurance'),
   'this is the exact v6 regression being prevented')
ok('checks reset for the new cycle', after.payday.bills.every(b=>!b.checked))

// Eleven further cycles with the yearly bill never due and never touched.
let rolling = after.payday
for (let m = 2; m <= 11; m++) {
  rolling = advanceCycles({ ...rolling, lastRun: new Date(2026, m-1, 26).getTime() },
                          new Date(2026, m, 26)).payday
}
ok('still not flagged after eleven idle cycles',
   !rolling.carryover.includes('car insurance'), rolling.carryover.join(', ') || '(empty)')
ok('and it is due again a year on', isDue(bill({frequency:'everyNMonths',months:12}), 12))

console.log('\n=== §7.4 CARRIED BILLS PIN TO THE TOP UNTIL CHECKED ===')
const v = visibleBills(after.payday)
ok('carried bill pinned above the divider', v.carried.map(b=>b.name).join()==='rent', v.carried.map(b=>b.name).join())
ok('yearly bill absent from this cycle', !v.due.some(b=>b.name==='car insurance') && !v.carried.some(b=>b.name==='car insurance'))
ok('phone still shown as due', v.due.some(b=>b.name==='phone'))
const held = advanceCycles({...after.payday, lastRun: new Date(2026,1,26).getTime()}, new Date(2026,2,26))
ok('an unchecked carried bill stays carried', held.payday.carryover.includes('rent'))

console.log('\n=== ONE-TIME BILLS ===')
let once = { cycle:25, lastRun:jan, cycleIndex:0, carryover:[],
  bills:[ bill({name:'dmv fee', frequency:'once', checked:true}) ] }
ok('a checked one-time bill is removed entirely', advanceCycles(once, feb).payday.bills.length===0)
once = { ...once, bills:[ bill({name:'dmv fee', frequency:'once', checked:false}) ] }
ok('an unchecked one-time bill carries over', advanceCycles(once, feb).payday.carryover.includes('dmv fee'))

console.log('\n=== CYCLE DATE MATH ===')
ok('31st clamps to the last day of February', nextCycleDate(31, new Date(2026,1,1)).getDate()===28,
   String(nextCycleDate(31, new Date(2026,1,1)).getDate()))
ok('two months elapsed counts two cycles',
   cyclesElapsed(25, new Date(2026,0,25).getTime(), new Date(2026,2,26))===2,
   String(cyclesElapsed(25, new Date(2026,0,25).getTime(), new Date(2026,2,26))))
ok('same cycle counts zero', cyclesElapsed(25, new Date(2026,0,25).getTime(), new Date(2026,0,28))===0)

console.log(`\n${fails.length===0?'ALL PAYDAY CHECKS PASSED':'FAILURES: '+fails.join(', ')}`)
process.exit(fails.length===0?0:1)
