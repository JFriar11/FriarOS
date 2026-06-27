import type { ProgramTemplate, ProgramWeek, ProgramDay, AppState, WorkoutExerciseState } from '../types'

export const PROGRAM_PHASES = ['Summer Phase 2'] as const
export const PROGRAM_WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'] as const
export const PROGRAM_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

const baseTemplate = {
  phase: 'Summer Phase 2' as const,
  weeks: PROGRAM_WEEKS.map((weekName) => ({
    week: weekName,
    days: PROGRAM_DAYS.map((dayName) => ({
      day: dayName,
      focus: `${dayName} focus`,
      type: 'Training',
      exercises: [] as string[]
    }))
  }))
}

export const defaultProgramTemplate: ProgramTemplate = {
  ...baseTemplate,
  weeks: baseTemplate.weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      exercises: getDefaultExercises(day.day)
    }))
  }))
}

function getDefaultExercises(day: string): string[] {
  const defaults: Record<string, string[]> = {
    Monday: ['Lunge & Reach', 'Microskips', 'Ladder Landings'],
    Tuesday: ['Mobility', 'Easy walk', 'Light catch optional'],
    Wednesday: ['Blue warmup', 'Pacers / Intervals', 'Leg Circuit'],
    Thursday: ['Long toss progression', 'Arm care', 'Mobility'],
    Friday: ['DB Complex 1', 'Bench Choice', 'Row'],
    Saturday: ['Footwork', 'Fly Ins', 'Squat Variation'],
    Sunday: ['Garcia Plyos', 'Baseball Sprint Accelerations', 'Squatgatta']
  }

  return defaults[day] || []
}

export function getStartOfWeek(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  return start
}

export function getWeekOffsetFromStart(startDate: Date, currentDate: Date) {
  const start = getStartOfWeek(startDate)
  const current = getStartOfWeek(currentDate)
  const diffDays = Math.round((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 7)
}

export function resolveActiveWeek(program: ProgramTemplate, currentDate: Date, overrideWeek?: string) {
  if (overrideWeek) {
    return program.weeks.find((week) => week.week === overrideWeek) || program.weeks[0]
  }

  const offset = getWeekOffsetFromStart(new Date(program.startDate || '2026-01-05T00:00:00.000Z'), currentDate)
  const safeOffset = Math.max(0, Math.min(program.weeks.length - 1, offset))
  return program.weeks[safeOffset]
}

export function resolveActiveDay(week: ProgramWeek, currentDate: Date) {
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()]
  return week.days.find((day) => day.day === dayName) || week.days[0]
}

export function createWorkoutExercisesFromTemplate(day: ProgramDay): WorkoutExerciseState[] {
  return day.exercises.map((exercise, index) => ({
    name: exercise,
    sets: 3,
    reps: '5',
    previousValue: '',
    targetWeight: '',
    notes: '',
    completedSets: 0,
    completed: false,
    templateIndex: index
  }))
}

export function getProgramSnapshot(state: AppState, template: ProgramTemplate, currentDate: Date, overrideWeek?: string) {
  const activeWeek = resolveActiveWeek(template, currentDate, overrideWeek)
  const activeDay = resolveActiveDay(activeWeek, currentDate)

  return {
    template,
    activeWeek,
    activeDay,
    currentDate,
    exercises: createWorkoutExercisesFromTemplate(activeDay)
  }
}
