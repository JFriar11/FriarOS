import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
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
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from './components/ui/Card'
import { ProgressBar } from './components/ui/ProgressBar'
import { ChecklistRow } from './components/ChecklistRow'
import { AuthPanel } from './components/AuthPanel'
import { usePersistentState } from './hooks/usePersistentState'
import { weekPlan } from './data/program'
import { DAYS, getTodayId, getTodayName, normalizeLog } from './utils/plan'
import type { AppState, DailyLog, LiftEntry, MacroTargets, ProgramDay, ProgramTemplate, WeeklyPlanMap, WorkoutSessionState } from './types'
import { CoachExerciseCard } from './components/workout/CoachExerciseCard'
import { WorkoutFinishScreen } from './components/workout/WorkoutFinishScreen'
import { defaultProgramTemplate, getProgramSnapshot, PROGRAM_WEEKS } from './data/programEngine'
import { isSupabaseConfigured } from './lib/supabase'
import { getAuthSessionState, signOut, syncAppState } from './lib/supabaseData'

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

type TabName = 'Home' | 'Workout' | 'Nutrition' | 'Throwing' | 'Recovery' | 'Plan' | 'Progress' | 'History'

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
    exercises: planItems.map((item, index) => ({
      name: item,
      sets: 3,
      reps: '5',
      previousValue: getPreviousValue(item, state),
      targetWeight: '',
      notes: '',
      completedSets: 0,
      completed: false,
      templateIndex: index
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [state, setState] = usePersistentState<AppState>({
    programTemplate: defaultProgramTemplate,
    activeWeek: PROGRAM_WEEKS[0]
  })

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      if (!isSupabaseConfigured()) {
        return
      }

      const sessionState = await getAuthSessionState()
      if (!cancelled) {
        setIsAuthenticated(sessionState.isAuthenticated)
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [])
  const dateId = getTodayId()
  const day = getTodayName()
  const programTemplate = state.programTemplate || defaultProgramTemplate
  const activeWeekName = state.activeWeek || PROGRAM_WEEKS[0]
  const weeklyPlan = state.weekPlan || planDefaults
  const programSnapshot = getProgramSnapshot(state, programTemplate, new Date(), activeWeekName)
  const programDay = programSnapshot.activeDay || defaultProgramTemplate.weeks[0].days[0]
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

  const completed = programDay.exercises.filter((item) => log.checks?.[item]).length
  const pct = programDay.exercises.length ? Math.round((completed / programDay.exercises.length) * 100) : 0

  const props = { day, programDay, log, updateLog, pct, completed, state, programTemplate, activeWeekName, setState }

  const handleSync = async () => {
    if (!isSupabaseConfigured() || !isAuthenticated) {
      setSyncMessage('Sign in first to sync to the cloud')
      return
    }

    setIsSyncing(true)
    setSyncMessage('')

    try {
      await syncAppState(state)
      setSyncMessage('Synced to cloud')
    } catch {
      setSyncMessage('Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsAuthenticated(false)
      setSyncMessage('Signed out locally')
    } catch {
      setSyncMessage('Could not sign out')
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="eyebrow">AthleteOS</p>
          <h1>{day}</h1>
        </div>
        <div className="top-meta">
          {isSupabaseConfigured() ? <div className="sync-pill">{isAuthenticated ? 'Cloud ready' : 'Local + cloud'}</div> : null}
          <div className="score">{pct}%</div>
        </div>
      </header>
      {isSupabaseConfigured() ? (
        <div className="sync-bar">
          <div className="sync-bar__copy">
            <strong>{isAuthenticated ? 'Signed in' : 'Local mode'}</strong>
            <span>{syncMessage || (isAuthenticated ? 'Your data can sync to the cloud' : 'Sign in to back up your data')}</span>
          </div>
          <div className="sync-actions">
            <button className="secondary-action" onClick={handleSync} disabled={isSyncing || !isAuthenticated}>
              {isSyncing ? 'Syncing…' : 'Sync now'}
            </button>
            {isAuthenticated ? (
              <button className="secondary-action" onClick={handleSignOut}>Sign out</button>
            ) : null}
          </div>
        </div>
      ) : null}
      <main>
        {tab === 'Home' && <HomePage {...props} isAuthenticated={isAuthenticated} onAuthenticated={() => setIsAuthenticated(true)} />}
        {tab === 'Workout' && <WorkoutPage {...props} />}
        {tab === 'Nutrition' && <NutritionPage {...props} />}
        {tab === 'Throwing' && <ThrowingPage {...props} />}
        {tab === 'Recovery' && <RecoveryPage {...props} />}
        {tab === 'Plan' && <PlanPage day={day} weeklyPlan={weeklyPlan} updateWeekPlan={updateWeekPlan} programTemplate={programTemplate} activeWeekName={activeWeekName} setState={setState} />}
        {tab === 'Progress' && <ProgressPage state={state} />}
        {tab === 'History' && <HistoryPage state={state} />}
      </main>
      <nav className="nav">
        {[
          ['Home', Home],
          ['Workout', Dumbbell],
          ['Nutrition', Utensils],
          ['Throwing', Zap],
          ['Recovery', HeartPulse],
          ['Plan', Activity],
          ['Progress', BarChart3],
          ['History', BarChart3]
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
  programDay: ProgramDay
  log: DailyLog
  updateLog: (patch: Partial<DailyLog>) => void
  pct: number
  completed: number
  state?: AppState
  programTemplate?: ProgramTemplate
  activeWeekName?: string
  setState?: Dispatch<SetStateAction<AppState>>
}

function HomePage({ day, programDay, log, updateLog, pct, completed, isAuthenticated, onAuthenticated }: BasePageProps & { isAuthenticated?: boolean; onAuthenticated?: () => void }) {
  const workoutCompleted = log.workoutSession?.phase === 'finished'
  const waterGoal = 4
  const waterIntake = Number(log.recovery?.whoop || 0) > 0 ? Math.min(waterGoal, Math.round(Number(log.recovery.whoop) / 25)) : 0
  const sleepHours = Number(log.recovery?.sleep || 0)

  return (
    <div className="stack dashboard-stack">
      {isSupabaseConfigured() && !isAuthenticated ? (
        <AuthPanel onAuthenticated={onAuthenticated} />
      ) : null}
      <Card className="hero dashboard-hero">
        <div className="dashboard-hero__top">
          <div>
            <p className="eyebrow">Good morning</p>
            <h2>What do I need to do today?</h2>
          </div>
          <div className="dashboard-hero__badge">{day}</div>
        </div>
        <p className="dashboard-hero__copy">{programDay.focus} · {programDay.type}</p>
        <ProgressBar value={pct} />
        <div className="dashboard-hero__stats">
          <div>
            <span>Workout</span>
            <strong>{completed}/{programDay.exercises.length}</strong>
          </div>
          <div>
            <span>Duration</span>
            <strong>{programDay.durationMinutes} min</strong>
          </div>
        </div>
        <button className="coach-primary dashboard-cta" onClick={() => updateLog({ workoutSession: createWorkoutSession(programDay.exercises, {}) })}>Quick Start Workout</button>
      </Card>

      <Card>
        <div className="section-title">
          <h3>Recovery</h3>
          <span className="subtle">{programDay.difficulty}</span>
        </div>
        <div className="dashboard-grid">
          <div className="dashboard-metric">
            <span>Water</span>
            <strong>{waterIntake}/{waterGoal} L</strong>
          </div>
          <div className="dashboard-metric">
            <span>Sleep</span>
            <strong>{sleepHours ? `${sleepHours}h` : '—'}</strong>
          </div>
          <div className="dashboard-metric">
            <span>Workout</span>
            <strong>{workoutCompleted ? 'Done' : 'Pending'}</strong>
          </div>
          <div className="dashboard-metric">
            <span>Throwing</span>
            <strong>{Object.keys(log.checks || {}).some((key) => key.startsWith('Throwing:') && log.checks?.[key]) ? 'Done' : 'Pending'}</strong>
          </div>
        </div>
      </Card>

      <Card>
        <div className="section-title">
          <h3>Today's Workout</h3>
          <span className="subtle">{programDay.focus}</span>
        </div>
        <ul className="coach-list">
          {programDay.exercises.slice(0, 5).map((item) => (
            <li key={item}>
              <span>{item}</span>
              <small>{log.checks?.[item] ? 'Complete' : 'Next'}</small>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="section-title">
          <h3>Today's Throwing</h3>
          <span className="subtle">{programDay.throwing.items.length} items</span>
        </div>
        <ul className="coach-list">
          {programDay.throwing.items.slice(0, 4).map((item) => (
            <li key={item}>
              <span>{item}</span>
              <small>{log.checks?.[`Throwing: ${item}`] ? 'Done' : 'Pending'}</small>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="section-title">
          <h3>Nutrition Progress</h3>
          <span className="subtle">{programDay.nutrition.protein}g protein</span>
        </div>
        <MacroMini log={log} targets={programDay.nutrition} updateLog={updateLog} />
      </Card>

      <Card>
        <div className="section-title">
          <h3>Workout Progress</h3>
          <span className="subtle">{pct}%</span>
        </div>
        <ProgressBar value={pct} />
      </Card>
    </div>
  )
}

function WorkoutPage({ programDay, log, updateLog, pct, state, programTemplate, activeWeekName }: BasePageProps) {
  const snapshot = programTemplate && activeWeekName ? getProgramSnapshot(state || {}, programTemplate, new Date(), activeWeekName) : null
  const templateExercises = snapshot?.activeDay?.exercises || programDay.exercises
  const workoutSession = log.workoutSession || createWorkoutSession(templateExercises, state || {})

  useEffect(() => {
    if (!log.workoutSession && programDay.exercises.length) {
      updateLog({ workoutSession: { ...workoutSession, exercises: workoutSession.exercises.map((exercise, index) => ({ ...exercise, name: templateExercises[index] || exercise.name })) } })
    }
  }, [log.workoutSession, programDay.exercises, updateLog, workoutSession, templateExercises])

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
              <h2>{programDay.focus}</h2>
            </div>
            <Timer />
          </div>
          <ProgressBar value={100} />
        </Card>
        <WorkoutFinishScreen
          durationMinutes="Add time at the end"
          completedExercises={workoutSession.exercises.filter((exercise) => exercise.completed).length}
          completedSets={workoutSession.exercises.reduce((total, exercise) => total + exercise.completedSets, 0)}
          onRestart={() => updateLog({ workoutSession: createWorkoutSession(templateExercises, state || {}) })}
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
            <h2>{programDay.focus}</h2>
          </div>
          <Timer />
        </div>
        <div className="workout-meta-row">
          <div>
            <span className="subtle">Progress</span>
            <strong>{progress}%</strong>
          </div>
          <button className="coach-secondary" onClick={() => updateLog({ workoutSession: createWorkoutSession(templateExercises, state || {}) })}>
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
        <div className="section-title">
          <h3>Warmup</h3>
          <span className="subtle">{programDay.difficulty}</span>
        </div>
        <ul className="coach-list">
          {programDay.warmup.map((item) => <li key={item}><span>{item}</span><small>Prep</small></li>)}
        </ul>
      </Card>

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
      <MacroMini log={props.log} targets={props.programDay.nutrition} updateLog={props.updateLog} />
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

function ThrowingPage({ programDay, log, updateLog }: Pick<BasePageProps, 'programDay' | 'log' | 'updateLog'>) {
  return (
    <div className="stack">
      <Card>
        <div className="section-title">
          <h2>Throwing</h2>
          <span className="subtle">{programDay.focus}</span>
        </div>
        {programDay.throwing.items.map((item) => (
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
      <Card>
        <div className="section-title">
          <h3>Recovery checklist</h3>
          <span className="subtle">{props.programDay.focus}</span>
        </div>
        <ul className="coach-list">
          {props.programDay.recovery.map((item) => <li key={item.label}><span>{item.label}</span><small>Daily</small></li>)}
        </ul>
      </Card>
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

function PlanPage({ day, weeklyPlan, updateWeekPlan, programTemplate, activeWeekName, setState }: BasePageProps & PlanPageProps) {
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
        <div className="section-title">
          <h3>Program settings</h3>
          <span className="subtle">{programTemplate?.phase || 'Summer Phase 2'}</span>
        </div>
        <label className="coach-field">
          <span>Active week</span>
          <select value={activeWeekName || PROGRAM_WEEKS[0]} onChange={(event) => setState?.((prev) => ({ ...prev, activeWeek: event.target.value }))}>
            {PROGRAM_WEEKS.map((week) => <option key={week} value={week}>{week}</option>)}
          </select>
        </label>
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

function getWorkoutCompletionPercent(log: DailyLog | undefined) {
  const normalized = normalizeLog(log)
  if (normalized.workoutSession?.phase === 'finished') {
    return 100
  }

  const exercises = normalized.workoutSession?.exercises || []
  if (!exercises.length) {
    return 0
  }

  const completedSets = exercises.reduce((total, exercise) => total + exercise.completedSets, 0)
  const plannedSets = exercises.reduce((total, exercise) => total + Math.max(exercise.sets, 1), 0)
  return Math.round((completedSets / Math.max(plannedSets, 1)) * 100)
}

function getSprintCompletionPercent(log: DailyLog | undefined) {
  const normalized = normalizeLog(log)
  const keys = Object.keys(normalized.checks || {})
  const sprintKeys = keys.filter((key) => /sprint|speed|interval|pace|fly|accel|plyo|skip|ladder|bound|velocity/i.test(key))

  if (!sprintKeys.length) {
    return 0
  }

  const completed = sprintKeys.filter((key) => normalized.checks?.[key]).length
  return Math.round((completed / sprintKeys.length) * 100)
}

function getThrowingVolume(log: DailyLog | undefined) {
  const normalized = normalizeLog(log)
  const keys = Object.keys(normalized.checks || {})
  return keys.filter((key) => key.startsWith('Throwing:') && normalized.checks?.[key]).length
}

function getStrengthProgression(log: DailyLog | undefined) {
  const normalized = normalizeLog(log)
  const weights = [] as number[]

  normalized.lifts?.forEach((lift) => {
    const parsed = Number.parseFloat(lift.weight || '')
    if (!Number.isNaN(parsed)) {
      weights.push(parsed)
    }
  })

  normalized.workoutSession?.exercises?.forEach((exercise) => {
    const parsed = Number.parseFloat(exercise.targetWeight || '')
    if (!Number.isNaN(parsed)) {
      weights.push(parsed)
    }
  })

  return weights.length ? Math.max(...weights) : 0
}

interface ProgressPageProps {
  state: AppState
}

function ProgressPage({ state }: ProgressPageProps) {
  const [range, setRange] = useState<'week' | 'month'>('week')

  const chartData = useMemo(() => {
    const entries = Object.entries(state)
      .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key))
      .sort(([a], [b]) => a.localeCompare(b))

    const maxDays = range === 'week' ? 7 : 30
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - maxDays + 1)

    const points = [] as Array<{ date: string; label: string; weight: number | null; protein: number; sleep: number; workout: number; sprint: number; throwing: number; strength: number }>

    for (let index = 0; index < maxDays; index += 1) {
      const cursor = new Date(start)
      cursor.setDate(start.getDate() + index)
      const dateKey = cursor.toISOString().slice(0, 10)
      const entry = entries.find(([key]) => key === dateKey)
      const log = entry?.[1]
      const normalized = normalizeLog(log)

      points.push({
        date: dateKey,
        label: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: normalized.recovery?.weight ? Number.parseFloat(normalized.recovery.weight) : null,
        protein: normalized.macros?.protein || 0,
        sleep: normalized.recovery?.sleep ? Number.parseFloat(normalized.recovery.sleep) : 0,
        workout: getWorkoutCompletionPercent(log),
        sprint: getSprintCompletionPercent(log),
        throwing: getThrowingVolume(log),
        strength: getStrengthProgression(log)
      })
    }

    return points
  }, [range, state])

  const metricCards = [
    {
      title: 'Body weight',
      description: 'Track daily weight trend',
      dataKey: 'weight',
      unit: 'lb',
      chart: 'line' as const
    },
    {
      title: 'Protein',
      description: 'Daily protein intake',
      dataKey: 'protein',
      unit: 'g',
      chart: 'area' as const
    },
    {
      title: 'Sleep',
      description: 'Hours of sleep',
      dataKey: 'sleep',
      unit: 'h',
      chart: 'line' as const
    },
    {
      title: 'Workout completion %',
      description: 'Coach-mode progress',
      dataKey: 'workout',
      unit: '%',
      chart: 'bar' as const
    },
    {
      title: 'Sprint completion %',
      description: 'Sprint-focused work',
      dataKey: 'sprint',
      unit: '%',
      chart: 'bar' as const
    },
    {
      title: 'Throwing volume',
      description: 'Completed throwing items',
      dataKey: 'throwing',
      unit: 'items',
      chart: 'bar' as const
    },
    {
      title: 'Strength progression',
      description: 'Best logged weight',
      dataKey: 'strength',
      unit: 'lb',
      chart: 'line' as const
    }
  ]

  return (
    <div className="stack">
      <Card>
        <div className="row">
          <div>
            <p className="eyebrow">Progress</p>
            <h2>Training trends</h2>
          </div>
          <div className="history-month-nav">
            <button className={`text-button ${range === 'week' ? 'active' : ''}`} onClick={() => setRange('week')}>Week</button>
            <button className={`text-button ${range === 'month' ? 'active' : ''}`} onClick={() => setRange('month')}>Month</button>
          </div>
        </div>
        <p className="muted">Review the last {range === 'week' ? '7 days' : '30 days'} of training data in a compact mobile view.</p>
      </Card>

      {metricCards.map((metric) => (
        <Card key={metric.title}>
          <div className="section-title">
            <div>
              <h3>{metric.title}</h3>
              <p className="muted">{metric.description}</p>
            </div>
          </div>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={180}>
              {metric.chart === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
                  <Tooltip />
                  <Bar dataKey={metric.dataKey} fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : metric.chart === 'area' ? (
                <AreaChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip />
                  <Area type="monotone" dataKey={metric.dataKey} stroke="#22c55e" fill="rgba(34,197,94,0.22)" />
                </AreaChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip />
                  <Line type="monotone" dataKey={metric.dataKey} stroke="#7dd3fc" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>
      ))}
    </div>
  )
}

interface HistoryPageProps {
  state: AppState
}

function getHistoryStatus(log: DailyLog | undefined) {
  const normalized = normalizeLog(log)
  const workoutCompleted = normalized.workoutSession?.phase === 'finished'
  const nutritionComplete = Boolean(normalized.macros?.protein || normalized.macros?.carbs || normalized.macros?.fat || normalized.macros?.water)
  const recoveryComplete = Boolean(normalized.recovery?.sleep || normalized.recovery?.weight || normalized.recovery?.whoop || (normalized.recovery?.soreness && normalized.recovery.soreness !== 3))
  const throwingComplete = Object.keys(normalized.checks || {}).some((key) => key.startsWith('Throwing:') && normalized.checks?.[key])
  const notesComplete = Boolean(normalized.notes?.trim())

  const completedCount = [workoutCompleted, nutritionComplete, recoveryComplete, throwingComplete, notesComplete].filter(Boolean).length

  if (workoutCompleted && completedCount >= 5) {
    return { label: 'Complete', tone: 'complete', completedCount }
  }

  if (workoutCompleted && completedCount >= 2) {
    return { label: 'Partial', tone: 'partial', completedCount }
  }

  if (workoutCompleted) {
    return { label: 'Workout only', tone: 'partial', completedCount }
  }

  if (completedCount > 0) {
    return { label: 'Logged', tone: 'planned', completedCount }
  }

  return { label: 'Open', tone: 'empty', completedCount }
}

function getWorkoutDuration(log: DailyLog | undefined) {
  const startedAt = log?.workoutSession?.startedAt
  const completedAt = log?.workoutSession?.completedAt

  if (!startedAt) {
    return '—'
  }

  if (!completedAt) {
    return 'In progress'
  }

  const durationMinutes = Math.max(0, Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000))
  return `${durationMinutes} min`
}

function HistoryPage({ state }: HistoryPageProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [displayMonth, setDisplayMonth] = useState(() => new Date())

  const entries = useMemo(() => Object.entries(state).filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key)).sort(), [state])

  useEffect(() => {
    if (!selectedDate && entries.length > 0) {
      setSelectedDate(entries[entries.length - 1][0])
    }
  }, [entries, selectedDate])

  const monthLabel = displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const year = displayMonth.getFullYear()
  const month = displayMonth.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDayOfMonth.getDay()

  const calendarDays = useMemo(() => {
    const cells = [] as Array<{ dateString: string | null; dayNumber: number | null; status: ReturnType<typeof getHistoryStatus>; log: DailyLog | undefined }>

    for (let index = 0; index < startOffset; index += 1) {
      cells.push({ dateString: null, dayNumber: null, status: { label: 'Open', tone: 'empty', completedCount: 0 }, log: undefined })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateString = new Date(year, month, day).toISOString().slice(0, 10)
      const log = state[dateString]
      cells.push({ dateString, dayNumber: day, status: getHistoryStatus(log), log })
    }

    return cells
  }, [daysInMonth, month, startOffset, state, year])

  const selectedLog = selectedDate ? normalizeLog(state[selectedDate]) : null
  const selectedStatus = selectedDate ? getHistoryStatus(state[selectedDate]) : null
  const selectedDayName = selectedDate ? DAYS[new Date(`${selectedDate}T00:00:00`).getDay()] : ''

  return (
    <div className="stack">
      <Card>
        <div className="row">
          <div>
            <p className="eyebrow">History</p>
            <h2>Training calendar</h2>
          </div>
          <div className="history-month-nav">
            <button className="text-button" onClick={() => setDisplayMonth(new Date(year, month - 1, 1))}>←</button>
            <span className="subtle">{monthLabel}</span>
            <button className="text-button" onClick={() => setDisplayMonth(new Date(year, month + 1, 1))}>→</button>
          </div>
        </div>
        <p className="muted">Every completed workout is saved by date and surfaced here for a quick review.</p>
      </Card>

      <Card>
        <div className="history-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
            <span key={label} className="history-weekday">{label}</span>
          ))}
          {calendarDays.map((cell, index) => (
            <button
              key={cell.dateString || `empty-${index}`}
              className={`history-day ${cell.dateString ? cell.status.tone : 'empty'} ${selectedDate === cell.dateString ? 'active' : ''}`}
              onClick={() => cell.dateString && setSelectedDate(cell.dateString)}
              disabled={!cell.dateString}
            >
              <strong>{cell.dayNumber ?? ''}</strong>
              <span>{cell.dateString ? cell.status.label : ''}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="section-title">
          <h3>{selectedDate ? `${selectedDayName} · ${selectedDate}` : 'Select a day'}</h3>
          <span className="subtle">{selectedStatus?.label || 'Open'}</span>
        </div>
        {!selectedDate || !selectedLog ? (
          <p className="muted">Pick a day from the calendar to inspect the full log.</p>
        ) : (
          <div className="history-detail-stack">
            <div className="history-detail-grid">
              <div className="history-detail-item">
                <span>Workout completed</span>
                <strong>{selectedLog.workoutSession?.phase === 'finished' ? 'Completed' : 'Pending'}</strong>
              </div>
              <div className="history-detail-item">
                <span>Workout duration</span>
                <strong>{getWorkoutDuration(selectedLog)}</strong>
              </div>
              <div className="history-detail-item">
                <span>Nutrition</span>
                <strong>{selectedLog.macros && (selectedLog.macros.protein || selectedLog.macros.carbs || selectedLog.macros.fat || selectedLog.macros.water) ? 'Logged' : 'Not logged'}</strong>
              </div>
              <div className="history-detail-item">
                <span>Recovery</span>
                <strong>{selectedLog.recovery?.sleep || selectedLog.recovery?.weight || selectedLog.recovery?.whoop ? 'Logged' : 'Not logged'}</strong>
              </div>
              <div className="history-detail-item">
                <span>Throwing</span>
                <strong>{Object.keys(selectedLog.checks || {}).some((key) => key.startsWith('Throwing:') && selectedLog.checks?.[key]) ? 'Logged' : 'Not logged'}</strong>
              </div>
              <div className="history-detail-item">
                <span>Notes</span>
                <strong>{selectedLog.notes?.trim() ? 'Added' : 'None'}</strong>
              </div>
            </div>

            <div className="history-meta-list">
              <div>
                <span className="subtle">Nutrition</span>
                <p>{selectedLog.macros?.protein ?? 0}g protein · {selectedLog.macros?.carbs ?? 0}g carbs · {selectedLog.macros?.fat ?? 0}g fat</p>
              </div>
              <div>
                <span className="subtle">Recovery</span>
                <p>Sleep {selectedLog.recovery?.sleep || '—'} · Weight {selectedLog.recovery?.weight || '—'} · WHOOP {selectedLog.recovery?.whoop || '—'}</p>
              </div>
              <div>
                <span className="subtle">Throwing</span>
                <p>{Object.keys(selectedLog.checks || {}).filter((key) => key.startsWith('Throwing:') && selectedLog.checks?.[key]).map((key) => key.replace('Throwing: ', '')).join(', ') || 'No throwing items marked'}</p>
              </div>
              <div>
                <span className="subtle">Notes</span>
                <p>{selectedLog.notes?.trim() || 'No notes recorded.'}</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default App
