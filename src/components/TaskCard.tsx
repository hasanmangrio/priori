import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import type { Task } from '../types'

interface Props {
  task: Task
  rank?: number
  onDelete: (id: string) => void
}

export function TaskCard({ task, rank, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const isPriority = rank !== undefined

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-2.5 group select-none
        bg-white transition-shadow
        ${isPriority ? 'shadow-card hover:shadow-card-hover' : 'border border-border hover:shadow-card'}
        ${isDragging ? 'opacity-30' : 'opacity-100'}
      `}
    >
      {/* Rank badge */}
      {isPriority && (
        <div className="w-6 h-6 rounded-full bg-rausch flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-bold text-white leading-none">{rank}</span>
        </div>
      )}

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        className="text-[#DDDDDD] hover:text-foggy cursor-grab active:cursor-grabbing flex-shrink-0 touch-none p-0.5 rounded transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical size={15} strokeWidth={2} />
      </button>

      {/* Task text */}
      <span
        className={`flex-1 text-sm leading-snug ${
          isPriority ? 'text-babu font-medium' : 'text-foggy'
        }`}
      >
        {task.text}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="flex-shrink-0 text-[#DDDDDD] hover:text-rausch transition-colors p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete task"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}
