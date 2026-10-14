'use client'

import { useState, useMemo } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgressRing } from './progress-ring'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Sun,
  Moon,
  Cloud,
  CheckCircle2,
  Circle,
  Briefcase,
  CalendarDays,
  Plus,
  Trash2,
  Flame,
  Brain,
  Sparkles,
  Dumbbell,
  Utensils,
  Music,
  BookOpen,
  Bed,
  ShowerHead,
  Users,
  Coffee,
  Clock,
} from 'lucide-react'

interface RoutineTask {
  id: string
  dayType: string
  block: string
  time: string
  title: string
  category: string
  order: number
}
interface RoutineLog {
  id: string
  taskId: string
  date: string
  done: boolean
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CATEGORY_META: Record<string, { icon: typeof Sun; color: string; bg: string }> = {
  wake: { icon: Sparkles, color: 'text-chart-4', bg: 'bg-chart-4/15' },
  clean: { icon: ShowerHead, color: 'text-chart-2', bg: 'bg-chart-2/15' },
  cook: { icon: Utensils, color: 'text-chart-5', bg: 'bg-chart-5/15' },
  music: { icon: Music, color: 'text-chart-4', bg: 'bg-chart-4/15' },
  workout: { icon: Dumbbell, color: 'text-chart-3', bg: 'bg-chart-3/15' },
  meditation: { icon: Brain, color: 'text-primary', bg: 'bg-primary/15' },
  work: { icon: Briefcase, color: 'text-chart-2', bg: 'bg-chart-2/15' },
  learn: { icon: BookOpen, color: 'text-chart-4', bg: 'bg-chart-4/15' },
  sleep: { icon: Bed, color: 'text-chart-3', bg: 'bg-chart-3/15' },
  social: { icon: Users, color: 'text-chart-4', bg: 'bg-chart-4/15' },
  hygiene: { icon: ShowerHead, color: 'text-chart-2', bg: 'bg-chart-2/15' },
  other: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
}

const BLOCK_META: Record<string, { label: string; icon: typeof Sun; gradient: string }> = {
  morning: { label: 'Morning', icon: Sun, gradient: 'from-chart-5/90 to-chart-5/60' },
  daytime: { label: 'Daytime', icon: Cloud, gradient: 'from-chart-2/90 to-chart-2/60' },
  evening: { label: 'Evening & Night', icon: Moon, gradient: 'from-chart-4/90 to-chart-4/60' },
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function RoutinesTab() {
  const [dayType, setDayType] = useState<'work' | 'off'>('work')
  const [date, setDate] = useState(todayStr())
  const { data, mutate } = useSWR<{ date: string; tasks: RoutineTask[]; logs: RoutineLog[] }>(
    `/api/routines?date=${date}`,
    fetcher
  )
  const [addOpen, setAddOpen] = useState(false)

  const refresh = async () => {
    await mutate()
    await globalMutate('/api/dashboard')
  }

  const tasks = data?.tasks || []
  const logsArr = data?.logs || []
  const logs = useMemo(() => {
    const m = new Map<string, RoutineLog>()
    for (const l of logsArr) m.set(l.taskId, l)
    return m
  }, [logsArr])

  const dayTasks = useMemo(
    () => tasks.filter((t) => t.dayType === dayType).sort((a, b) => a.order - b.order),
    [tasks, dayType]
  )

  const doneCount = dayTasks.filter((t) => logs.get(t.id)?.done).length
  const total = dayTasks.length
  const progress = total > 0 ? (doneCount / total) * 100 : 0

  // streak: count of today's tasks done across both days? Simpler: today's progress
  const blocks = useMemo(() => {
    const map = new Map<string, RoutineTask[]>()
    for (const t of dayTasks) {
      const arr = map.get(t.block) || []
      arr.push(t)
      map.set(t.block, arr)
    }
    return ['morning', 'daytime', 'evening'].filter((b) => map.has(b)).map((b) => ({ block: b, items: map.get(b)! }))
  }, [dayTasks])

  async function toggleTask(task: RoutineTask) {
    const current = logs.get(task.id)?.done || false
    // optimistic
    await fetch('/api/routines', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task.id, date, done: !current }),
    })
    refresh()
  }

  async function deleteTask(id: string) {
    await fetch('/api/routines', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    toast.success('Task removed')
    refresh()
  }

  async function markAllDone() {
    for (const t of dayTasks) {
      if (!logs.get(t.id)?.done) {
        await fetch('/api/routines', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: t.id, date, done: true }),
        })
      }
    }
    toast.success('All tasks marked done ✓')
    refresh()
  }

  async function resetDay() {
    for (const t of dayTasks) {
      if (logs.get(t.id)?.done) {
        await fetch('/api/routines', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: t.id, date, done: false }),
        })
      }
    }
    toast.success('Day reset')
    refresh()
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <CalendarDays className="size-5 text-primary" /> Daily Routines
          </h2>
          <p className="text-sm text-muted-foreground">
            Structure your day · calm consistency wins for ADHD
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[160px] rounded-xl"
          />
          <Button variant="outline" className="rounded-xl" onClick={resetDay}>
            Reset
          </Button>
          <Button className="rounded-xl" onClick={markAllDone}>
            <CheckCircle2 className="size-4" /> All Done
          </Button>
          <AddTaskDialog open={addOpen} onOpenChange={setAddOpen} dayType={dayType} onDone={refresh} order={dayTasks.length} />
        </div>
      </div>

      {/* Day toggle + progress hero */}
      <Card className="relative overflow-hidden rounded-3xl border-none bg-gradient-to-br from-primary/90 via-primary/80 to-accent/80 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />
        <CardContent className="relative p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-primary-foreground/80">
                {date === todayStr() ? "Today's Plan" : new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
                {dayType === 'work' ? (
                  <><Briefcase className="size-6" /> Work Day Schedule</>
                ) : (
                  <><CalendarDays className="size-6" /> Off Day Schedule</>
                )}
              </p>
              <p className="mt-1 text-sm text-primary-foreground/80">
                {doneCount} of {total} tasks done · {total > 0 ? `${Math.round(progress)}%` : '0%'} complete
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs backdrop-blur">
                  <Flame className="size-3" /> {dayTasks.filter((t) => t.category === 'workout').length} workouts
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs backdrop-blur">
                  <Brain className="size-3" /> {dayTasks.filter((t) => t.category === 'meditation').length} meditations
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs backdrop-blur">
                  <Bed className="size-3" /> {dayTasks.filter((t) => t.category === 'sleep').length} rest
                </span>
              </div>
            </div>
            <ProgressRing
              value={progress}
              size={96}
              strokeWidth={9}
              label={`${doneCount}/${total}`}
              sublabel="done"
              color="white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Day toggle */}
      <Tabs value={dayType} onValueChange={(v) => setDayType(v as 'work' | 'off')}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted/40 p-1.5 sm:max-w-md">
          <TabsTrigger
            value="work"
            className="flex items-center gap-2 rounded-xl py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Briefcase className="size-4" /> Work Day
          </TabsTrigger>
          <TabsTrigger
            value="off"
            className="flex items-center gap-2 rounded-xl py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <CalendarDays className="size-4" /> Off Day
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Timeline */}
      <div className="space-y-4">
        {blocks.map(({ block, items }) => {
          const meta = BLOCK_META[block] || BLOCK_META.morning
          const BlockIcon = meta.icon
          const blockDone = items.filter((t) => logs.get(t.id)?.done).length
          const blockTotal = items.length
          const blockProgress = blockTotal > 0 ? (blockDone / blockTotal) * 100 : 0
          return (
            <Card key={block} className="overflow-hidden rounded-3xl border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className={`flex items-center gap-2 text-base`}>
                    <span className={`flex size-8 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-primary-foreground`}>
                      <BlockIcon className="size-4" />
                    </span>
                    {meta.label}
                    <Badge variant="secondary" className="ml-1 rounded-full">{blockDone}/{blockTotal}</Badge>
                  </CardTitle>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${blockProgress}%` }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-1.5 before:absolute before:left-[27px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border/50">
                  {items.map((task, idx) => (
                    <RoutineRow
                      key={task.id}
                      task={task}
                      done={!!logs.get(task.id)?.done}
                      onToggle={() => toggleTask(task)}
                      onDelete={() => deleteTask(task.id)}
                      isLast={idx === items.length - 1}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {dayTasks.length === 0 && (
          <Card className="rounded-3xl border-dashed border-border/60">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No tasks for this day type yet. Add the first one.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Principle banner */}
      <Card className="overflow-hidden rounded-3xl border-none bg-gradient-to-br from-accent/20 via-primary/10 to-chart-3/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
              <Brain className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Why routines matter for ADHD</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                External structure frees up your brain. Same wake time, same anchors (push-ups, meditation, meals)
                reduce decision fatigue and help medication work consistently. Tick off each task as you go —
                visible progress keeps dopamine flowing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RoutineRow({
  task,
  done,
  onToggle,
  onDelete,
  isLast,
}: {
  task: RoutineTask
  done: boolean
  onToggle: () => void
  onDelete: () => void
  isLast: boolean
}) {
  const meta = CATEGORY_META[task.category] || CATEGORY_META.other
  const Icon = meta.icon
  // compute time-of-day greeting
  const hour = parseInt(task.time.split(':')[0], 10)
  const tod = hour < 12 ? 'AM' : 'PM'

  return (
    <div className={`group relative flex items-start gap-3 rounded-2xl p-2.5 transition-colors hover:bg-muted/40 ${done ? 'opacity-60' : ''}`}>
      {/* time pill */}
      <div className="relative z-10 flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-background shadow-sm">
        <span className="text-sm font-bold tabular-nums leading-none">{task.time}</span>
        <span className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">{tod}</span>
      </div>

      {/* dot on timeline */}
      <div className="absolute left-[78px] top-1/2 hidden -translate-y-1/2 sm:block">
        <div className={`size-2 rounded-full ${done ? 'bg-chart-3' : 'bg-primary/40'}`} />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3 pl-1">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
          <Icon className={`size-4 ${meta.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${done ? 'line-through' : ''}`}>{task.title}</p>
          <Badge variant="outline" className="mt-0.5 rounded-full px-1.5 py-0 text-[9px] capitalize">
            {task.category}
          </Badge>
        </div>
        <button onClick={onToggle} className="shrink-0">
          {done ? (
            <CheckCircle2 className="size-6 text-chart-3 transition-transform hover:scale-110" />
          ) : (
            <Circle className="size-6 text-muted-foreground transition-transform hover:scale-110 hover:text-primary" />
          )}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 rounded-lg text-destructive opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function AddTaskDialog({
  open,
  onOpenChange,
  dayType,
  onDone,
  order,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  dayType: 'work' | 'off'
  onDone: () => void
  order: number
}) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('08:00')
  const [block, setBlock] = useState('morning')
  const [category, setCategory] = useState('other')

  async function submit() {
    if (!title) {
      toast.error('Please add a task title')
      return
    }
    await fetch('/api/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayType, block, time, title, category, order }),
    })
    toast.success('Routine task added')
    setTitle('')
    onOpenChange(false)
    onDone()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl">
          <Plus className="size-4" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add routine task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Task</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 100 Push-ups" className="rounded-xl" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Block</Label>
              <Select value={block} onValueChange={setBlock}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="daytime">Daytime</SelectItem>
                  <SelectItem value="evening">Evening & Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" className="rounded-xl">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} className="rounded-xl">Add Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
