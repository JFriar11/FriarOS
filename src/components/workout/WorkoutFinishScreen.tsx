import type { ReactNode } from 'react'

interface WorkoutFinishScreenProps {
  durationMinutes: string
  completedExercises: number
  completedSets: number
  onRestart: () => void
  children?: ReactNode
}

export function WorkoutFinishScreen({
  durationMinutes,
  completedExercises,
  completedSets,
  onRestart,
  children
}: WorkoutFinishScreenProps) {
  return (
    <section className="coach-finish">
      <div className="coach-finish__icon">✓</div>
      <h2>Workout complete</h2>
      <p>Great work. Your session was logged locally and is ready for review.</p>
      <div className="coach-finish__stats">
        <div>
          <span>Duration</span>
          <strong>{durationMinutes}</strong>
        </div>
        <div>
          <span>Exercises</span>
          <strong>{completedExercises}</strong>
        </div>
        <div>
          <span>Sets</span>
          <strong>{completedSets}</strong>
        </div>
      </div>
      {children}
      <button className="coach-primary" onClick={onRestart}>Start another workout</button>
    </section>
  )
}
