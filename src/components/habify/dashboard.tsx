'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ProgressRing } from './progress-ring'
import { fmtLei, fmtDateTime, timeUntil } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet, CalendarHeart, Apple, Dumbbell, TrendingUp, TrendingDown, Pill, Snowflake, Flame, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardData {
  month: string
  income: number
  expenses: number
  balance: number
  savingsTarget: number
  savingsActual: number
  savingsPercent: number
  nextAppointment: { id: string; title: string; date: string; cost: number; location: string | null } | null
  appointmentsCount: number
  completedAppointments: number
  medication: { id: string; name: string; dosage: string; cost: number; taken: boolean } | null
  foodItems: number
  freezerItems: number
  totalCalories: number
  totalFoodValue: number
  totalExercises: number
  completedExercises: number
  workoutPlans: number
  sessionsCount: number
  completedSessions: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function Dashboard({ onNavigate }: { onNavigate: (t: 'budget' | 'appointments' | 'food' | 'workout') => void }) {
  const { data, isLoading } = useSWR<DashboardData>('/api/dashboard', fetcher, { refreshInterval: 30000 })

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-3xl" />
        ))}
      </div>
    )
  }

  const budgetHealth =
    data.income > 0 ? Math.max(0, Math.min(100, (data.balance / data.income) * 100)) : 0
  const apptProgress =
    data.appointmentsCount > 0
      ? (data.completedAppointments / data.appointmentsCount) * 100
      : 0
  const workoutProgress =
    data.totalExercises > 0 ? (data.completedExercises / data.totalExercises) * 100 : 0
  const freezerHealth = Math.min(100, data.freezerItems * 16)

  return (
    <div className="space-y-5">
      {/* Hero balance card */}
      <Card className="relative overflow-hidden rounded-3xl border-none bg-gradient-to-br from-primary/90 via-primary/80 to-accent/80 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 size-52 rounded-full bg-chart-4/20 blur-3xl" />
        <CardContent className="relative p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-primary-foreground/70">
                Monthly Balance
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tight">
                {fmtLei(data.balance)}
              </p>
              <p className="mt-1 text-sm text-primary-foreground/80">
                {data.balance >= 0 ? 'You are in the green · keep it calm' : 'Spending more than earning'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <ProgressRing
                value={budgetHealth}
                size={84}
                strokeWidth={8}
                label={`${Math.round(budgetHealth)}%`}
                color="white"
              />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Income" value={fmtLei(data.income)} icon={<TrendingUp className="size-3.5" />} tone="up" />
            <Stat label="Expenses" value={fmtLei(data.expenses)} icon={<TrendingDown className="size-3.5" />} tone="down" />
            <Stat label="Savings" value={fmtLei(data.savingsActual)} icon={<Wallet className="size-3.5" />} tone="neutral" />
            <Stat label="Target" value={fmtLei(data.savingsTarget)} icon={<Wallet className="size-3.5" />} tone="neutral" />
          </div>
        </CardContent>
      </Card>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Next appointment */}
        <ActionCard
          title="Next ADHD Appointment"
          icon={<CalendarHeart className="size-4" />}
          accent="from-chart-4/20 to-chart-4/5"
          onClick={() => onNavigate('appointments')}
          footer={
            data.nextAppointment ? (
              <>
                <p className="font-medium text-foreground">{data.nextAppointment.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {fmtDateTime(data.nextAppointment.date)} · {timeUntil(data.nextAppointment.date)}
                </p>
                <p className="mt-1 text-xs font-medium text-primary">{fmtLei(data.nextAppointment.cost)}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming appointment</p>
            )
          }
          ring={
            <ProgressRing
              value={apptProgress}
              size={70}
              strokeWidth={7}
              label={`${data.completedAppointments}/${data.appointmentsCount}`}
              sublabel="done"
            />
          }
        />

        {/* Medication */}
        <ActionCard
          title="Medication"
          icon={<Pill className="size-4" />}
          accent="from-chart-5/20 to-chart-5/5"
          onClick={() => onNavigate('appointments')}
          footer={
            data.medication ? (
              <>
                <p className="font-medium text-foreground">{data.medication.name} {data.medication.dosage}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{fmtLei(data.medication.cost)} / month</p>
                <span
                  className={`mt-1.5 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    data.medication.taken
                      ? 'bg-chart-3/20 text-chart-3'
                      : 'bg-chart-5/20 text-chart-5'
                  }`}
                >
                  {data.medication.taken ? 'Taken today' : 'Pending'}
                </span>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No medication logged</p>
            )
          }
        />

        {/* Food / freezer */}
        <ActionCard
          title="Food & Freezer"
          icon={<Snowflake className="size-4" />}
          accent="from-chart-2/20 to-chart-2/5"
          onClick={() => onNavigate('food')}
          footer={
            <>
              <p className="font-medium text-foreground">{data.foodItems} items tracked</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {data.freezerItems} in freezer · {fmtLei(data.totalFoodValue)} value
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-chart-5">
                <Flame className="size-3" /> ~{data.totalCalories.toLocaleString()} kcal on hand
              </p>
            </>
          }
          ring={
            <ProgressRing
              value={freezerHealth}
              size={70}
              strokeWidth={7}
              label={`${data.freezerItems}`}
              sublabel="frozen"
              color="var(--chart-2)"
            />
          }
        />

        {/* Workout */}
        <ActionCard
          title="Workout Progress"
          icon={<Dumbbell className="size-4" />}
          accent="from-chart-3/20 to-chart-3/5"
          onClick={() => onNavigate('workout')}
          footer={
            <>
              <p className="font-medium text-foreground">{data.workoutPlans} day split</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {data.completedSessions}/{data.sessionsCount} sessions done
              </p>
              <p className="mt-1 text-xs font-medium text-chart-3">
                {data.completedExercises}/{data.totalExercises} exercises completed
              </p>
            </>
          }
          ring={
            <ProgressRing
              value={workoutProgress}
              size={70}
              strokeWidth={7}
              label={`${Math.round(workoutProgress)}%`}
              color="var(--chart-3)"
            />
          }
        />
      </div>

      {/* Savings + month summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-border/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Wallet className="size-4 text-primary" /> Savings Goal
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {data.savingsPercent.toFixed(0)}% of target
              </span>
            </CardTitle>
            <CardDescription>
              Aim for ~15% of income as savings · {fmtLei(data.savingsActual)} / {fmtLei(data.savingsTarget)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <SavingsBar value={data.savingsPercent} />
              <div className="grid grid-cols-3 gap-3 pt-1 text-center">
                <Mini label="Income" value={fmtLei(data.income)} />
                <Mini label="Spent" value={fmtLei(data.expenses)} />
                <Mini label="Left" value={fmtLei(data.balance)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Jump to a section</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <QuickBtn icon={<Wallet className="size-4" />} label="Budget" onClick={() => onNavigate('budget')} />
            <QuickBtn icon={<CalendarHeart className="size-4" />} label="ADHD" onClick={() => onNavigate('appointments')} />
            <QuickBtn icon={<Apple className="size-4" />} label="Food" onClick={() => onNavigate('food')} />
            <QuickBtn icon={<Dumbbell className="size-4" />} label="Workout" onClick={() => onNavigate('workout')} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'up' | 'down' | 'neutral'
}) {
  const color =
    tone === 'up' ? 'text-chart-3' : tone === 'down' ? 'text-chart-5' : 'text-primary-foreground/80'
  return (
    <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
      <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wide ${color}`}>
        {icon} {label}
      </div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}

function ActionCard({
  title,
  icon,
  accent,
  footer,
  ring,
  onClick,
}: {
  title: string
  icon: React.ReactNode
  accent: string
  footer: React.ReactNode
  ring?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Card className={`group relative overflow-hidden rounded-3xl border-border/60 bg-gradient-to-br ${accent} transition-shadow hover:shadow-lg`}>
      <button onClick={onClick} className="block w-full text-left">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              {icon} {title}
            </span>
            <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">{footer}</div>
            {ring}
          </div>
        </CardContent>
      </button>
    </Card>
  )
}

function SavingsBar({ value }: { value: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  )
}

function QuickBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick} className="h-auto flex-col gap-1.5 rounded-2xl py-3 text-xs font-medium">
      {icon}
      {label}
    </Button>
  )
}
