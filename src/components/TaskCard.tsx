import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, FileText } from 'lucide-react'
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
    // Entire card is the drag handle — listeners applied here
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center gap-3 rounded-xl mb-1.5 group select-none
        cursor-grab active:cursor-grabbing transition-all
        ${isPriority
          ? 'bg-white shadow-soft hover:shadow-lift px-4 py-2.5'
          : 'bg-white border border-line hover:shadow-soft px-4 py-2.5'
        }
        ${isDragging ? 'opacity-30 scale-[0.97]' : ''}
      `}
    >
      {/* Rank */}
      {isPriority && (
        <span className="text-lg font-bold text-clay leading-none w-6 flex-shrink-0 tabular-nums">
          {String(rank).padStart(2, '0')}
        </span>
      )}

      {/* Task text — click/tap opens notes; stopPropagation so drag doesn't fire on click */}
      <button
        onClick={(e) => { e.stopPropagation(); onOpen(task.id) }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`flex-1 text-left leading-snug flex items-center gap-1.5 min-w-0 cursor-pointer ${
          isPriority ? 'text-ink font-semibold text-sm' : 'text-ink/60 text-sm font-medium'
        }`}
      >
        <span className="truncate">{task.text}</span>
        {task.description && <FileText size={10} className="flex-shrink-0 text-clay/40" />}
      </button>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex-shrink-0 text-fog hover:text-clay transition-colors rounded opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete task"
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </div>
  )
}
