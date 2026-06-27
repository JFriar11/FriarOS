import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, Apple, BarChart3, CheckCircle2, Dumbbell, HeartPulse, Home, Plus, RotateCcw, Timer, Utensils, Zap } from 'lucide-react'
import { weekPlan, macroTargets } from './data/program'
import './styles.css'

const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const todayName = () => days[new Date().getDay()]
const storageKey = 'athlete-os-v2'

function loadState() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {} } catch { return {} }
}
function saveState(state) { localStorage.setItem(storageKey, JSON.stringify(state)) }
function todayId() { return new Date().toISOString().slice(0,10) }

function App() {
  const [tab, setTab] = useState('Home')
  const [state, setState] = useState(loadState)
  const dateId = todayId()
  const day = todayName()
  const plan = weekPlan[day]
  const isLight = ['Tuesday','Thursday'].includes(day)
  const targets = isLight ? macroTargets.light : macroTargets.training
  const log = state[dateId] || { checks: {}, macros: { protein:0, carbs:0, fat:0, water:0 }, recovery: { sleep:'', weight:'', whoop:'', soreness:3 }, notes:'' }
  const updateLog = patch => setState(prev => ({ ...prev, [dateId]: { ...log, ...patch } }))
  useEffect(() => saveState(state), [state])
  const completed = plan.items.filter(item => log.checks?.[item]).length
  const pct = Math.round((completed / plan.items.length) * 100)

  const props = { day, plan, log, targets, updateLog, pct, completed }

  return <div className="app">
    <header className="top"><div><p className="eyebrow">AthleteOS</p><h1>{day}</h1></div><div className="score">{pct}%</div></header>
    <main>
      {tab === 'Home' && <HomePage {...props} />}
      {tab === 'Workout' && <WorkoutPage {...props} />}
      {tab === 'Nutrition' && <NutritionPage {...props} />}
      {tab === 'Throwing' && <ThrowingPage {...props} />}
      {tab === 'Recovery' && <RecoveryPage {...props} />}
      {tab === 'Progress' && <ProgressPage state={state} />}
    </main>
    <nav className="nav">{[
      ['Home', Home], ['Workout', Dumbbell], ['Nutrition', Utensils], ['Throwing', Zap], ['Recovery', HeartPulse], ['Progress', BarChart3]
    ].map(([name, Icon]) => <button key={name} onClick={()=>setTab(name)} className={tab===name?'active':''}><Icon size={20}/><span>{name}</span></button>)}</nav>
  </div>
}

function Card({children, className=''}) { return <section className={`card ${className}`}>{children}</section> }
function Progress({value}) { return <div className="bar"><span style={{width:`${Math.min(value,100)}%`}} /></div> }

function HomePage({ day, plan, log, targets, updateLog, pct, completed }) {
  return <div className="stack">
    <Card className="hero"><p className="eyebrow">Today's Focus</p><h2>{plan.focus}</h2><span className="pill">{plan.type}</span><Progress value={pct}/><p>{completed}/{plan.items.length} tasks complete</p></Card>
    <Card><h3>Daily Checklist</h3>{plan.items.slice(0,6).map(item => <CheckRow key={item} item={item} log={log} updateLog={updateLog}/>)}</Card>
    <MacroMini log={log} targets={targets} updateLog={updateLog}/>
    <RecoveryMini log={log} updateLog={updateLog}/>
  </div>
}
function CheckRow({item, log, updateLog}) {
  const checked = !!log.checks?.[item]
  return <button className="checkrow" onClick={()=> updateLog({ checks: { ...log.checks, [item]: !checked }}) }><CheckCircle2 className={checked?'done':''}/><span>{item}</span></button>
}
function WorkoutPage({ plan, log, updateLog, pct }) {
  return <div className="stack"><Card><div className="row"><div><p className="eyebrow">Coach Mode</p><h2>{plan.focus}</h2></div><Timer/></div><Progress value={pct}/></Card><Card>{plan.items.map(item => <CheckRow key={item} item={item} log={log} updateLog={updateLog}/>)}</Card><Notes log={log} updateLog={updateLog}/></div>
}
function MacroMini({log, targets, updateLog}) { return <Card><h3>Nutrition</h3><Macro name="Protein" unit="g" value={log.macros.protein} target={targets.protein} add={25} log={log} updateLog={updateLog}/><Macro name="Carbs" unit="g" value={log.macros.carbs} target={targets.carbs} add={50} log={log} updateLog={updateLog}/><Macro name="Fat" unit="g" value={log.macros.fat} target={targets.fat} add={15} log={log} updateLog={updateLog}/></Card> }
function NutritionPage(props) { return <div className="stack"><MacroMini {...props}/><Card><h3>Quick Add</h3><div className="grid"><Quick label="Shake" p={25} c={5} f={2} {...props}/><Quick label="Chicken + Rice" p={45} c={80} f={12} {...props}/><Quick label="Greek Yogurt" p={25} c={15} f={0} {...props}/><Quick label="Snack" p={10} c={35} f={8} {...props}/></div></Card></div> }
function Macro({name, unit, value, target, add, log, updateLog}) {
  const key = name.toLowerCase()
  return <div className="macro"><div className="row"><b>{name}</b><span>{value}/{target}{unit}</span></div><Progress value={(value/target)*100}/><div className="actions"><button onClick={()=>updateLog({macros:{...log.macros,[key]:value+add}})}><Plus size={16}/> +{add}{unit}</button><button onClick={()=>updateLog({macros:{...log.macros,[key]:0}})}><RotateCcw size={16}/></button></div></div>
}
function Quick({label,p,c,f,log,updateLog}) { return <button className="quick" onClick={()=>updateLog({macros:{...log.macros,protein:log.macros.protein+p,carbs:log.macros.carbs+c,fat:log.macros.fat+f}})}><Apple/><b>{label}</b><span>{p}P / {c}C / {f}F</span></button> }
function ThrowingPage({log,updateLog}) { const items=['Catch','Long Toss','Pull Downs','Ground Balls','Double Plays','Backhands','Short Hops','Arm Care']; return <div className="stack"><Card><h2>Throwing</h2>{items.map(item => <CheckRow key={item} item={`Throwing: ${item}`} log={log} updateLog={updateLog}/>)}</Card><Notes log={log} updateLog={updateLog}/></div> }
function RecoveryMini({log, updateLog}) { return <Card><h3>Recovery</h3><div className="inputs"><label>Sleep<input value={log.recovery.sleep} onChange={e=>updateLog({recovery:{...log.recovery,sleep:e.target.value}})} placeholder="7.8"/></label><label>Weight<input value={log.recovery.weight} onChange={e=>updateLog({recovery:{...log.recovery,weight:e.target.value}})} placeholder="188.2"/></label><label>WHOOP<input value={log.recovery.whoop} onChange={e=>updateLog({recovery:{...log.recovery,whoop:e.target.value}})} placeholder="82"/></label></div></Card> }
function RecoveryPage(props) { return <div className="stack"><RecoveryMini {...props}/><Card><h3>Soreness</h3><input type="range" min="1" max="10" value={props.log.recovery.soreness} onChange={e=>props.updateLog({recovery:{...props.log.recovery,soreness:e.target.value}})}/><p>{props.log.recovery.soreness}/10</p></Card><Notes {...props}/></div> }
function Notes({log, updateLog}) { return <Card><h3>Notes</h3><textarea value={log.notes} onChange={e=>updateLog({notes:e.target.value})} placeholder="How did you feel today?" /></Card> }
function ProgressPage({state}) { const entries = Object.entries(state).sort().slice(-7); return <div className="stack"><Card><h2>Last 7 Logs</h2>{entries.length===0 && <p>No saved days yet.</p>}{entries.map(([date,log]) => <div className="history" key={date}><b>{date}</b><span>{Object.values(log.checks||{}).filter(Boolean).length} tasks</span><span>{log.macros?.protein||0}g protein</span></div>)}</Card></div> }

createRoot(document.getElementById('root')).render(<App />)
