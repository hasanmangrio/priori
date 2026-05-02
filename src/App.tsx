import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  MouseSensor,
  TouchSensor,
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
  return <div ref={setNodeRef} className={className}>{children}</div>
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
  useLayoutEffect(() => { stateRef.current = state })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // Touch: 200ms hold = drag; quick tap = click (fixes description on mobile)
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
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
    setActiveTask(stateRef.current[container].find((t) => t.id === active.id) ?? null)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return
    const ac = findContainer(active.id)
    const oc = findContainer(over.id)
    if (!ac || !oc || ac === oc) return

    setState((prev) => {
      const src = [...prev[ac]]
      const dst = [...prev[oc]]
      const si = src.findIndex((t) => t.id === active.id)
      if (si < 0) return prev
      const [moved] = src.splice(si, 1)
      if (oc === 'priorities' && dst.length >= MAX_PRIORITIES) return prev
      const oi = dst.findIndex((t) => t.id === over.id)
      dst.splice(oi >= 0 ? oi : dst.length, 0, moved)
      return { priorities: ac === 'priorities' ? src : dst, backlog: ac === 'backlog' ? src : dst }
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
    if (!over || active.id === over.id) return
    const ac = findContainer(active.id)
    const oc = findContainer(over.id)
    if (!ac || !oc) return

    if (ac !== oc) {
      setState((prev) => {
        const src = [...prev[ac]]
        const dst = [...prev[oc]]
        const si = src.findIndex((t) => t.id === active.id)
        if (si < 0) return prev
        if (oc === 'priorities' && dst.length >= MAX_PRIORITIES) return prev
        const [moved] = src.splice(si, 1)
        dst.push(moved)
        return { priorities: ac === 'priorities' ? src : dst, backlog: ac === 'backlog' ? src : dst }
      })
      return
    }

    setState((prev) => {
      const items = prev[ac]
      const oi = items.findIndex((t) => t.id === active.id)
      const ni = items.findIndex((t) => t.id === over.id)
      if (oi < 0 || ni < 0 || oi === ni) return prev
      return { ...prev, [ac]: arrayMove(items, oi, ni) }
    })
  }

  function addTask() {
    const text = newTaskText.trim()
    if (!text) return
    setState((prev) => ({
      ...prev,
      backlog: [...prev.backlog, { id: generateId(), text, createdAt: Date.now() }],
    }))
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
      const up = (list: Task[]) => list.map((t) => t.id === id ? { ...t, description } : t)
      return { priorities: up(prev.priorities), backlog: up(prev.backlog) }
    })
  }

  const selectedTask = selectedTaskId
    ? [...state.priorities, ...state.backlog].find((t) => t.id === selectedTaskId) ?? null
    : null

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const prioritiesCount = state.priorities.length
  const atCap = prioritiesCount >= MAX_PRIORITIES

  return (
    <div className="min-h-screen bg-cream font-sans">

      {/* ── Header ── */}
      <header className="px-5 pt-8 pb-5">
        <div className="max-w-lg mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-2xl font-bold text-ink tracking-tight">priori</span>
              <span className="w-2 h-2 rounded-full bg-clay mt-1" />
            </div>
            <p className="text-mist text-xs font-medium">{today}</p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-mist mb-0.5">Focus</p>
            <p className={`text-2xl font-bold leading-none ${atCap ? 'text-clay' : 'text-ink'}`}>
              {prioritiesCount}<span className="text-fog text-lg font-medium">/{MAX_PRIORITIES}</span>
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-12">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* ── Today's Focus ── */}
          <section className="mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-clay" />
              <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-clay">
                Today's Focus
              </h2>
            </div>

            <DroppableContainer id="priorities" className="min-h-[72px]">
              <SortableContext items={state.priorities.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {state.priorities.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-clay/20 bg-clay/5 py-8 text-center">
                    <p className="text-sm text-mist">Hold & drag tasks here from below</p>
                  </div>
                ) : (
                  state.priorities.map((task, i) => (
                    <TaskCard key={task.id} task={task} rank={i + 1} onDelete={deleteTask} onOpen={setSelectedTaskId} />
                  ))
                )}
              </SortableContext>
            </DroppableContainer>
          </section>

          {/* ── The Line ── */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-line" />
            <div className="px-4 py-1.5 rounded-full bg-card border border-line shadow-soft">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-mist select-none">
                the line
              </span>
            </div>
            <div className="flex-1 h-px bg-line" />
          </div>

          {/* ── Everything Else ── */}
          <section className="mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-fog" />
              <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-mist">
                Everything Else
              </h2>
            </div>

            <DroppableContainer id="backlog" className="min-h-[72px]">
              <SortableContext items={state.backlog.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {state.backlog.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-line py-8 text-center">
                    <p className="text-sm text-mist">
                      {state.priorities.length > 0 ? "Fully focused — nothing else queued" : 'Add tasks below'}
                    </p>
                  </div>
                ) : (
                  state.backlog.map((task) => (
                    <TaskCard key={task.id} task={task} onDelete={deleteTask} onOpen={setSelectedTaskId} />
                  ))
                )}
              </SortableContext>
            </DroppableContainer>
          </section>

          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div className="bg-card rounded-2xl px-4 py-4 text-sm font-semibold text-ink shadow-overlay rotate-1 opacity-95">
                {activeTask.text}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* ── Add Task ── */}
        <div className="mt-6 flex gap-2.5">
          <input
            ref={inputRef}
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="New task..."
            className="flex-1 px-4 py-3.5 rounded-2xl border border-line bg-card text-sm text-ink placeholder-fog focus:outline-none focus:ring-2 focus:ring-clay focus:border-transparent shadow-soft"
          />
          <button
            onClick={addTask}
            disabled={!newTaskText.trim()}
            className="px-5 py-3.5 bg-clay hover:bg-ember active:scale-95 disabled:bg-line disabled:text-fog disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm transition-all shadow-soft flex items-center gap-1.5"
          >
            <Plus size={16} strokeWidth={3} />
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
