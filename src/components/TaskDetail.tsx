import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { Task } from '../types'

interface Props {
  task: Task
  onClose: () => void
  onUpdate: (id: string, description: string) => void
}

export function TaskDetail({ task, onClose, onUpdate }: Props) {
  const [description, setDescription] = useState(task.description ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Small delay so the sheet animation doesn't compete with keyboard on mobile
    const t = setTimeout(() => textareaRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  function handleChange(value: string) {
    setDescription(value)
    onUpdate(task.id, value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-lg bg-card sm:rounded-3xl rounded-t-3xl z-10 shadow-sheet overflow-hidden">

        {/* Top accent bar */}
        <div className="h-1 bg-clay w-full" />

        <div className="p-6">
          {/* Header row */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1 pr-4">
              <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-clay mb-1">Task</p>
              <h2 className="text-ink font-bold text-xl leading-snug">{task.text}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-cream hover:bg-line transition-colors text-mist flex-shrink-0 mt-0.5"
              aria-label="Close"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>

          {/* Notes */}
          <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-mist mb-2">Notes</p>
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Add context, links, subtasks, or anything useful..."
            rows={6}
            className="w-full resize-none bg-cream rounded-2xl px-4 py-3.5 text-sm text-ink placeholder-fog focus:outline-none focus:ring-2 focus:ring-clay leading-relaxed border border-line"
          />

          <button
            onClick={onClose}
            className="mt-4 w-full py-3.5 bg-clay hover:bg-ember active:scale-[0.98] text-white font-bold rounded-2xl text-sm transition-all"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  )
}
