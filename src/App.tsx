import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Apple,
  BarChart3,
  CheckCircle2,
  Dumbbell,
  HeartPulse,
  Home,
  Plus,
  RotateCcw,
  Timer,
  Utensils,
  Zap
} from 'lucide-react'
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from './components/ui/Card'
import { ProgressBar } from './components/ui/ProgressBar'
import { ChecklistRow } from './components/ChecklistRow'
import { usePersistentState } from './hooks/usePersistentState'
import { weekPlan, macroTargets } from './data/program'
import { buildPlan, DAYS, getTodayId, getTodayName, normalizeLog } from './utils/plan'
import type { AppState, DailyLog, LiftEntry, MacroTargets, PlanDay, WeeklyPlanMap, WorkoutExerciseState, WorkoutSessionState } from './types'
import { CoachExerciseCard } from './components/workout/CoachExerciseCard'
import { WorkoutFinishScreen } from './components/workout/WorkoutFinishScreen'

const throwingPlan = [
  'Catch',
  'Long Toss',
  'Pull Downs',
  'Ground Balls',
  'Double Plays',
  'Backhands',
  'Short Hops',
  'Arm Care'
]

const defaultWeeklyPlan = Object.fromEntries(
  Object.entries(weekPlan).map(([day, plan]) => [day, plan.items.join('\n')])
) as WeeklyPlanMap

const planDefaults = {
  ...defaultWeeklyPlan,
  Monday: [defaultWeeklyPlan.Monday, throwingPlan.join('\n')].filter(Boolean).join('\n\nThrowing:\n'),
  Wednesday: [defaultWeeklyPlan.Wednesday, throwingPlan.join('\n')].filter(Boolean).join('\n\nThrowing:\n'),
  Thursday: [defaultWeeklyPlan.Thursday, throwingPlan.join('\n')].filter(Boolean).join('\n\nThrowing:\n')
} as WeeklyPlanMap

type TabName = 'Home' | 'Workout' | 'Nutrition' | 'Throwing' | 'Recovery' | 'Plan' | 'Review'

function getPreviousValue(exerciseName: string, state: AppState) {
  const entries = Object.entries(state)
    .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key))
    .sort()

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const [, log] = entries[index]
    const previousWorkout = log?.workoutSession?.exercises?.find((exercise) => exercise.name === exerciseName)
    if (previousWorkout?.targetWeight) {
      return previousWorkout.targetWeight
    }

    if (log?.weights?.[exerciseName]) {
      return log.weights[exerciseName]
    }
  }

  return ''
}

function createWorkoutSession(planItems: string[], state: AppState): WorkoutSessionState {
  return {
    startedAt: new Date().toISOString(),
    activeExerciseIndex: 0,
    phase: 'active',
    restSecondsLeft: 0,
    exercises: planItems.map((item) => ({
      name: item,
      sets: 3,
      reps: '5',
      previousValue: getPreviousValue(item, state),
      targetWeight: '',
      notes: '',
      completedSets: 0,
      completed: false
    }))
  }
}

function getWorkoutProgress(session: WorkoutSessionState) {
  const completedExercises = session.exercises.filter((exercise) => exercise.completed).length
  const currentExercise = session.exercises[session.activeExerciseIndex]
  const currentFraction = currentExercise ? currentExercise.completedSets / Math.max(currentExercise.sets, 1) : 0
  const total = session.exercises.length
  return Math.min(100, Math.round(((completedExercises + currentFraction) / Math.max(total, 1)) * 100))
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function App() {
  const [tab, setTab] = useState<TabName>('Home')
  const [state, setState] = usePersistentState<AppState>({})
  const dateId = getTodayId()
  const day = getTodayName()
  const weeklyPlan = state.weekPlan || planDefaults
  const currentPlanText = weeklyPlan[day] || weekPlan[day].items.join('\n')
  const plan = buildPlan(day, currentPlanText, weekPlan[day])
  const isLight = ['Tuesday', 'Thursday'].includes(day)
  const targets = isLight ? macroTargets.light : macroTargets.training
  const log = normalizeLog(state[dateId])

  const updateLog = (patch: Partial<DailyLog>) => {
    setState((prev) => ({
      ...prev,
      [dateId]: { ...normalizeLog(prev[dateId]), ...patch }
    }))
  }

  const updateWeekPlan = (dayName: string, value: string) => {
    setState((prev) => ({
      ...prev,
      weekPlan: { ...(prev.weekPlan || defaultWeeklyPlan), [dayName]: value }
    }))
  }

  const completed = plan.items.filter((item) => log.checks?.[item]).length
  const pct = Math.round((completed / plan.items.length) * 100)

  const props = { day, plan, log, targets, updateLog, pct, completed, state }

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="eyebrow">AthleteOS</p>
          <h1>{day}</h1>
        </div>
        <div className="score">{pct}%</div>
      </header>
      <main>
        {tab === 'Home' && <HomePage {...props} />}
        {tab === 'Workout' && <WorkoutPage {...props} />}
        {tab === 'Nutrition' && <NutritionPage {...props} />}
        {tab === 'Throwing' && <ThrowingPage {...props} />}
        {tab === 'Recovery' && <RecoveryPage {...props} />}
        {tab === 'Plan' && <PlanPage day={day} weeklyPlan={weeklyPlan} updateWeekPlan={updateWeekPlan} />}
        {tab === 'Review' && <ReviewPage state={state} />}
      </main>
      <nav className="nav">
        {[
          ['Home', Home],
          ['Workout', Dumbbell],
          ['Nutrition', Utensils],
          ['Throwing', Zap],
          ['Recovery', HeartPulse],
          ['Plan', Activity],
          ['Review', BarChart3]
        ].map(([name, Icon]) => (
          <button key={name} onClick={() => setTab(name as TabName)} className={tab === name ? 'active' : ''}>
            <Icon size={20} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

interface BasePageProps {
  day: string
  plan: PlanDay
  log: DailyLog
  targets: MacroTargets
  updateLog: (patch: Partial<DailyLog>) => void
  pct: number
  completed: number
  state?: AppState
}

function HomePage({ day, plan, log, targets, updateLog, pct, completed }: BasePageProps) {
  return (
    <div className="stack">
      <Card className="hero">
        <p className="eyebrow">Today's Focus</p>
        <h2>{plan.focus}</h2>
        <span className="pill">{plan.type}</span>
        <ProgressBar value={pct} />
        <p>{completed}/{plan.items.length} tasks complete</p>
      </Card>
      <Card>
        <div className="section-title">
          <h3>Daily Checklist</h3>
          <span className="subtle">{day}</span>
        </div>
        {plan.items.slice(0, 6).map((item) => (
          <ChecklistRow
            key={item}
            item={item}
            checked={!!log.checks?.[item]}
            onToggle={() => updateLog({ checks: { ...log.checks, [item]: !log.checks?.[item] } })}
          />
        ))}
      </Card>
      <MacroMini log={log} targets={targets} updateLog={updateLog} />
      <RecoveryMini log={log} updateLog={updateLog} />
    </div>
  )
}

function WorkoutPage({ plan, log, updateLog, pct, state }: BasePageProps) {
  const workoutSession = log.workoutSession || createWorkoutSession(plan.items, state || {})

  useEffect(() => {
    if (!log.workoutSession && plan.items.length) {
      updateLog({ workoutSession })
    }
  }, [log.workoutSession, plan.items, updateLog, workoutSession])

  useEffect(() => {
    if (workoutSession.phase !== 'rest' || workoutSession.restSecondsLeft <= 0) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      const nextSession = {
        ...workoutSession,
        restSecondsLeft: workoutSession.restSecondsLeft - 1,
        phase: workoutSession.restSecondsLeft - 1 <= 0 ? 'active' : 'rest'
      }

      updateLog({ workoutSession: nextSession })
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [updateLog, workoutSession])

  const activeExercise = workoutSession.exercises[workoutSession.activeExerciseIndex]
  const progress = getWorkoutProgress(workoutSession)

  const updateWorkoutSession = (updater: (session: WorkoutSessionState) => WorkoutSessionState) => {
    const nextSession = updater(workoutSession)
    updateLog({ workoutSession: nextSession })
  }

  const handleCompleteSet = () => {
    if (!activeExercise || workoutSession.phase !== 'active') {
      return
    }

    updateWorkoutSession((session) => {
      const nextExercises = session.exercises.map((exercise, index) => {
        if (index !== session.activeExerciseIndex) {
          return exercise
        }

        const nextCompletedSets = exercise.completedSets + 1
        return {
          ...exercise,
          completedSets: nextCompletedSets,
          completed: nextCompletedSets >= exercise.sets
        }
      })

      return {
        ...session,
        exercises: nextExercises,
        phase: 'rest',
        restSecondsLeft: 45
      }
    })
  }

  const handleNextExercise = () => {
    if (!activeExercise || !activeExercise.completed) {
      return
    }

    updateWorkoutSession((session) => {
      const nextIndex = session.activeExerciseIndex + 1
      if (nextIndex >= session.exercises.length) {
        return {
          ...session,
          phase: 'finished',
          completedAt: new Date().toISOString()
        }
      }

      return {
        ...session,
        activeExerciseIndex: nextIndex,
        phase: 'active',
        restSecondsLeft: 0
      }
    })
  }

  const updateExerciseField = (field: 'targetWeight' | 'notes' | 'reps', value: string) => {
    if (!activeExercise) {
      return
    }

    updateWorkoutSession((session) => ({
      ...session,
      exercises: session.exercises.map((exercise, index) => (index === session.activeExerciseIndex ? { ...exercise, [field]: value } : exercise))
    }))
  }

  const updateExerciseSets = (value: string) => {
    if (!activeExercise) {
      return
    }

    const parsedSets = Number.parseInt(value, 10)
    const safeSets = Number.isNaN(parsedSets) || parsedSets < 1 ? 1 : parsedSets

    updateWorkoutSession((session) => ({
      ...session,
      exercises: session.exercises.map((exercise, index) => (index === session.activeExerciseIndex ? { ...exercise, sets: safeSets } : exercise))
    }))
  }

  if (workoutSession.phase === 'finished') {
    return (
      <div className="stack">
        <Card>
          <div className="row">
            <div>
              <p className="eyebrow">Coach Mode</p>
              <h2>{plan.focus}</h2>
            </div>
            <Timer />
          </div>
          <ProgressBar value={100} />
        </Card>
        <WorkoutFinishScreen
          durationMinutes="Add time at the end"
          completedExercises={workoutSession.exercises.filter((exercise) => exercise.completed).length}
          completedSets={workoutSession.exercises.reduce((total, exercise) => total + exercise.completedSets, 0)}
          onRestart={() => updateLog({ workoutSession: createWorkoutSession(plan.items, state || {}) })}
        />
      </div>
    )
  }

  return (
    <div className="stack">
      <Card>
        <div className="row">
          <div>
            <p className="eyebrow">Coach Mode</p>
            <h2>{plan.focus}</h2>
          </div>
          <Timer />
        </div>
        <div className="workout-meta-row">
          <div>
            <span className="subtle">Progress</span>
            <strong>{progress}%</strong>
          </div>
          <button className="coach-secondary" onClick={() => updateLog({ workoutSession: createWorkoutSession(plan.items, state || {}) })}>
            Reset exercises
          </button>
        </div>
        <ProgressBar value={progress} />
      </Card>

      {activeExercise ? (
        <CoachExerciseCard
          exerciseName={activeExercise.name}
          completeSets={activeExercise.completedSets}
          targetSets={activeExercise.sets}
          targetReps={activeExercise.reps}
          previousValue={activeExercise.previousValue}
          targetWeight={activeExercise.targetWeight}
          notes={activeExercise.notes}
          isComplete={activeExercise.completed}
          onTargetWeightChange={(value) => updateExerciseField('targetWeight', value)}
          onSetsChange={(value) => updateExerciseSets(value)}
          onRepsChange={(value) => updateExerciseField('reps', value)}
          onNotesChange={(value) => updateExerciseField('notes', value)}
          onCompleteSet={handleCompleteSet}
          onNextExercise={handleNextExercise}
          restSecondsLeft={workoutSession.restSecondsLeft}
          status={workoutSession.phase}
        />
      ) : null}

      <Card>
        <h3>Workout plan</h3>
        <ul className="coach-list">
          {workoutSession.exercises.map((exercise, index) => (
            <li key={exercise.name} className={index === workoutSession.activeExerciseIndex ? 'active' : ''}>
              <span>{exercise.name}</span>
              <small>{exercise.completed ? 'Done' : `${exercise.completedSets}/${exercise.sets} sets`}</small>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

interface WorkoutRowProps {
  item: string
  log: DailyLog
  updateLog: (patch: Partial<DailyLog>) => void
}

function WorkoutRow({ item, log, updateLog }: WorkoutRowProps) {
  const checked = !!log.checks?.[item]
  const weightValue = log.weights?.[item] || ''

  return (
    <div className="workout-item">
      <button className="checkrow workout-check" onClick={() => updateLog({ checks: { ...log.checks, [item]: !checked } })}>
        <CheckCircle2 className={checked ? 'done' : ''} />
        <span>{item}</span>
      </button>
      <label className="weight-input">
        <span>Weight</span>
        <input
          value={weightValue}
          onChange={(e) => updateLog({ weights: { ...(log.weights || {}), [item]: e.target.value } })}
          placeholder="135"
        />
      </label>
    </div>
  )
}

interface LiftRowProps {
  lift: LiftEntry
  index: number
  log: DailyLog
  updateLog: (patch: Partial<DailyLog>) => void
}

function LiftRow({ lift, index, log, updateLog }: LiftRowProps) {
  const updateLift = (patch: Partial<LiftEntry>) => {
    updateLog({
      lifts: (log.lifts || []).map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    })
  }

  const removeLift = () => {
    updateLog({ lifts: (log.lifts || []).filter((_, itemIndex) => itemIndex !== index) })
  }

  return (
    <div className="lift-row">
      <div className="lift-fields">
        <label className="field-label">
          <span>Exercise</span>
          <input value={lift.exercise || ''} onChange={(e) => updateLift({ exercise: e.target.value })} placeholder="Exercise" />
        </label>
        <label className="field-label">
          <span>Sets</span>
          <input value={lift.sets || ''} onChange={(e) => updateLift({ sets: e.target.value })} placeholder="3" />
        </label>
        <label className="field-label">
          <span>Reps</span>
          <input value={lift.reps || ''} onChange={(e) => updateLift({ reps: e.target.value })} placeholder="5" />
        </label>
        <label className="field-label">
          <span>Weight</span>
          <input value={lift.weight || ''} onChange={(e) => updateLift({ weight: e.target.value })} placeholder="135" />
        </label>
      </div>
      <textarea value={lift.notes || ''} onChange={(e) => updateLift({ notes: e.target.value })} placeholder="How it felt / notes" />
      <button className="text-button" onClick={removeLift}>Remove</button>
    </div>
  )
}

interface MacroMiniProps {
  log: DailyLog
  targets: MacroTargets
  updateLog: (patch: Partial<DailyLog>) => void
}

function MacroMini({ log, targets, updateLog }: MacroMiniProps) {
  return (
    <Card>
      <h3>Nutrition</h3>
      <Macro name="Protein" unit="g" value={log.macros?.protein || 0} target={targets.protein} add={25} log={log} updateLog={updateLog} />
      <Macro name="Carbs" unit="g" value={log.macros?.carbs || 0} target={targets.carbs} add={50} log={log} updateLog={updateLog} />
      <Macro name="Fat" unit="g" value={log.macros?.fat || 0} target={targets.fat} add={15} log={log} updateLog={updateLog} />
    </Card>
  )
}

function NutritionPage(props: BasePageProps) {
  return (
    <div className="stack">
      <MacroMini {...props} />
      <Card>
        <h3>Quick Add</h3>
        <div className="grid">
          <Quick label="Shake" p={25} c={5} f={2} {...props} />
          <Quick label="Chicken + Rice" p={45} c={80} f={12} {...props} />
          <Quick label="Greek Yogurt" p={25} c={15} f={0} {...props} />
          <Quick label="Snack" p={10} c={35} f={8} {...props} />
        </div>
      </Card>
    </div>
  )
}

interface MacroProps {
  name: string
  unit: string
  value: number
  target: number
  add: number
  log: DailyLog
  updateLog: (patch: Partial<DailyLog>) => void
}

function Macro({ name, unit, value, target, add, log, updateLog }: MacroProps) {
  const key = name.toLowerCase() as keyof NonNullable<DailyLog['macros']>

  return (
    <div className="macro">
      <div className="row">
        <b>{name}</b>
        <span>{value}/{target}{unit}</span>
      </div>
      <ProgressBar value={(value / target) * 100} />
      <div className="actions">
        <button onClick={() => updateLog({ macros: { ...log.macros, [key]: value + add } })}>
          <Plus size={16} /> +{add}{unit}
        </button>
        <button onClick={() => updateLog({ macros: { ...log.macros, [key]: 0 } })}>
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  )
}

interface QuickProps {
  label: string
  p: number
  c: number
  f: number
  log: DailyLog
  updateLog: (patch: Partial<DailyLog>) => void
}

function Quick({ label, p, c, f, log, updateLog }: QuickProps) {
  return (
    <button
      className="quick"
      onClick={() => updateLog({ macros: { ...log.macros, protein: (log.macros?.protein || 0) + p, carbs: (log.macros?.carbs || 0) + c, fat: (log.macros?.fat || 0) + f } })}
    >
      <Apple />
      <b>{label}</b>
      <span>{p}P / {c}C / {f}F</span>
    </button>
  )
}

function ThrowingPage({ log, updateLog }: Pick<BasePageProps, 'log' | 'updateLog'>) {
  const items = ['Catch', 'Long Toss', 'Pull Downs', 'Ground Balls', 'Double Plays', 'Backhands', 'Short Hops', 'Arm Care']

  return (
    <div className="stack">
      <Card>
        <h2>Throwing</h2>
        {items.map((item) => (
          <ChecklistRow key={item} item={`Throwing: ${item}`} checked={!!log.checks?.[`Throwing: ${item}`]} onToggle={() => updateLog({ checks: { ...log.checks, [`Throwing: ${item}`]: !log.checks?.[`Throwing: ${item}`] } })} />
        ))}
      </Card>
      <Notes log={log} updateLog={updateLog} />
    </div>
  )
}

interface RecoveryMiniProps {
  log: DailyLog
  updateLog: (patch: Partial<DailyLog>) => void
}

function RecoveryMini({ log, updateLog }: RecoveryMiniProps) {
  return (
    <Card>
      <h3>Recovery</h3>
      <div className="inputs">
        <label>
          Sleep
          <input value={log.recovery?.sleep || ''} onChange={(e) => updateLog({ recovery: { ...log.recovery, sleep: e.target.value } })} placeholder="7.8" />
        </label>
        <label>
          Weight
          <input value={log.recovery?.weight || ''} onChange={(e) => updateLog({ recovery: { ...log.recovery, weight: e.target.value } })} placeholder="188.2" />
        </label>
        <label>
          WHOOP
          <input value={log.recovery?.whoop || ''} onChange={(e) => updateLog({ recovery: { ...log.recovery, whoop: e.target.value } })} placeholder="82" />
        </label>
      </div>
    </Card>
  )
}

function RecoveryPage(props: BasePageProps) {
  return (
    <div className="stack">
      <RecoveryMini {...props} />
      <Card>
        <h3>Soreness</h3>
        <input type="range" min="1" max="10" value={props.log.recovery?.soreness || 3} onChange={(e) => props.updateLog({ recovery: { ...props.log.recovery, soreness: Number(e.target.value) } })} />
        <p>{props.log.recovery?.soreness || 3}/10</p>
      </Card>
      <Notes {...props} />
    </div>
  )
}

interface NotesProps {
  log: DailyLog
  updateLog: (patch: Partial<DailyLog>) => void
}

function Notes({ log, updateLog }: NotesProps) {
  return (
    <Card>
      <h3>Notes</h3>
      <textarea value={log.notes || ''} onChange={(e) => updateLog({ notes: e.target.value })} placeholder="How did you feel today?" />
    </Card>
  )
}

interface PlanPageProps {
  day: string
  weeklyPlan: WeeklyPlanMap
  updateWeekPlan: (dayName: string, value: string) => void
}

function PlanPage({ day, weeklyPlan, updateWeekPlan }: PlanPageProps) {
  return (
    <div className="stack">
      <Card>
        <div className="row">
          <div>
            <p className="eyebrow">Weekly Planner</p>
            <h2>Shape next week</h2>
          </div>
          <Activity />
        </div>
        <p className="muted">Edit the lifts for each day and use this as your offseason planning board.</p>
      </Card>
      <Card>
        <div className="plan-grid">
          {DAYS.map((dayName) => (
            <label key={dayName} className="plan-day">
              <span>{dayName}</span>
              <textarea
                value={weeklyPlan[dayName] || ''}
                onChange={(e) => updateWeekPlan(dayName, e.target.value)}
                placeholder={`Add lifts for ${dayName}`}
              />
            </label>
          ))}
        </div>
      </Card>
    </div>
  )
}

interface ReviewPageProps {
  state: AppState
}

function ReviewPage({ state }: ReviewPageProps) {
  const entries = Object.entries(state).filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key)).sort().slice(-7)
  const summary = useMemo(() => {
    if (entries.length === 0) return null

    return entries.map(([date, log]) => {
      const dayName = DAYS[new Date(`${date}T00:00:00`).getDay()]
      const plan = weekPlan[dayName]
      const total = plan?.items?.length || 1
      const completed = Object.values(log?.checks || {}).filter(Boolean).length
      const pct = Math.round((completed / total) * 100)

      return {
        date,
        dayName,
        pct,
        lifts: Array.isArray(log?.lifts) ? log.lifts : [],
        protein: log?.macros?.protein || 0,
        soreness: Number(log?.recovery?.soreness || 0)
      }
    })
  }, [entries])

  if (!summary) {
    return (
      <div className="stack">
        <Card>
          <h2>Weekly Review</h2>
          <p className="muted">Log a few days to see what to keep, change, or progress.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="stack">
      <Card>
        <h2>Weekly Review</h2>
        <p className="muted">Use this section to decide what to adjust before the next week starts.</p>
      </Card>
      {summary.map(({ date, dayName, pct, lifts, protein, soreness }) => (
        <Card key={date}>
          <div className="row">
            <div>
              <b>{date}</b>
              <p className="muted">{dayName}</p>
            </div>
            <span>{pct}% complete</span>
          </div>
          {lifts.length === 0 ? (
            <p className="muted">No lifts logged.</p>
          ) : (
            <ul className="review-list">
              {lifts.map((lift, index) => (
                <li key={`${date}-${index}`}>
                  <b>{lift.exercise || 'Untitled lift'}</b>
                  <span>{lift.sets || 0}x{lift.reps || 0} @ {lift.weight || '--'}</span>
                  <p>{lift.notes || 'No notes'}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="muted">Protein: {protein}g · Soreness: {soreness}/10</p>
        </Card>
      ))}
    </div>
  )
}

export default App
