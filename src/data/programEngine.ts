import type { AppState, ProgramDay, ProgramTemplate, ProgramWeek, WorkoutExerciseState } from '../types'

export const PROGRAM_PHASES = ['Summer Offseason Phase 2'] as const
export const PROGRAM_WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'] as const
export const PROGRAM_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

const buildDay = (
  day: string,
  payload: Partial<ProgramDay> & Pick<ProgramDay, 'focus' | 'type' | 'difficulty' | 'durationMinutes' | 'warmup' | 'exercises' | 'throwing' | 'nutrition' | 'recovery'>
): ProgramDay => ({
  day,
  focus: payload.focus,
  type: payload.type,
  difficulty: payload.difficulty,
  durationMinutes: payload.durationMinutes,
  warmup: payload.warmup,
  exercises: payload.exercises,
  throwing: payload.throwing,
  nutrition: payload.nutrition,
  recovery: payload.recovery
})

export const defaultProgramTemplate: ProgramTemplate = {
  phase: 'Summer Offseason Phase 2',
  startDate: '2026-01-05',
  weeks: [
    {
      week: 'Week 1',
      days: [
        buildDay('Monday', {
          focus: 'Max Velocity Sprint',
          type: 'Speed',
          difficulty: 'High',
          durationMinutes: 75,
          warmup: ['Lunge & Reach', 'Microskips', 'Rhicross Footwork', 'Ladder Landings', 'Icky Bounds'],
          exercises: ['Fly Ins'],
          throwing: { items: ['Catch 60–90 ft', 'Arm Care'] },
          nutrition: { protein: 190, carbs: 325, fat: 70, water: 4 },
          recovery: [{ label: 'Stretch' }, { label: 'Foam Roll' }, { label: 'Sleep 8h' }]
        }),
        buildDay('Tuesday', {
          focus: 'Recovery',
          type: 'Recovery',
          difficulty: 'Recovery',
          durationMinutes: 30,
          warmup: ['Mobility'],
          exercises: ['Walk', 'Mobility'],
          throwing: { items: ['Optional Catch'] },
          nutrition: { protein: 190, carbs: 240, fat: 70, water: 3.5 },
          recovery: [{ label: 'Stretch' }, { label: 'Hydrate' }]
        }),
        buildDay('Wednesday', {
          focus: 'Speed Endurance',
          type: 'Conditioning',
          difficulty: 'High',
          durationMinutes: 60,
          warmup: ['Lunge & Reach', 'Microskips', 'Rhicross Footwork', 'Ladder Landings'],
          exercises: ['Pace / Intervals', 'Leg Circuit'],
          throwing: { items: ['Ground Balls', 'Short Hops'] },
          nutrition: { protein: 190, carbs: 325, fat: 70, water: 4 },
          recovery: [{ label: 'Stretch' }, { label: 'Foam Roll' }, { label: 'Sleep 8h' }]
        }),
        buildDay('Thursday', {
          focus: 'Arm Care + Throwing',
          type: 'Arm Care',
          difficulty: 'Medium',
          durationMinutes: 45,
          warmup: ['Shoulder Prep', 'Thoracic Mobility', 'Band Pull-Aparts'],
          exercises: ['Long Toss Progression', 'Arm Care', 'Mobility'],
          throwing: { items: ['Long Toss', 'Arm Care'] },
          nutrition: { protein: 190, carbs: 260, fat: 70, water: 3.5 },
          recovery: [{ label: 'Stretch' }, { label: 'Hydrate' }]
        }),
        buildDay('Friday', {
          focus: 'Upper Body Strength',
          type: 'Gym',
          difficulty: 'High',
          durationMinutes: 70,
          warmup: ['Band Prep', 'Shoulder Activation', 'Light Row Warmup'],
          exercises: ['DB Complex 1', 'Bench Choice', 'Row', 'Overhead Press'],
          throwing: { items: ['Easy Catch', 'Mobility'] },
          nutrition: { protein: 200, carbs: 320, fat: 75, water: 4 },
          recovery: [{ label: 'Protein + Carbs' }, { label: 'Hydrate' }, { label: 'Recovery Walk' }]
        }),
        buildDay('Saturday', {
          focus: 'Lower Body Power',
          type: 'Gym',
          difficulty: 'High',
          durationMinutes: 65,
          warmup: ['Footwork Prep', 'Mobility', 'Hip Activation'],
          exercises: ['Lunge & Reach', 'Footwork', 'Fly Ins', 'Squat Variation', 'RDL'],
          throwing: { items: ['Short Toss', 'Arm Care'] },
          nutrition: { protein: 195, carbs: 330, fat: 72, water: 4 },
          recovery: [{ label: 'Leg Recovery' }, { label: 'Hydrate' }, { label: 'Sleep 8h' }]
        }),
        buildDay('Sunday', {
          focus: 'Recovery + Light Speed',
          type: 'Acceleration',
          difficulty: 'Medium',
          durationMinutes: 55,
          warmup: ['Mobility', 'Sprint Mechanics', 'Easy Skips'],
          exercises: ['Garcia Plyos', 'Easy Accelerations', 'Mobility'],
          throwing: { items: ['Long Toss', 'Arm Care'] },
          nutrition: { protein: 190, carbs: 300, fat: 70, water: 4 },
          recovery: [{ label: 'Full Body Stretch' }, { label: 'Hydrate' }, { label: 'Recovery Meal' }]
        })
      ]
    },
    {
      week: 'Week 2',
      days: PROGRAM_DAYS.map((day) => ({
        day,
        focus: `${day} focus`,
        type: 'Training',
        difficulty: 'Medium',
        durationMinutes: 50,
        warmup: ['General warmup'],
        exercises: [],
        throwing: { items: [] },
        nutrition: { protein: 190, carbs: 280, fat: 70, water: 3.5 },
        recovery: [{ label: 'Hydrate' }]
      }))
    },
    {
      week: 'Week 3',
      days: PROGRAM_DAYS.map((day) => ({
        day,
        focus: `${day} focus`,
        type: 'Training',
        difficulty: 'Medium',
        durationMinutes: 50,
        warmup: ['General warmup'],
        exercises: [],
        throwing: { items: [] },
        nutrition: { protein: 190, carbs: 280, fat: 70, water: 3.5 },
        recovery: [{ label: 'Hydrate' }]
      }))
    },
    {
      week: 'Week 4',
      days: PROGRAM_DAYS.map((day) => ({
        day,
        focus: `${day} focus`,
        type: 'Training',
        difficulty: 'Medium',
        durationMinutes: 50,
        warmup: ['General warmup'],
        exercises: [],
        throwing: { items: [] },
        nutrition: { protein: 190, carbs: 280, fat: 70, water: 3.5 },
        recovery: [{ label: 'Hydrate' }]
      }))
    }
  ]
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

  const offset = getWeekOffsetFromStart(new Date(program.startDate || '2026-01-05'), currentDate)
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

export function getProgramSnapshot(_state: AppState, template: ProgramTemplate, currentDate: Date, overrideWeek?: string) {
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
