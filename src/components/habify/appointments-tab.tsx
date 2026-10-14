'use client'

import { useState, useEffect, useMemo } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { fmtLei, fmtDateTime, fmtTime, fmtDate, timeUntil } from '@/lib/format'
import {
  CalendarHeart,
  Plus,
  Trash2,
  Pencil,
  Pill,
  Clock,
  MapPin,
  Bell,
  CheckCircle2,
  Circle,
  Timer,
  Stethoscope,
} from 'lucide-react'
import { format, isSameDay, isSameMonth } from 'date-fns'
import { ro } from 'date-fns/locale'

interface Appointment {
  id: string
  title: string
  date: string
  duration: number
  cost: number
  location: string | null
  notes: string | null
  completed: boolean
  reminder: boolean
}
interface Medication {
  id: string
  name: string
  dosage: string
  cost: number
  month: string
  taken: boolean
  notes: string | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AppointmentsTab() {
  const { data: appointments = [], mutate } = useSWR<Appointment[]>('/api/appointments', fetcher)
  const { data: medications = [], mutate: mutateMed } = useSWR<Medication[]>('/api/medication', fetcher)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [open, setOpen] = useState(false)

  const refresh = async () => {
    await mutate()
    await mutateMed()
    await globalMutate('/api/dashboard')
  }

  const appointmentDays = useMemo(
    () => appointments.map((a) => new Date(a.date)),
    [appointments]
  )

  const selectedDayAppts = useMemo(
    () =>
      appointments
        .filter((a) => isSameDay(new Date(a.date), selectedDate || new Date()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [appointments, selectedDate]
  )

  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => new Date(a.date) >= new Date() && !a.completed)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [appointments]
  )

  async function toggleComplete(a: Appointment) {
    await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, completed: !a.completed }),
    })
    toast.success(a.completed ? 'Marked as pending' : 'Appointment completed ✓')
    refresh()
  }

  async function deleteAppt(id: string) {
    await fetch('/api/appointments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    toast.success('Appointment removed')
    refresh()
  }

  async function toggleMedTaken(m: Medication) {
    await fetch('/api/medication', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, taken: !m.taken }),
    })
    toast.success(m.taken ? 'Medication marked as not taken' : 'Medication taken ✓')
    refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <CalendarHeart className="size-5 text-chart-4" /> ADHD Appointments
          </h2>
          <p className="text-sm text-muted-foreground">
            Calendar · countdown timer · medication tracker
          </p>
        </div>
        <AddAppointmentDialog open={open} onOpenChange={setOpen} onDone={refresh} defaultDate={selectedDate} />
      </div>

      {/* Countdown hero for next appointment */}
      <CountdownHero next={upcoming[0]} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="rounded-3xl border-border/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarHeart className="size-4 text-primary" /> Appointment Calendar
            </CardTitle>
            <CardDescription>Tap a date · dots mark appointments</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="w-fit">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ro}
                modifiers={{ hasEvent: appointmentDays }}
                modifiersClassNames={{
                  hasEvent: 'relative bg-primary/10 text-primary font-semibold rounded-full',
                }}
                className="rounded-2xl border border-border/50 p-2"
              />
            </div>
            <div className="flex-1">
              <p className="mb-2 text-sm font-medium">
                {selectedDate ? format(selectedDate, 'EEEE, d MMMM', { locale: ro }) : 'No date selected'}
              </p>
              <div className="space-y-2">
                {selectedDayAppts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    No appointments this day.
                    <br />
                    <button
                      className="mt-2 text-xs font-medium text-primary underline-offset-2 hover:underline"
                      onClick={() => setOpen(true)}
                    >
                      + Add one
                    </button>
                  </div>
                ) : (
                  selectedDayAppts.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      a={a}
                      onToggle={() => toggleComplete(a)}
                      onDelete={() => deleteAppt(a.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medication side */}
        <Card className="rounded-3xl border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pill className="size-4 text-chart-5" /> Medication
            </CardTitle>
            <CardDescription>Track your monthly meds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {medications.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No medication logged.</p>
            )}
            {medications.map((m) => (
              <div
                key={m.id}
                className={`rounded-2xl border p-3 transition-colors ${
                  m.taken ? 'border-chart-3/40 bg-chart-3/5' : 'border-border/60 bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-background shadow-sm">
                      <Pill className="size-4 text-chart-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.name} <span className="text-muted-foreground">{m.dosage}</span></p>
                      <p className="text-xs text-muted-foreground">{fmtLei(m.cost)} / month</p>
                    </div>
                  </div>
                  <Switch checked={m.taken} onCheckedChange={() => toggleMedTaken(m)} />
                </div>
                {m.notes && <p className="mt-2 text-xs text-muted-foreground">{m.notes}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming list */}
      <Card className="rounded-3xl border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4 text-primary" /> All Appointments
          </CardTitle>
          <CardDescription>{appointments.length} total · {appointments.filter((a) => a.completed).length} done</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[420px] scroll-soft pr-3">
            <div className="space-y-2">
              {appointments
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((a) => (
                  <AppointmentRow
                    key={a.id}
                    a={a}
                    onToggle={() => toggleComplete(a)}
                    onDelete={() => deleteAppt(a.id)}
                  />
                ))}
              {appointments.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No appointments yet.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function CountdownHero({ next }: { next?: Appointment }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!next) {
    return (
      <Card className="overflow-hidden rounded-3xl border-none bg-gradient-to-br from-muted to-muted/40">
        <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <Stethoscope className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">No upcoming appointment</p>
          <p className="text-xs text-muted-foreground">Plan your next ADHD check-up in the calendar.</p>
        </CardContent>
      </Card>
    )
  }

  const target = new Date(next.date).getTime()
  const diff = Math.max(0, target - now)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return (
    <Card className="relative overflow-hidden rounded-3xl border-none bg-gradient-to-br from-chart-4/90 via-chart-4/70 to-primary/70 text-primary-foreground shadow-xl shadow-chart-4/20">
      <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-3xl" />
      <CardContent className="relative p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary-foreground/80">
              <Timer className="size-3.5" /> Next Appointment
            </div>
            <p className="mt-1 text-xl font-semibold">{next.title}</p>
            <p className="mt-0.5 text-sm text-primary-foreground/80">{fmtDateTime(next.date)}</p>
            {next.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-primary-foreground/70">
                <MapPin className="size-3" /> {next.location}
              </p>
            )}
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium backdrop-blur">
              {fmtLei(next.cost)}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <CountBox value={days} label="days" />
            <CountBox value={hours} label="hrs" />
            <CountBox value={minutes} label="min" />
            <CountBox value={seconds} label="sec" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CountBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[58px] flex-col items-center rounded-2xl bg-white/15 p-2 backdrop-blur">
      <span className="text-2xl font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
      <span className="text-[9px] uppercase tracking-wide text-primary-foreground/70">{label}</span>
    </div>
  )
}

function AppointmentCard({
  a,
  onToggle,
  onDelete,
}: {
  a: Appointment
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`rounded-2xl border p-3 transition-colors ${
        a.completed ? 'border-chart-3/40 bg-chart-3/5 opacity-70' : 'border-border/60 bg-background'
      }`}
    >
      <div className="flex items-start gap-3">
        <button onClick={onToggle} className="mt-0.5">
          {a.completed ? (
            <CheckCircle2 className="size-5 text-chart-3" />
          ) : (
            <Circle className="size-5 text-muted-foreground" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${a.completed ? 'line-through' : ''}`}>{a.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="size-3" /> {fmtTime(a.date)}</span>
            <span>{a.duration} min</span>
            <span className="font-medium text-primary">{fmtLei(a.cost)}</span>
          </div>
          {a.notes && <p className="mt-1 text-xs text-muted-foreground">{a.notes}</p>}
        </div>
        <Button variant="ghost" size="icon" className="size-7 rounded-lg text-destructive" onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function AppointmentRow({
  a,
  onToggle,
  onDelete,
}: {
  a: Appointment
  onToggle: () => void
  onDelete: () => void
}) {
  const isUpcoming = new Date(a.date) >= new Date() && !a.completed
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
        a.completed ? 'border-chart-3/30 bg-chart-3/5 opacity-70' : isUpcoming ? 'border-chart-4/30 bg-chart-4/5' : 'border-border/60 bg-muted/20'
      }`}
    >
      <button onClick={onToggle}>
        {a.completed ? (
          <CheckCircle2 className="size-5 text-chart-3" />
        ) : (
          <Circle className="size-5 text-muted-foreground" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${a.completed ? 'line-through' : ''}`}>{a.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
          <span>{fmtDate(a.date)} · {fmtTime(a.date)}</span>
          {isUpcoming && <span className="font-medium text-chart-4">{timeUntil(a.date)}</span>}
          <span className="font-medium text-primary">{fmtLei(a.cost)}</span>
        </div>
      </div>
      {a.reminder && <Bell className="size-3.5 text-chart-4" />}
      <Button variant="ghost" size="icon" className="size-7 rounded-lg text-destructive" onClick={onDelete}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

function AddAppointmentDialog({
  open,
  onOpenChange,
  onDone,
  defaultDate,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onDone: () => void
  defaultDate?: Date
}) {
  const initDate = defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  const [title, setTitle] = useState('ADHD Specialist Appointment')
  const [date, setDate] = useState(initDate)
  const [time, setTime] = useState('10:00')
  const [duration, setDuration] = useState('60')
  const [cost, setCost] = useState('500')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [reminder, setReminder] = useState(true)

  useEffect(() => {
    if (defaultDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(format(defaultDate, "yyyy-MM-dd"))
    }
  }, [defaultDate])

  async function submit() {
    if (!title || !date || !time) {
      toast.error('Please fill in title, date and time')
      return
    }
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        date: `${date}T${time}:00`,
        duration: Number(duration),
        cost: Number(cost),
        location: location || null,
        notes: notes || null,
        reminder,
      }),
    })
    toast.success('Appointment scheduled ✓')
    setTitle('ADHD Specialist Appointment')
    setCost('500')
    setLocation('')
    setNotes('')
    onOpenChange(false)
    onDone()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <Plus className="size-4" /> New Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl scroll-soft">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <CardDescription>ADHD check-up, therapy, or any appointment</CardDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Cost (lei)</Label>
              <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Clinic / online..." className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What to discuss..." className="rounded-xl" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-chart-4" />
              <span className="text-sm">Reminder</span>
            </div>
            <Switch checked={reminder} onCheckedChange={setReminder} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" className="rounded-xl">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} className="rounded-xl">Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
