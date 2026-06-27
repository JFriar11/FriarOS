export type MacroKey = 'protein' | 'carbs' | 'fat' | 'water'

export interface MacroTargets {
  protein: number
  carbs: number
  fat: number
  water: number
}

export interface MacroLog {
  protein: number
  carbs: number
  fat: number
  water: number
}

export interface RecoveryLog {
  sleep: string
  weight: string
  whoop: string
  soreness: number
}

export interface LiftEntry {
  exercise: string
  sets: string
  reps: string
  weight: string
  notes: string
}

export interface WorkoutExerciseState {
  name: string
  sets: number
  reps: string
  previousValue: string
  targetWeight: string
  notes: string
  completedSets: number
  completed: boolean
  templateIndex?: number
}

export interface WorkoutSessionState {
  startedAt: string
  completedAt?: string
  activeExerciseIndex: number
  phase: 'active' | 'rest' | 'finished'
  restSecondsLeft: number
  exercises: WorkoutExerciseState[]
}

export interface ProgramDay {
  day: string
  focus: string
  type: string
  exercises: string[]
}

export interface ProgramWeek {
  week: string
  days: ProgramDay[]
}

export interface ProgramTemplate {
  phase: string
  startDate?: string
  weeks: ProgramWeek[]
}

export interface DailyLog {
  checks?: Record<string, boolean>
  macros?: Partial<MacroLog>
  recovery?: Partial<RecoveryLog>
  notes?: string
  weights?: Record<string, string>
  lifts?: LiftEntry[]
  workoutSession?: WorkoutSessionState
}

export interface PlanDay {
  focus: string
  type: string
  items: string[]
}

export type WeeklyPlanMap = Record<string, string>

export interface AppState {
  [date: string]: DailyLog | undefined
  weekPlan?: WeeklyPlanMap
  programTemplate?: ProgramTemplate
  activeWeek?: string
}
