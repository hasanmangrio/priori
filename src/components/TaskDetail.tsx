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
    textareaRef.current?.focus()
  }, [])

  function handleChange(value: string) {
    setDescription(value)
    onUpdate(task.id, value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl p-6 z-10"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.08)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#F3F0FF] hover:bg-[#E8E4FF] transition-colors text-foggy"
          aria-label="Close"
        >
          <X size={15} strokeWidth={2.5} />
        </button>

        {/* Label */}
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-rausch mb-1.5">
          Task
        </p>

        {/* Task title */}
        <h2 className="text-babu font-bold text-lg leading-snug pr-10 mb-6">
          {task.text}
        </h2>

        {/* Notes */}
        <label className="text-[11px] font-semibold tracking-[0.12em] uppercase text-foggy mb-2 block">
          Notes
        </label>
        <textarea
          ref={textareaRef}
          value={description}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Add context, links, subtasks, or anything useful..."
          rows={5}
          className="w-full resize-none rounded-2xl px-4 py-3 text-sm text-babu placeholder-[#BBBBCC] focus:outline-none focus:ring-2 focus:ring-rausch leading-relaxed transition-shadow"
          style={{ background: 'linear-gradient(145deg, #F5F3FF, #FFF5F7)' }}
        />

        <button
          onClick={onClose}
          className="mt-4 w-full py-3 bg-rausch hover:bg-hof active:scale-[0.98] text-white font-semibold rounded-2xl text-sm transition-all"
        >
          Done
        </button>
      </div>
    </div>
  )
}
