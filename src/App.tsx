import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  UniqueIdentifier,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { AppState, ContainerId, Task } from './types'
import { TaskCard } from './components/TaskCard'

const MAX_PRIORITIES = 5
const STORAGE_KEY = 'priori-v1'

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function DroppableContainer({
  id,
  children,
  className,
}: {
  id: ContainerId
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  )
}

const defaultState: AppState = { priorities: [], backlog: [] }

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaultState
  } catch {
    return defaultState
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [newTaskText, setNewTaskText] = useState('')
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep a ref always in sync so event handlers read fresh state
  const stateRef = useRef(state)
  useLayoutEffect(() => {
    stateRef.current = state
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const findContainer = useCallback((id: UniqueIdentifier): ContainerId | null => {
    if (id === 'priorities' || id === 'backlog') return id as ContainerId
    const s = stateRef.current
    if (s.priorities.some((t) => t.id === id)) return 'priorities'
    if (s.backlog.some((t) => t.id === id)) return 'backlog'
    return null
  }, [])

  function handleDragStart({ active }: DragStartEvent) {
    const container = findContainer(active.id)
    if (!container) return
    const task = stateRef.current[container].find((t) => t.id === active.id)
    setActiveTask(task ?? null)
  }

  // onDragOver: live preview when crossing between containers
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return

    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setState((prev) => {
      const sourceItems = [...prev[activeContainer]]
      const destItems = [...prev[overContainer]]

      const sourceIdx = sourceItems.findIndex((t) => t.id === active.id)
      if (sourceIdx < 0) return prev

      const [moved] = sourceItems.splice(sourceIdx, 1)

      // Enforce priority cap
      if (overContainer === 'priorities' && destItems.length >= MAX_PRIORITIES) {
        return prev
      }

      const overIdx = destItems.findIndex((t) => t.id === over.id)
      destItems.splice(overIdx >= 0 ? overIdx : destItems.length, 0, moved)

      return {
        priorities: activeContainer === 'priorities' ? sourceItems : destItems,
        backlog: activeContainer === 'backlog' ? sourceItems : destItems,
      }
    })
  }

  // onDragEnd: finalize same-container reorder (cross-container was handled in onDragOver)
  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
    if (!over || active.id === over.id) return

    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)

    if (!activeContainer || !overContainer) return

    if (activeContainer !== overContainer) {
      // Cross-container drop on an empty container (over.id is container id itself)
      // onDragOver already handled item-over-item cases; this handles the empty zone case
      setState((prev) => {
        const sourceItems = [...prev[activeContainer]]
        const destItems = [...prev[overContainer]]
        const sourceIdx = sourceItems.findIndex((t) => t.id === active.id)
        if (sourceIdx < 0) return prev
        if (overContainer === 'priorities' && destItems.length >= MAX_PRIORITIES) return prev
        const [moved] = sourceItems.splice(sourceIdx, 1)
        destItems.push(moved)
        return {
          priorities: activeContainer === 'priorities' ? sourceItems : destItems,
          backlog: activeContainer === 'backlog' ? sourceItems : destItems,
        }
      })
      return
    }

    // Same container: final reorder
    setState((prev) => {
      const items = prev[activeContainer]
      const oldIdx = items.findIndex((t) => t.id === active.id)
      const newIdx = items.findIndex((t) => t.id === over.id)
      if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return prev
      return { ...prev, [activeContainer]: arrayMove(items, oldIdx, newIdx) }
    })
  }

  function addTask() {
    const text = newTaskText.trim()
    if (!text) return
    const task: Task = { id: generateId(), text, createdAt: Date.now() }
    setState((prev) => ({ ...prev, backlog: [...prev.backlog, task] }))
    setNewTaskText('')
    inputRef.current?.focus()
  }

  function deleteTask(id: string) {
    setState((prev) => ({
      priorities: prev.priorities.filter((t) => t.id !== id),
      backlog: prev.backlog.filter((t) => t.id !== id),
    }))
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const prioritiesCount = state.priorities.length
  const atCap = prioritiesCount >= MAX_PRIORITIES

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-5 shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">Priori</h1>
          <p className="text-slate-400 text-sm mt-0.5">{today}</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* ── Priority Zone ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold tracking-widest uppercase text-slate-500">
                Today's Priorities
              </h2>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                  atCap
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {prioritiesCount} / {MAX_PRIORITIES}
              </span>
            </div>

            <DroppableContainer id="priorities" className="min-h-[64px]">
              <SortableContext
                items={state.priorities.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {state.priorities.length === 0 ? (
                  <div className="border-2 border-dashed border-amber-200 rounded-xl p-6 text-center text-sm text-slate-400 bg-amber-50/50">
                    Drag your most important tasks here
                  </div>
                ) : (
                  state.priorities.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      rank={i + 1}
                      onDelete={deleteTask}
                    />
                  ))
                )}
              </SortableContext>
            </DroppableContainer>
          </section>

          {/* ── The Line ── */}
          <div className="flex items-center gap-3 py-4">
            <div className="flex-1 h-px bg-slate-300" />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 select-none">
              The Line
            </span>
            <div className="flex-1 h-px bg-slate-300" />
          </div>

          {/* ── Backlog ── */}
          <section>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-3">
              Everything Else
            </h2>

            <DroppableContainer id="backlog" className="min-h-[64px]">
              <SortableContext
                items={state.backlog.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {state.backlog.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-sm text-slate-400">
                    {state.priorities.length > 0
                      ? 'Nothing else — you\'re focused!'
                      : 'Add tasks below to get started'}
                  </div>
                ) : (
                  state.backlog.map((task) => (
                    <TaskCard key={task.id} task={task} onDelete={deleteTask} />
                  ))
                )}
              </SortableContext>
            </DroppableContainer>
          </section>

          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div className="bg-white border border-slate-200 shadow-2xl rounded-xl px-4 py-3 text-sm text-slate-700 cursor-grabbing rotate-1 opacity-95">
                {activeTask.text}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* ── Add Task ── */}
        <div className="pt-4 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a task to your list..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent shadow-sm"
          />
          <button
            onClick={addTask}
            disabled={!newTaskText.trim()}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add
          </button>
        </div>
      </main>
    </div>
  )
}
