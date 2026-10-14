'use client'

import { useState, useMemo, useEffect } from 'react'
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
  Play,
  ArrowRight,
  Radio,
} from 'lucide-react'
import { getDayTypeForDate, getUpcomingDays } from '@/lib/routine-cycle'

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

// Convert "HH:MM" to minutes since midnight
function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function minToLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Given a sorted list of tasks (by time) and "now" in minutes, return current + next task.
// "Current" = the latest task whose time <= now.
// "Next" = the first task whose time > now.
function findCurrentAndNext(tasks: RoutineTask[], nowMin: number) {
  const sorted = [...tasks].sort((a, b) => timeToMin(a.time) - timeToMin(b.time))
  let current: RoutineTask | null = null
  let next: RoutineTask | null = null
  for (const t of sorted) {
    const tm = timeToMin(t.time)
    if (tm <= nowMin) current = t
    else if (!next) {
      next = t
      break
    }
  }
  // If we've passed all tasks, current = last task, next = null
  if (!current && sorted.length > 0) current = sorted[sorted.length - 1]
  return { current, next }
}

function minutesUntil(targetTime: string, nowMin: number): number {
  return timeToMin(targetTime) - nowMin
}

export function RoutinesTab() {
  const [dayType, setDayType] = useState<'work' | 'off'>(() => getDayTypeForDate(new Date()))
  const [date, setDate] = useState(todayStr())
  const { data, mutate } = useSWR<{ date: string; tasks: RoutineTask[]; logs: RoutineLog[] }>(
    `/api/routines?date=${date}`,
    fetcher
  )
  const [addOpen, setAddOpen] = useState(false)

  // The cycle type for the selected date (what the pattern says it "should" be)
  const cycleDayType = getDayTypeForDate(date)
  const isFollowingCycle = dayType === cycleDayType

  // Auto-sync dayType to the cycle when the date changes
  useEffect(() => {
    setDayType(getDayTypeForDate(date))
  }, [date])

  // Upcoming 10-day cycle preview
  const upcomingDays = useMemo(() => getUpcomingDays(10), [])

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

  // Live clock — updates every 30s
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : 0
  const isToday = date === todayStr()
  const { current: currentTask, next: nextTask } = useMemo(
    () => findCurrentAndNext(dayTasks, nowMin),
    [dayTasks, nowMin]
  )

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

      {/* NOW card — what routine you're in right now */}
      <NowCard
        now={now}
        isToday={isToday}
        dayType={dayType}
        currentTask={currentTask}
        nextTask={nextTask}
        nowMin={nowMin}
        currentDone={currentTask ? !!logs.get(currentTask.id)?.done : false}
        onToggleCurrent={() => currentTask && toggleTask(currentTask)}
      />

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
                {date === todayStr()
                  ? isFollowingCycle
                    ? `Auto-matched your 2-on / 2-off cycle · ${doneCount} of ${total} done`
                    : `Previewing ${dayType} routine · cycle says ${cycleDayType}`
                  : `${doneCount} of ${total} tasks done · ${total > 0 ? `${Math.round(progress)}%` : '0%'} complete`}
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
      <div className="space-y-2">
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              cycleDayType === 'work'
                ? 'bg-chart-2/15 text-chart-2'
                : 'bg-chart-4/15 text-chart-4'
            }`}
          >
            <Sparkles className="size-3" />
            Auto: {cycleDayType === 'work' ? 'Work Day' : 'Off Day'} (2-on / 2-off cycle)
          </span>
          {!isFollowingCycle && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
              Previewing {dayType} (cycle says {cycleDayType})
            </span>
          )}
        </div>
      </div>

      {/* Cycle preview — next 10 days */}
      <Card className="rounded-3xl border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" /> Your Work Cycle
          </CardTitle>
          <CardDescription>2 work days · 2 off days · repeating. Tap a day to view its routine.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto scroll-soft pb-1">
            {upcomingDays.map((d) => {
              const isActive = d.dateStr === date
              const isWork = d.dayType === 'work'
              return (
                <button
                  key={d.dateStr}
                  onClick={() => setDate(d.dateStr)}
                  className={`flex min-w-[64px] shrink-0 flex-col items-center gap-0.5 rounded-2xl border p-2 transition-all hover:shadow-md ${
                    isActive
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border/60'
                  } ${
                    isWork
                      ? 'bg-gradient-to-b from-chart-2/15 to-chart-2/5'
                      : 'bg-gradient-to-b from-chart-4/15 to-chart-4/5'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{d.weekday}</span>
                  <span className={`text-lg font-bold ${d.isToday ? 'text-primary' : ''}`}>{d.dayNum}</span>
                  <span
                    className={`rounded-full px-1.5 py-0 text-[9px] font-medium ${
                      isWork ? 'bg-chart-2/20 text-chart-2' : 'bg-chart-4/20 text-chart-4'
                    }`}
                  >
                    {d.label}
                  </span>
                  {d.isToday && (
                    <span className="text-[8px] font-medium text-primary">Today</span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-chart-2" /> Work Day
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-chart-4" /> Off Day
            </span>
            <span className="ml-auto">Pattern: 2 work → 2 off → repeat</span>
          </div>
        </CardContent>
      </Card>

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
                      isCurrent={isToday && currentTask?.id === task.id}
                      isNext={isToday && nextTask?.id === task.id}
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

function NowCard({
  now,
  isToday,
  dayType,
  currentTask,
  nextTask,
  nowMin,
  currentDone,
  onToggleCurrent,
}: {
  now: Date | null
  isToday: boolean
  dayType: 'work' | 'off'
  currentTask: RoutineTask | null
  nextTask: RoutineTask | null
  nowMin: number
  currentDone: boolean
  onToggleCurrent: () => void
}) {
  const timeStr = now
    ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '--:--'

  const currentMeta = currentTask ? (CATEGORY_META[currentTask.category] || CATEGORY_META.other) : null
  const CurrentIcon = currentMeta?.icon || Clock

  const nextMeta = nextTask ? (CATEGORY_META[nextTask.category] || CATEGORY_META.other) : null
  const NextIcon = nextMeta?.icon || Clock

  const minsToNext = nextTask ? minutesUntil(nextTask.time, nowMin) : null
  const minsSinceCurrent = currentTask ? nowMin - timeToMin(currentTask.time) : null

  return (
    <Card className="relative overflow-hidden rounded-3xl border-none bg-gradient-to-br from-chart-3/90 via-chart-2/80 to-primary/70 text-primary-foreground shadow-xl shadow-chart-2/20">
      <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 size-40 rounded-full bg-chart-4/20 blur-2xl" />
      <CardContent className="relative p-5 sm:p-6">
        {/* Top row: live badge + clock */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-5 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-chart-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-widest text-primary-foreground/80">
              Right Now
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 backdrop-blur">
            <Radio className="size-3.5" />
            <span className="text-lg font-bold tabular-nums">{timeStr}</span>
          </div>
        </div>

        {!isToday ? (
          <div className="mt-5 rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
            <p className="text-sm text-primary-foreground/80">
              Viewing a different day · switch to today to see your live routine.
            </p>
          </div>
        ) : !currentTask ? (
          <div className="mt-5 rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
            <p className="text-sm text-primary-foreground/80">No routine scheduled for this {dayType === 'work' ? 'work' : 'off'} day yet.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* CURRENT */}
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-primary-foreground/70">
                <Play className="size-3" /> In progress now
              </div>
              <div className="mt-2 flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <CurrentIcon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold leading-tight">{currentTask.title}</p>
                  <p className="mt-0.5 text-xs text-primary-foreground/80">
                    Started at {currentTask.time}
                    {minsSinceCurrent !== null && minsSinceCurrent > 0 && (
                      <> · {formatDuration(minsSinceCurrent)} ago</>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onToggleCurrent}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-medium backdrop-blur transition-colors hover:bg-white/30"
              >
                {currentDone ? (
                  <><CheckCircle2 className="size-3.5" /> Done — nice!</>
                ) : (
                  <><Circle className="size-3.5" /> Mark as done</>
                )}
              </button>
            </div>

            {/* NEXT */}
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-primary-foreground/70">
                <ArrowRight className="size-3" /> Up next
              </div>
              {nextTask ? (
                <div className="mt-2 flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <NextIcon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold leading-tight">{nextTask.title}</p>
                    <p className="mt-0.5 text-xs text-primary-foreground/80">
                      At {nextTask.time}
                      {minsToNext !== null && minsToNext > 0 && (
                        <> · in {formatDuration(minsToNext)}</>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Bed className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold leading-tight">Day complete</p>
                    <p className="mt-0.5 text-xs text-primary-foreground/80">Last task was {currentTask.title}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatDuration(mins: number): string {
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function RoutineRow({
  task,
  done,
  isCurrent,
  isNext,
  onToggle,
  onDelete,
  isLast,
}: {
  task: RoutineTask
  done: boolean
  isCurrent?: boolean
  isNext?: boolean
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
    <div
      className={`group relative flex items-start gap-3 rounded-2xl p-2.5 transition-all hover:bg-muted/40 ${
        done ? 'opacity-60' : ''
      } ${isCurrent ? 'ring-2 ring-primary/40 bg-primary/5' : ''} ${
        isNext ? 'ring-1 ring-dashed ring-chart-4/40' : ''
      }`}
    >
      {/* time pill */}
      <div
        className={`relative z-10 flex size-14 shrink-0 flex-col items-center justify-center rounded-xl shadow-sm ${
          isCurrent ? 'bg-primary text-primary-foreground' : 'bg-background'
        }`}
      >
        <span className="text-sm font-bold tabular-nums leading-none">{task.time}</span>
        <span className={`mt-0.5 text-[9px] uppercase tracking-wide ${isCurrent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{tod}</span>
      </div>

      {/* dot on timeline */}
      <div className="absolute left-[78px] top-1/2 hidden -translate-y-1/2 sm:block">
        <div
          className={`size-2 rounded-full ${
            done ? 'bg-chart-3' : isCurrent ? 'bg-primary' : isNext ? 'bg-chart-4' : 'bg-primary/40'
          }`}
        />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3 pl-1">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
          <Icon className={`size-4 ${meta.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={`text-sm font-medium ${done ? 'line-through' : ''}`}>{task.title}</p>
            {isCurrent && (
              <Badge className="rounded-full bg-primary px-1.5 py-0 text-[9px] uppercase tracking-wide">
                Now
              </Badge>
            )}
            {isNext && (
              <Badge variant="outline" className="rounded-full border-chart-4/40 px-1.5 py-0 text-[9px] text-chart-4">
                Next
              </Badge>
            )}
          </div>
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
