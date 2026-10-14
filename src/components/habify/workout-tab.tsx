'use client'

import { useState, useEffect } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import { toast } from 'sonner'
import {
  Dumbbell,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Timer,
  Weight,
  Flame,
  Brain,
  Clock,
  Calendar,
  Zap,
  Target,
  HeartPulse,
} from 'lucide-react'

interface Exercise {
  id: string
  workoutId: string
  name: string
  sets: number
  reps: string
  restSec: number
  weight: string | null
  notes: string | null
  order: number
  completed: boolean
}
interface WorkoutPlan {
  id: string
  day: number
  dayName: string
  focus: string
  exercises: Exercise[]
}
interface WorkoutSession {
  id: string
  dayName: string
  date: string
  completed: boolean
  notes: string | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const FOCUS_META: Record<string, { gradient: string; icon: typeof Dumbbell; emoji: string }> = {
  Chest: { gradient: 'from-chart-4/90 to-chart-4/60', icon: Dumbbell, emoji: '💪' },
  Back: { gradient: 'from-chart-3/90 to-chart-3/60', icon: Dumbbell, emoji: '🔙' },
  Legs: { gradient: 'from-chart-2/90 to-chart-2/60', icon: Dumbbell, emoji: '🦵' },
}

export function WorkoutTab() {
  const { data, mutate } = useSWR<{ plans: WorkoutPlan[]; sessions: WorkoutSession[] }>(
    '/api/workouts',
    fetcher
  )
  const [activeDay, setActiveDay] = useState('1')
  const [restTimer, setRestTimer] = useState<{ remaining: number; total: number } | null>(null)
  const [addExOpen, setAddExOpen] = useState(false)

  const refresh = async () => {
    await mutate()
    await globalMutate('/api/dashboard')
  }

  const plans = data?.plans || []
  const sessions = data?.sessions || []

  const currentPlan = plans.find((p) => String(p.day) === activeDay) || plans[0]
  const completedExercises = currentPlan?.exercises.filter((e) => e.completed).length || 0
  const totalExercises = currentPlan?.exercises.length || 0
  const planProgress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0

  // Rest timer effect
  useEffect(() => {
    if (!restTimer || restTimer.remaining <= 0) return
    const t = setInterval(() => {
      setRestTimer((prev) => {
        if (!prev) return null
        if (prev.remaining <= 1) return null
        return { ...prev, remaining: prev.remaining - 1 }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [restTimer?.remaining > 0])

  async function toggleExercise(ex: Exercise) {
    await fetch('/api/workouts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'exercise', id: ex.id, completed: !ex.completed }),
    })
    refresh()
  }

  async function deleteExercise(id: string) {
    await fetch('/api/workouts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'exercise', id }),
    })
    toast.success('Exercise removed')
    refresh()
  }

  async function logSession(plan: WorkoutPlan) {
    await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'session',
        dayName: plan.dayName,
        date: new Date().toISOString(),
        completed: true,
      }),
    })
    toast.success(`${plan.focus} session logged ✓`)
    refresh()
  }

  async function completeSession(session: WorkoutSession) {
    await fetch('/api/workouts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'session', id: session.id, completed: !session.completed }),
    })
    refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Dumbbell className="size-5 text-chart-3" /> Workout Plan
          </h2>
          <p className="text-sm text-muted-foreground">
            3-day split · weight gainer for ADHD · structure wins
          </p>
        </div>
      </div>

      {/* ADHD training principles banner */}
      <Card className="overflow-hidden rounded-3xl border-none bg-gradient-to-br from-primary/10 via-accent/10 to-chart-4/10">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
              <Brain className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">ADHD-friendly training principles</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { icon: Target, label: 'Clear sets & reps' },
                  { icon: Timer, label: 'Timed rest' },
                  { icon: Zap, label: 'Short intense sessions' },
                  { icon: Calendar, label: 'Same 3 days/week' },
                ].map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                    <p.icon className="size-3" /> {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day tabs */}
      {plans.length > 0 && (
        <Tabs value={activeDay} onValueChange={setActiveDay}>
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl bg-muted/40 p-1.5">
            {plans.map((plan) => {
              const meta = FOCUS_META[plan.focus] || FOCUS_META.Chest
              const done = plan.exercises.filter((e) => e.completed).length
              return (
                <TabsTrigger
                  key={plan.day}
                  value={String(plan.day)}
                  className="flex-col items-stretch gap-0.5 rounded-xl py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="text-xs font-semibold">{plan.focus}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {done}/{plan.exercises.length}
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {plans.map((plan) => (
            <TabsContent key={plan.day} value={String(plan.day)} className="mt-4">
              <DayContent
                plan={plan}
                onToggle={toggleExercise}
                onDelete={deleteExercise}
                onLog={() => logSession(plan)}
                onAddExercise={() => setAddExOpen(true)}
                restTimer={restTimer}
                setRestTimer={setRestTimer}
                addExOpen={addExOpen}
                setAddExOpen={setAddExOpen}
                onDone={refresh}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Recent sessions */}
      <Card className="rounded-3xl border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="size-4 text-primary" /> Recent Sessions
          </CardTitle>
          <CardDescription>{sessions.length} logged · {sessions.filter((s) => s.completed).length} completed</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No sessions logged yet. Finish a workout to log it.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sessions.slice(0, 12).map((s) => (
                <button
                  key={s.id}
                  onClick={() => completeSession(s)}
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs transition-colors ${
                    s.completed
                      ? 'border-chart-3/40 bg-chart-3/10'
                      : 'border-border/60 bg-muted/30'
                  }`}
                >
                  {s.completed ? <CheckCircle2 className="size-3.5 text-chart-3" /> : <Circle className="size-3.5 text-muted-foreground" />}
                  <span className="font-medium">{s.dayName.replace('Day ', '').split(' ')[0]}</span>
                  <span className="text-muted-foreground">
                    {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DayContent({
  plan,
  onToggle,
  onDelete,
  onLog,
  onAddExercise,
  restTimer,
  setRestTimer,
  addExOpen,
  setAddExOpen,
  onDone,
}: {
  plan: WorkoutPlan
  onToggle: (e: Exercise) => void
  onDelete: (id: string) => void
  onLog: () => void
  onAddExercise: () => void
  restTimer: { remaining: number; total: number } | null
  setRestTimer: (v: { remaining: number; total: number } | null) => void
  addExOpen: boolean
  setAddExOpen: (v: boolean) => void
  onDone: () => void
}) {
  const meta = FOCUS_META[plan.focus] || FOCUS_META.Chest
  const completed = plan.exercises.filter((e) => e.completed).length
  const total = plan.exercises.length
  const progress = total > 0 ? (completed / total) * 100 : 0
  const totalSets = plan.exercises.reduce((s, e) => s + e.sets, 0)
  const estTime = Math.round(plan.exercises.reduce((s, e) => s + e.sets * (e.restSec + 45), 0) / 60)

  return (
    <div className="space-y-4">
      {/* Day header card */}
      <Card className={`relative overflow-hidden rounded-3xl border-none bg-gradient-to-br ${meta.gradient} text-primary-foreground shadow-lg`}>
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-white/10 blur-2xl" />
        <CardContent className="relative p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-foreground/80">{plan.dayName}</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
                <span className="text-3xl">{meta.emoji}</span> {plan.focus} Day
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-primary-foreground/90">
                <span className="flex items-center gap-1"><Weight className="size-3" /> {totalSets} sets</span>
                <span className="flex items-center gap-1"><Clock className="size-3" /> ~{estTime} min</span>
                <span className="flex items-center gap-1"><Flame className="size-3" /> {total} exercises</span>
              </div>
            </div>
            <ProgressRing
              value={progress}
              size={84}
              strokeWidth={8}
              label={`${completed}/${total}`}
              sublabel="done"
              color="white"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={onLog}
              variant="secondary"
              className="rounded-xl bg-white/20 text-primary-foreground hover:bg-white/30"
            >
              <CheckCircle2 className="size-4" /> Log Session
            </Button>
            <Button
              onClick={onAddExercise}
              variant="secondary"
              className="rounded-xl bg-white/15 text-primary-foreground hover:bg-white/25"
            >
              <Plus className="size-4" /> Exercise
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rest timer */}
      {restTimer && (
        <Card className="rounded-3xl border-chart-4/40 bg-chart-4/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Timer className="size-5 text-chart-4" />
              <div>
                <p className="text-sm font-medium">Rest timer</p>
                <p className="text-xs text-muted-foreground">
                  {Math.floor(restTimer.remaining / 60)}:{String(restTimer.remaining % 60).padStart(2, '0')} remaining
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ProgressRing
                value={restTimer.total > 0 ? (restTimer.remaining / restTimer.total) * 100 : 0}
                size={48}
                strokeWidth={5}
                color="var(--chart-4)"
              />
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setRestTimer(null)}>
                Stop
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercises list */}
      <div className="space-y-2">
        {plan.exercises
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((ex, idx) => (
            <ExerciseCard
              key={ex.id}
              ex={ex}
              index={idx}
              onToggle={() => onToggle(ex)}
              onDelete={() => onDelete(ex.id)}
              onStartRest={(sec) => setRestTimer({ remaining: sec, total: sec })}
            />
          ))}
        {plan.exercises.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            No exercises yet. Add the first one.
          </div>
        )}
      </div>

      <AddExerciseDialog
        open={addExOpen}
        onOpenChange={setAddExOpen}
        workoutId={plan.id}
        order={plan.exercises.length}
        onDone={onDone}
      />
    </div>
  )
}

function ExerciseCard({
  ex,
  index,
  onToggle,
  onDelete,
  onStartRest,
}: {
  ex: Exercise
  index: number
  onToggle: () => void
  onDelete: () => void
  onStartRest: (sec: number) => void
}) {
  return (
    <Card
      className={`rounded-3xl transition-colors ${
        ex.completed ? 'border-chart-3/40 bg-chart-3/5' : 'border-border/60 bg-card'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button onClick={onToggle} className="mt-0.5">
            {ex.completed ? (
              <CheckCircle2 className="size-6 text-chart-3" />
            ) : (
              <Circle className="size-6 text-muted-foreground" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  <span className={ex.completed ? 'line-through opacity-60' : ''}>{ex.name}</span>
                </p>
                {ex.notes && <p className="mt-0.5 text-xs text-muted-foreground">{ex.notes}</p>}
              </div>
              <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-lg text-destructive" onClick={onDelete}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full gap-1">
                <Weight className="size-3" /> {ex.sets} sets
              </Badge>
              <Badge variant="secondary" className="rounded-full gap-1">
                <Target className="size-3" /> {ex.reps} reps
              </Badge>
              {ex.weight && (
                <Badge variant="outline" className="rounded-full gap-1">
                  <Dumbbell className="size-3" /> {ex.weight}
                </Badge>
              )}
              <button
                onClick={() => onStartRest(ex.restSec)}
                className="inline-flex items-center gap-1 rounded-full bg-chart-4/10 px-2.5 py-0.5 text-xs font-medium text-chart-4 transition-colors hover:bg-chart-4/20"
              >
                <Timer className="size-3" /> {ex.restSec}s rest
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AddExerciseDialog({
  open,
  onOpenChange,
  workoutId,
  order,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  workoutId: string
  order: number
  onDone: () => void
}) {
  const [name, setName] = useState('')
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('8-12')
  const [restSec, setRestSec] = useState('90')
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')

  async function submit() {
    if (!name) {
      toast.error('Exercise name is required')
      return
    }
    await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'exercise',
        workoutId,
        name,
        sets: Number(sets),
        reps,
        restSec: Number(restSec),
        weight: weight || null,
        notes: notes || null,
        order: order + 1,
      }),
    })
    toast.success('Exercise added')
    setName('')
    setWeight('')
    setNotes('')
    onOpenChange(false)
    onDone()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Exercise name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bench Press" className="rounded-xl" autoFocus />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Sets</Label>
              <Input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Reps</Label>
              <Input value={reps} onChange={(e) => setReps(e.target.value)} placeholder="8-12" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Rest (s)</Label>
              <Input type="number" value={restSec} onChange={(e) => setRestSec(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Suggested weight</Label>
            <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 60kg" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Form cues..." className="rounded-xl" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" className="rounded-xl">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} className="rounded-xl">Add Exercise</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
