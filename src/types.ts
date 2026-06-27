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

export interface ThrowingPlan {
  items: string[]
}

export interface NutritionTargets {
  protein: number
  carbs: number
  fat: number
  water: number
}

export interface RecoveryChecklistItem {
  label: string
  completed?: boolean
}

export interface ProgramDay {
  day: string
  focus: string
  type: string
  difficulty: 'Recovery' | 'Medium' | 'High'
  durationMinutes: number
  warmup: string[]
  exercises: string[]
  throwing: ThrowingPlan
  nutrition: NutritionTargets
  recovery: RecoveryChecklistItem[]
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

export interface SupabaseProfile {
  id: string
  display_name?: string | null
  created_at?: string
  updated_at?: string
}

export interface SupabaseAppStateRecord {
  id?: string
  user_id: string
  data: AppState
  updated_at?: string
}
