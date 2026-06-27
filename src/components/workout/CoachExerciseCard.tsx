import type { ChangeEvent } from 'react'

interface CoachExerciseCardProps {
  exerciseName: string
  completeSets: number
  targetSets: number
  targetReps: string
  previousValue: string
  targetWeight: string
  notes: string
  isComplete: boolean
  onTargetWeightChange: (value: string) => void
  onNotesChange: (value: string) => void
  onCompleteSet: () => void
  onNextExercise: () => void
  restSecondsLeft: number
  status: 'active' | 'rest' | 'finished'
}

export function CoachExerciseCard({
  exerciseName,
  completeSets,
  targetSets,
  targetReps,
  previousValue,
  targetWeight,
  notes,
  isComplete,
  onTargetWeightChange,
  onNotesChange,
  onCompleteSet,
  onNextExercise,
  restSecondsLeft,
  status
}: CoachExerciseCardProps) {
  const handleWeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    onTargetWeightChange(event.target.value)
  }

  const handleNotesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onNotesChange(event.target.value)
  }

  return (
    <section className="coach-card">
      <div className="coach-card__header">
        <div>
          <p className="eyebrow">Coach Mode</p>
          <h2>{exerciseName}</h2>
        </div>
        <div className="coach-card__badge">{completeSets}/{targetSets} sets</div>
      </div>

      <div className="coach-card__meta">
        <div>
          <span className="coach-card__label">Sets × reps</span>
          <strong>{targetSets} × {targetReps}</strong>
        </div>
        <div>
          <span className="coach-card__label">Previous</span>
          <strong>{previousValue || '—'}</strong>
        </div>
      </div>

      <label className="coach-field">
        <span>Target weight</span>
        <input value={targetWeight} onChange={handleWeightChange} placeholder="135" />
      </label>

      <label className="coach-field">
        <span>Notes</span>
        <textarea value={notes} onChange={handleNotesChange} placeholder="How it felt, cues, or tempo" />
      </label>

      <div className="coach-actions">
        {status === 'rest' ? (
          <div className="coach-rest">
            <strong>Rest {restSecondsLeft}s</strong>
            <p>Recover, then get ready for the next set.</p>
          </div>
        ) : (
          <button className="coach-primary" onClick={onCompleteSet}>
            {isComplete ? 'Completed' : 'Complete Set'}
          </button>
        )}

        {isComplete && (
          <button className="coach-secondary" onClick={onNextExercise}>
            Next Exercise
          </button>
        )}
      </div>
    </section>
  )
}
