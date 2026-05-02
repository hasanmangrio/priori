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
import { TaskDetail } from './components/TaskDetail'

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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
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

  function updateTaskDescription(id: string, description: string) {
    setState((prev) => {
      const update = (list: Task[]) =>
        list.map((t) => (t.id === id ? { ...t, description } : t))
      return { priorities: update(prev.priorities), backlog: update(prev.backlog) }
    })
  }

  const selectedTask =
    selectedTaskId !== null
      ? [...state.priorities, ...state.backlog].find((t) => t.id === selectedTaskId) ?? null
      : null

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const prioritiesCount = state.priorities.length
  const atCap = prioritiesCount >= MAX_PRIORITIES

  return (
    <div className="min-h-screen font-sans" style={{ background: 'linear-gradient(145deg, #ECEDF8 0%, #F3F0FF 40%, #FDF6FF 70%, #FFF8F0 100%)' }}>

      {/* ── Header ── */}
      <header className="px-6 pt-8 pb-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-babu tracking-tight">priori</h1>
              <span className="w-2 h-2 rounded-full bg-rausch mt-0.5" />
            </div>
            <p className="text-foggy text-xs mt-0.5 font-medium">{today}</p>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              atCap
                ? 'bg-rausch text-white shadow-sm'
                : 'bg-white/70 text-foggy border border-white shadow-sm backdrop-blur-sm'
            }`}
          >
            {prioritiesCount} / {MAX_PRIORITIES}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-10">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* ── Today's Focus card ── */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-card mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-rausch">
                Today's Focus
              </h2>
            </div>

            <DroppableContainer id="priorities" className="min-h-[64px]">
              <SortableContext
                items={state.priorities.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {state.priorities.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-[#FFCDD6] bg-[#FFF5F7]/60 p-7 text-center">
                    <p className="text-sm text-foggy">Drag your most important tasks here</p>
                  </div>
                ) : (
                  state.priorities.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      rank={i + 1}
                      onDelete={deleteTask}
                      onOpen={setSelectedTaskId}
                    />
                  ))
                )}
              </SortableContext>
            </DroppableContainer>
          </div>

          {/* ── The Line ── */}
          <div className="flex items-center gap-3 py-2 px-2 mb-4">
            <div className="flex-1 h-px bg-white/60" />
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-sm shadow-sm border border-white">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D0D0E0]" />
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-foggy select-none">
                The Line
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D0D0E0]" />
            </div>
            <div className="flex-1 h-px bg-white/60" />
          </div>

          {/* ── Everything Else card ── */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-card">
            <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-foggy mb-4">
              Everything Else
            </h2>

            <DroppableContainer id="backlog" className="min-h-[64px]">
              <SortableContext
                items={state.backlog.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {state.backlog.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-[#E8E8F0] p-7 text-center">
                    <p className="text-sm text-foggy">
                      {state.priorities.length > 0
                        ? "You're focused — nothing else on the list"
                        : 'Add tasks below to get started'}
                    </p>
                  </div>
                ) : (
                  state.backlog.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDelete={deleteTask}
                      onOpen={setSelectedTaskId}
                    />
                  ))
                )}
              </SortableContext>
            </DroppableContainer>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div className="bg-white rounded-2xl px-4 py-3.5 text-sm font-medium text-babu shadow-overlay cursor-grabbing rotate-1 opacity-95">
                {activeTask.text}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* ── Add Task ── */}
        <div className="mt-5 flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a task to your list..."
            className="flex-1 px-4 py-3 rounded-2xl border border-white bg-white/80 backdrop-blur-sm text-sm text-babu placeholder-foggy focus:outline-none focus:ring-2 focus:ring-rausch focus:border-transparent shadow-card transition-shadow"
          />
          <button
            onClick={addTask}
            disabled={!newTaskText.trim()}
            className="px-5 py-3 bg-rausch hover:bg-hof active:scale-95 disabled:bg-white/60 disabled:text-foggy disabled:cursor-not-allowed text-white font-semibold rounded-2xl text-sm transition-all shadow-card flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add
          </button>
        </div>
      </main>

      {/* ── Task Detail Modal ── */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={updateTaskDescription}
        />
      )}
    </div>
  )
}
