interface ProgressBarProps {
  value: number
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="bar">
      <span style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}
