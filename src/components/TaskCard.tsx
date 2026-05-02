import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import type { Task } from '../types'

interface Props {
  task: Task
  rank?: number   // 1-5, present only for priority items
  onDelete: (id: string) => void
}

export function TaskCard({ task, rank, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isPriority = rank !== undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 px-3 py-3 rounded-xl mb-2 group select-none
        transition-shadow
        ${isPriority
          ? 'bg-white border border-amber-200 shadow-sm'
          : 'bg-white border border-slate-200 shadow-sm'
        }
        ${isDragging ? 'opacity-30' : 'opacity-100'}
      `}
    >
      {/* Rank badge */}
      {isPriority && (
        <span className="w-5 text-center text-xs font-bold text-amber-500 flex-shrink-0">
          {rank}
        </span>
      )}

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none p-0.5 rounded"
        aria-label="Drag to reorder"
      >
        <GripVertical size={15} strokeWidth={2} />
      </button>

      {/* Task text */}
      <span
        className={`flex-1 text-sm leading-snug ${
          isPriority ? 'text-slate-800 font-medium' : 'text-slate-600'
        }`}
      >
        {task.text}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="flex-shrink-0 text-slate-300 hover:text-red-400 transition-colors p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete task"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}
