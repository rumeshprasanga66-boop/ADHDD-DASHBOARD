import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const plans = await db.workoutPlan.findMany({
    include: { exercises: { orderBy: { order: 'asc' } } },
    orderBy: { day: 'asc' },
  })
  const sessions = await db.workoutSession.findMany({ orderBy: { date: 'desc' }, take: 20 })
  return NextResponse.json({ plans, sessions })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (body.kind === 'exercise') {
    const ex = await db.exercise.create({
      data: {
        workoutId: body.workoutId,
        name: body.name,
        sets: Number(body.sets) || 3,
        reps: body.reps || '8-12',
        restSec: Number(body.restSec) || 90,
        weight: body.weight || null,
        notes: body.notes || null,
        order: Number(body.order) || 0,
      },
    })
    return NextResponse.json(ex)
  }
  if (body.kind === 'session') {
    const session = await db.workoutSession.create({
      data: {
        dayName: body.dayName,
        date: new Date(body.date || Date.now()),
        completed: body.completed ?? false,
        notes: body.notes || null,
      },
    })
    return NextResponse.json(session)
  }
  return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (body.kind === 'exercise') {
    const { id, ...rest } = body
    const updated = await db.exercise.update({
      where: { id },
      data: {
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.sets !== undefined && { sets: Number(rest.sets) }),
        ...(rest.reps !== undefined && { reps: rest.reps }),
        ...(rest.restSec !== undefined && { restSec: Number(rest.restSec) }),
        ...(rest.weight !== undefined && { weight: rest.weight }),
        ...(rest.notes !== undefined && { notes: rest.notes }),
        ...(rest.completed !== undefined && { completed: rest.completed }),
      },
    })
    return NextResponse.json(updated)
  }
  if (body.kind === 'session') {
    const { id, ...rest } = body
    const updated = await db.workoutSession.update({
      where: { id },
      data: {
        ...(rest.completed !== undefined && { completed: rest.completed }),
        ...(rest.notes !== undefined && { notes: rest.notes }),
      },
    })
    return NextResponse.json(updated)
  }
  return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  if (body.kind === 'exercise') {
    await db.exercise.delete({ where: { id: body.id } })
    return NextResponse.json({ ok: true })
  }
  if (body.kind === 'session') {
    await db.workoutSession.delete({ where: { id: body.id } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
}
