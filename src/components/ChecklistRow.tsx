import { CheckCircle2 } from 'lucide-react'

interface ChecklistRowProps {
  item: string
  checked: boolean
  onToggle: () => void
}

export function ChecklistRow({ item, checked, onToggle }: ChecklistRowProps) {
  return (
    <button className="checkrow" onClick={onToggle}>
      <CheckCircle2 className={checked ? 'done' : ''} />
      <span>{item}</span>
    </button>
  )
}
