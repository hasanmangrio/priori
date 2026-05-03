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

function DroppableContainer({ id, children, className }: {
  id: ContainerId; children: React.ReactNode; className?: string
}) {
  const { setNodeRef } = useDroppable({ id })
  return <div ref={setNodeRef} className={className}>{children}</div>
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { priorities: [], backlog: [] }
  } catch { return { priorities: [], backlog: [] } }
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [newTaskText, setNewTaskText] = useState('')
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const stateRef = useRef(state)
  useLayoutEffect(() => { stateRef.current = state })
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }, [state])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
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
    const c = findContainer(active.id)
    if (!c) return
    setActiveTask(stateRef.current[c].find((t) => t.id === active.id) ?? null)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return
    const ac = findContainer(active.id), oc = findContainer(over.id)
    if (!ac || !oc || ac === oc) return
    setState((prev) => {
      const src = [...prev[ac]], dst = [...prev[oc]]
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
    const ac = findContainer(active.id), oc = findContainer(over.id)
    if (!ac || !oc) return
    if (ac !== oc) {
      setState((prev) => {
        const src = [...prev[ac]], dst = [...prev[oc]]
        const si = src.findIndex((t) => t.id === active.id)
        if (si < 0 || (oc === 'priorities' && dst.length >= MAX_PRIORITIES)) return prev
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
    setState((prev) => ({ ...prev, backlog: [...prev.backlog, { id: generateId(), text, createdAt: Date.now() }] }))
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

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const prioritiesCount = state.priorities.length
  const atCap = prioritiesCount >= MAX_PRIORITIES

  return (
    // ── Periwinkle outer shell ──
    <div
      className="min-h-screen flex items-start justify-center p-4 sm:p-8 font-sans"
      style={{ background: 'linear-gradient(145deg, #8E9BD4 0%, #A8AEDE 50%, #C0B8E4 100%)' }}
    >
      {/* ── App window ── */}
      <div
        className="w-full max-w-xl rounded-app shadow-app overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #FFFFFF 0%, #F9F8FF 55%, #FFF7F5 100%)' }}
      >
        {/* ── Header ── */}
        <header className="px-7 pt-7 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xl font-bold text-ink tracking-tight">priori</span>
              <span className="w-1.5 h-1.5 rounded-full bg-clay mt-0.5" />
            </div>
            <p className="text-mist text-xs font-medium">{today}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-mist leading-none mb-1">Focus</p>
            <p className={`text-xl font-bold leading-none ${atCap ? 'text-clay' : 'text-ink'}`}>
              {prioritiesCount}<span className="text-fog text-base font-normal">/{MAX_PRIORITIES}</span>
            </p>
          </div>
        </header>

        {/* ── Divider ── */}
        <div className="mx-7 h-px bg-line" />

        <main className="px-7 pt-5 pb-7">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {/* ── Today's Focus ── */}
            <section className="mb-1">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-clay" />
                  <h2 className="text-[10px] font-bold tracking-[0.16em] uppercase text-clay">Today's Focus</h2>
                </div>
              </div>

              <DroppableContainer id="priorities" className="min-h-[56px]">
                <SortableContext items={state.priorities.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {state.priorities.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-clay/25 bg-clay/[0.04] py-6 text-center">
                      <p className="text-xs text-mist">Drag your most important tasks here</p>
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
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-line" />
              <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-fog select-none px-1">
                the line
              </span>
              <div className="flex-1 h-px bg-line" />
            </div>

            {/* ── Everything Else ── */}
            <section className="mb-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="w-1 h-1 rounded-full bg-fog" />
                <h2 className="text-[10px] font-bold tracking-[0.16em] uppercase text-mist">Everything Else</h2>
              </div>

              <DroppableContainer id="backlog" className="min-h-[56px]">
                <SortableContext items={state.backlog.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {state.backlog.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-line py-6 text-center">
                      <p className="text-xs text-mist">
                        {state.priorities.length > 0 ? "Fully focused — nothing else queued" : 'Add tasks below to get started'}
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
                <div className="bg-white rounded-xl px-4 py-2.5 text-sm font-semibold text-ink shadow-overlay rotate-1 opacity-95">
                  {activeTask.text}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* ── Add Task ── */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a task to your list..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-line bg-white text-sm text-ink placeholder-fog focus:outline-none focus:ring-2 focus:ring-clay/40 focus:border-clay/30 shadow-soft transition-shadow"
            />
            <button
              onClick={addTask}
              disabled={!newTaskText.trim()}
              className="px-4 py-2.5 bg-clay hover:bg-ember active:scale-95 disabled:bg-line disabled:text-fog disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-soft flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus size={14} strokeWidth={2.5} />
              Add
            </button>
          </div>
        </main>
      </div>

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
