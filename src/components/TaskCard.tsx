import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, FileText } from 'lucide-react'
import type { Task } from '../types'

interface Props {
  task: Task
  rank?: number
  onDelete: (id: string) => void
  onOpen: (id: string) => void
}

export function TaskCard({ task, rank, onDelete, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const isPriority = rank !== undefined

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 rounded-2xl mb-2.5 group select-none transition-all
        ${isPriority
          ? 'bg-card shadow-soft hover:shadow-lift px-4 py-3.5'
          : 'bg-card border border-line hover:shadow-soft px-4 py-3'
        }
        ${isDragging ? 'opacity-30 scale-[0.98]' : 'opacity-100'}
      `}
    >
      {/* Rank — bold zero-padded number */}
      {isPriority && (
        <span className="text-2xl font-bold text-clay leading-none w-8 flex-shrink-0 tabular-nums">
          {String(rank).padStart(2, '0')}
        </span>
      )}

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        className="text-fog hover:text-mist cursor-grab active:cursor-grabbing flex-shrink-0 touch-none rounded transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical size={15} strokeWidth={2} />
      </button>

      {/* Task text — tap/click opens notes */}
      <button
        onClick={() => onOpen(task.id)}
        className={`flex-1 text-left leading-snug flex items-center gap-2 min-w-0 ${
          isPriority ? 'text-ink font-semibold text-sm' : 'text-ink/70 text-sm font-medium'
        }`}
      >
        <span className="truncate">{task.text}</span>
        {task.description && (
          <FileText size={11} className="flex-shrink-0 text-clay/50" />
        )}
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="flex-shrink-0 text-fog hover:text-clay transition-colors p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete task"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}
