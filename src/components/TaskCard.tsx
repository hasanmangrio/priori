import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-2 group select-none
        transition-all
        ${isPriority
          ? 'bg-white shadow-card hover:shadow-card-hover'
          : 'bg-[#F7F7FB] hover:bg-white hover:shadow-card border border-[#EEEEF5]'
        }
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
        className="text-[#CCCCDD] hover:text-foggy cursor-grab active:cursor-grabbing flex-shrink-0 touch-none p-0.5 rounded transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical size={15} strokeWidth={2} />
      </button>

      {/* Task text — click opens detail */}
      <button
        onClick={() => onOpen(task.id)}
        className={`flex-1 text-left text-sm leading-snug flex items-center gap-2 min-w-0 ${
          isPriority ? 'text-babu font-medium' : 'text-foggy'
        }`}
      >
        <span className="truncate">{task.text}</span>
        {task.description && (
          <span className="w-1.5 h-1.5 rounded-full bg-rausch/30 flex-shrink-0" />
        )}
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="flex-shrink-0 text-[#CCCCDD] hover:text-rausch transition-colors p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete task"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}
