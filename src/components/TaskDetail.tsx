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
    const t = setTimeout(() => textareaRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [])

  function handleChange(value: string) {
    setDescription(value)
    onUpdate(task.id, value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 font-sans">
      <div className="absolute inset-0 bg-ink/25 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl z-10 shadow-sheet overflow-hidden">
        {/* Thin clay accent top bar */}
        <div className="h-0.5 bg-clay" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-4">
              <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-clay mb-1">Task</p>
              <h2 className="text-ink font-bold text-lg leading-snug">{task.text}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-shell hover:bg-line transition-colors text-mist flex-shrink-0"
              aria-label="Close"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>

          {/* Notes */}
          <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-mist mb-1.5">Notes</p>
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Add context, links, subtasks, or anything useful..."
            rows={5}
            className="w-full resize-none bg-shell rounded-xl px-4 py-3 text-sm text-ink placeholder-fog focus:outline-none focus:ring-2 focus:ring-clay/40 leading-relaxed border border-line"
          />

          <button
            onClick={onClose}
            className="mt-3 w-full py-2.5 bg-clay hover:bg-ember active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition-all"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  )
}
