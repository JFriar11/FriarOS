import type { DailyLog, PlanDay } from '../types'

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export function getTodayName() {
  return DAYS[new Date().getDay()]
}

export function getTodayId() {
  return new Date().toISOString().slice(0, 10)
}

export function normalizeLog(logData: DailyLog = {}): DailyLog {
  return {
    checks: logData.checks || {},
    macros: { protein: 0, carbs: 0, fat: 0, water: 0, ...(logData.macros || {}) },
    recovery: { sleep: '', weight: '', whoop: '', soreness: 3, ...(logData.recovery || {}) },
    notes: logData.notes || '',
    weights: logData.weights || {},
    lifts: Array.isArray(logData.lifts) ? logData.lifts : [],
    workoutSession: logData.workoutSession
  }
}

export function createPlanItems(currentPlanText: string, fallbackItems: string[]): string[] {
  const items = currentPlanText
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

  return items.length ? items : fallbackItems
}

export function buildPlan(day: string, currentPlanText: string, fallbackPlan: PlanDay): PlanDay {
  return {
    ...fallbackPlan,
    items: createPlanItems(currentPlanText, fallbackPlan.items)
  }
}
