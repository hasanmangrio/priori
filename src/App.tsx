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
      if (overContainer === 'priorities' && destItems.length >= MAX_PRIORITIES) return prev
      const overIdx = destItems.findIndex((t) => t.id === over.id)
      destItems.splice(overIdx >= 0 ? overIdx : destItems.length, 0, moved)
      return {
        priorities: activeContainer === 'priorities' ? sourceItems : destItems,
        backlog: activeContainer === 'backlog' ? sourceItems : destItems,
      }
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
    if (!over || active.id === over.id) return
    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)
    if (!activeContainer || !overContainer) return

    if (activeContainer !== overContainer) {
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
    <div className="min-h-screen bg-page font-sans">
      {/* ── Header ── */}
      <header className="bg-white border-b border-border px-6 py-5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-babu tracking-tight">priori</h1>
              <span className="w-2 h-2 rounded-full bg-rausch" />
            </div>
            <p className="text-foggy text-xs mt-0.5 font-medium">{today}</p>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
              atCap
                ? 'bg-rausch text-white'
                : 'bg-page text-foggy border border-border'
            }`}
          >
            {prioritiesCount} / {MAX_PRIORITIES}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-7">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* ── Today's Focus ── */}
          <section className="mb-2">
            <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-rausch mb-3">
              Today's Focus
            </h2>

            <DroppableContainer id="priorities" className="min-h-[72px]">
              <SortableContext
                items={state.priorities.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {state.priorities.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-[#FFCDD6] bg-[#FFF5F7] p-8 text-center">
                    <p className="text-sm text-foggy">
                      Drag your most important tasks here
                    </p>
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
          <div className="flex items-center gap-3 py-6">
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-white shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DDDDDD]" />
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-foggy select-none">
                The Line
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#DDDDDD]" />
            </div>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Everything Else ── */}
          <section>
            <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-foggy mb-3">
              Everything Else
            </h2>

            <DroppableContainer id="backlog" className="min-h-[72px]">
              <SortableContext
                items={state.backlog.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {state.backlog.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-border bg-white p-8 text-center">
                    <p className="text-sm text-foggy">
                      {state.priorities.length > 0
                        ? "You're focused — nothing else on the list"
                        : 'Add tasks below to get started'}
                    </p>
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
              <div className="bg-white rounded-2xl px-4 py-3.5 text-sm font-medium text-babu shadow-overlay cursor-grabbing rotate-1 opacity-95">
                {activeTask.text}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* ── Add Task ── */}
        <div className="mt-8 flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a task to your list..."
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-white text-sm text-babu placeholder-foggy focus:outline-none focus:ring-2 focus:ring-rausch focus:border-transparent shadow-card transition-shadow"
          />
          <button
            onClick={addTask}
            disabled={!newTaskText.trim()}
            className="px-5 py-3 bg-rausch hover:bg-hof active:scale-95 disabled:bg-[#EBEBEB] disabled:text-foggy disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-card flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add
          </button>
        </div>
      </main>
    </div>
  )
}
