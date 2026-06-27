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

export interface DailyLog {
  checks?: Record<string, boolean>
  macros?: Partial<MacroLog>
  recovery?: Partial<RecoveryLog>
  notes?: string
  weights?: Record<string, string>
  lifts?: LiftEntry[]
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
}
