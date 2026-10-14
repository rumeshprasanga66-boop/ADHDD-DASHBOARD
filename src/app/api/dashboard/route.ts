import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const [incomes, expenses, appointments, medications, foodItems, workoutPlans, sessions, routineTasks, routineLogs] =
    await Promise.all([
      db.income.findMany({ where: { month } }),
      db.expense.findMany({ where: { month } }),
      db.appointment.findMany({ orderBy: { date: 'asc' } }),
      db.medication.findMany({ where: { month } }),
      db.foodItem.findMany(),
      db.workoutPlan.findMany({ include: { exercises: true } }),
      db.workoutSession.findMany({ orderBy: { date: 'desc' }, take: 10 }),
      db.routineTask.findMany({ orderBy: { order: 'asc' } }),
      db.routineLog.findMany({ where: { date: today } }),
    ])

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const balance = totalIncome - totalExpenses
  const savingsTarget = totalIncome * 0.15
  const savingsActual = expenses.find((e) => e.category === 'savings')?.amount || 0

  // Next appointment
  const upcoming = appointments
    .filter((a) => new Date(a.date) >= now && !a.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  // Food totals
  const freezerItems = foodItems.filter((f) => f.location === 'freezer')
  const totalCalories = foodItems.reduce(
    (s, f) => s + f.calories * (f.unit === 'kg' ? f.stock * 10 : f.stock),
    0
  )
  const totalFoodValue = foodItems.reduce(
    (s, f) => s + f.price * (f.unit === 'kg' ? f.stock : f.stock / f.quantity || f.stock),
    0
  )

  // Workout progress
  const totalExercises = workoutPlans.reduce((s, p) => s + p.exercises.length, 0)
  const completedExercises = workoutPlans.reduce(
    (s, p) => s + p.exercises.filter((e) => e.completed).length,
    0
  )

  // Routine progress for today (default to work day if no log exists yet today)
  const doneToday = routineLogs.filter((l) => l.done).length
  const logMap = new Map(routineLogs.map((l) => [l.taskId, l]))
  // Pick the day type that has more tasks (work: 7, off: 24). If no logs, infer from weekday.
  const isWeekend = now.getDay() === 0 || now.getDay() === 6
  const todayDayType = isWeekend ? 'off' : 'work'
  const todayTasks = routineTasks.filter((t) => t.dayType === todayDayType)
  const todayDone = todayTasks.filter((t) => logMap.get(t.id)?.done).length

  return NextResponse.json({
    month,
    income: totalIncome,
    expenses: totalExpenses,
    balance,
    savingsTarget,
    savingsActual,
    savingsPercent: savingsTarget > 0 ? Math.min(100, (savingsActual / savingsTarget) * 100) : 0,
    nextAppointment: upcoming,
    appointmentsCount: appointments.length,
    completedAppointments: appointments.filter((a) => a.completed).length,
    medication: medications[0] || null,
    foodItems: foodItems.length,
    freezerItems: freezerItems.length,
    totalCalories: Math.round(totalCalories),
    totalFoodValue: Math.round(totalFoodValue),
    totalExercises,
    completedExercises,
    workoutPlans: workoutPlans.length,
    sessionsCount: sessions.length,
    completedSessions: sessions.filter((s) => s.completed).length,
    routine: {
      todayDayType,
      workTasks: routineTasks.filter((t) => t.dayType === 'work').length,
      offTasks: routineTasks.filter((t) => t.dayType === 'off').length,
      todayTasks: todayTasks.length,
      todayDone,
      todayProgress: todayTasks.length > 0 ? (todayDone / todayTasks.length) * 100 : 0,
    },
  })
}
