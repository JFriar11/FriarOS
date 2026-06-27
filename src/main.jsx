import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, Apple, BarChart3, CheckCircle2, Dumbbell, HeartPulse, Home, Plus, RotateCcw, Timer, Utensils, Zap } from 'lucide-react'
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
function normalizeLog(logData = {}) {
  return {
    checks: logData.checks || {},
    macros: { protein: 0, carbs: 0, fat: 0, water: 0, ...(logData.macros || {}) },
    recovery: { sleep: '', weight: '', whoop: '', soreness: 3, ...(logData.recovery || {}) },
    notes: logData.notes || '',
    weights: logData.weights || {},
    lifts: Array.isArray(logData.lifts) ? logData.lifts : []
  }
}
const defaultWeeklyPlan = Object.fromEntries(Object.entries(weekPlan).map(([day, plan]) => [day, plan.items.join('\n')]))

function App() {
  const [tab, setTab] = useState('Home')
  const [state, setState] = useState(loadState)
  const dateId = todayId()
  const day = todayName()
  const weeklyPlan = state.weekPlan || defaultWeeklyPlan
  const currentPlanText = weeklyPlan[day] || weekPlan[day].items.join('\n')
  const planItems = currentPlanText.split('\n').map(item => item.trim()).filter(Boolean)
  const plan = { ...weekPlan[day], items: planItems.length ? planItems : weekPlan[day].items }
  const isLight = ['Tuesday','Thursday'].includes(day)
  const targets = isLight ? macroTargets.light : macroTargets.training
  const log = normalizeLog(state[dateId])
  const updateLog = patch => setState(prev => ({ ...prev, [dateId]: { ...normalizeLog(prev[dateId]), ...patch } }))
  const updateWeekPlan = (dayName, value) => setState(prev => ({ ...prev, weekPlan: { ...(prev.weekPlan || defaultWeeklyPlan), [dayName]: value } }))
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
      {tab === 'Plan' && <PlanPage day={day} weeklyPlan={weeklyPlan} updateWeekPlan={updateWeekPlan} />}
      {tab === 'Review' && <ReviewPage state={state} />}
    </main>
    <nav className="nav">{[
      ['Home', Home], ['Workout', Dumbbell], ['Nutrition', Utensils], ['Throwing', Zap], ['Recovery', HeartPulse], ['Plan', Activity], ['Review', BarChart3]
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
  const addLift = () => updateLog({ lifts: [...(log.lifts || []), { exercise: '', sets: '3', reps: '5', weight: '', notes: '' }] })
  return <div className="stack"><Card><div className="row"><div><p className="eyebrow">Coach Mode</p><h2>{plan.focus}</h2></div><Timer/></div><Progress value={pct}/></Card><Card>{plan.items.map(item => <WorkoutRow key={item} item={item} log={log} updateLog={updateLog}/>)}</Card><Card><div className="row"><h3>Lift log</h3><button className="secondary-action" onClick={addLift}>+ Add lift</button></div>{log.lifts?.length ? log.lifts.map((lift, index) => <LiftRow key={`${index}-${lift.exercise || 'new'}`} lift={lift} index={index} log={log} updateLog={updateLog}/>) : <p className="muted">Add the lifts you completed today.</p>}</Card><Notes log={log} updateLog={updateLog}/></div>
}
function WorkoutRow({ item, log, updateLog }) {
  const checked = !!log.checks?.[item]
  const weightValue = log.weights?.[item] || ''
  return <div className="workout-item"><button className="checkrow workout-check" onClick={()=> updateLog({ checks: { ...log.checks, [item]: !checked }}) }><CheckCircle2 className={checked?'done':''}/><span>{item}</span></button><label className="weight-input"><span>Weight</span><input value={weightValue} onChange={e=>updateLog({ weights: { ...(log.weights || {}), [item]: e.target.value } })} placeholder="135" /></label></div>
}
function LiftRow({ lift, index, log, updateLog }) {
  const updateLift = (patch) => updateLog({ lifts: log.lifts.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })
  const removeLift = () => updateLog({ lifts: log.lifts.filter((_, itemIndex) => itemIndex !== index) })
  return <div className="lift-row"><div className="lift-fields"><input value={lift.exercise || ''} onChange={e=>updateLift({ exercise: e.target.value })} placeholder="Exercise" /><input value={lift.sets || ''} onChange={e=>updateLift({ sets: e.target.value })} placeholder="Sets" /><input value={lift.reps || ''} onChange={e=>updateLift({ reps: e.target.value })} placeholder="Reps" /><input value={lift.weight || ''} onChange={e=>updateLift({ weight: e.target.value })} placeholder="Weight" /></div><textarea value={lift.notes || ''} onChange={e=>updateLift({ notes: e.target.value })} placeholder="How it felt / notes" /><button className="text-button" onClick={removeLift}>Remove</button></div>
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
function PlanPage({ day, weeklyPlan, updateWeekPlan }) {
  return <div className="stack">
    <Card>
      <div className="row"><div><p className="eyebrow">Weekly Planner</p><h2>Shape next week</h2></div><Activity/></div>
      <p className="muted">Edit the lifts for each day and use this as your offseason planning board.</p>
    </Card>
    <Card>
      <div className="plan-grid">
        {days.map(dayName => <label key={dayName} className="plan-day"><span>{dayName}</span><textarea value={weeklyPlan[dayName] || ''} onChange={e => updateWeekPlan(dayName, e.target.value)} placeholder={`Add lifts for ${dayName}`} /></label>)}
      </div>
    </Card>
  </div>
}

function ReviewPage({ state }) {
  const entries = Object.entries(state).filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key)).sort().slice(-7)
  const summary = useMemo(() => {
    if (entries.length === 0) return null

    const stats = entries.map(([date, log]) => {
      const dayName = days[new Date(`${date}T00:00:00`).getDay()]
      const plan = weekPlan[dayName]
      const total = plan?.items?.length || 1
      const completed = Object.values(log.checks || {}).filter(Boolean).length
      const pct = Math.round((completed / total) * 100)
      return {
        date,
        dayName,
        pct,
        lifts: Array.isArray(log.lifts) ? log.lifts : [],
        protein: log.macros?.protein || 0,
        soreness: Number(log.recovery?.soreness || 0)
      }
    })

    return stats
  }, [entries])

  if (!summary) {
    return <div className="stack"><Card><h2>Weekly Review</h2><p className="muted">Log a few days to see what to keep, change, or progress.</p></Card></div>
  }

  return <div className="stack">
    <Card>
      <h2>Weekly Review</h2>
      <p className="muted">Use this section to decide what to adjust before the next week starts.</p>
    </Card>
    {summary.map(({ date, dayName, pct, lifts, protein, soreness }) => <Card key={date}><div className="row"><div><b>{date}</b><p className="muted">{dayName}</p></div><span>{pct}% complete</span></div>{lifts.length === 0 ? <p className="muted">No lifts logged.</p> : <ul className="review-list">{lifts.map((lift, index) => <li key={`${date}-${index}`}><b>{lift.exercise || 'Untitled lift'}</b><span>{lift.sets || 0}x{lift.reps || 0} @ {lift.weight || '--'}</span><p>{lift.notes || 'No notes'}</p></li>)}</ul>}<p className="muted">Protein: {protein}g · Soreness: {soreness}/10</p></Card>)}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
