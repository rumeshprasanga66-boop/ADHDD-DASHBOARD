import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const month = searchParams.get('month')
  const upcoming = searchParams.get('upcoming')

  if (upcoming === 'true') {
    const now = new Date()
    const appointments = await db.appointment.findMany({
      where: { date: { gte: now } },
      orderBy: { date: 'asc' },
      take: 5,
    })
    return NextResponse.json(appointments)
  }

  const where = month
    ? {
        date: {
          gte: new Date(`${month}-01T00:00:00`),
          lt: new Date(
            new Date(`${month}-01T00:00:00`).getTime() +
              31 * 24 * 60 * 60 * 1000
          ),
        },
      }
    : {}
  const appointments = await db.appointment.findMany({ where, orderBy: { date: 'asc' } })
  return NextResponse.json(appointments)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const appointment = await db.appointment.create({
    data: {
      title: body.title,
      date: new Date(body.date),
      duration: Number(body.duration) || 60,
      cost: Number(body.cost) || 500,
      location: body.location || null,
      notes: body.notes || null,
      reminder: body.reminder ?? true,
    },
  })
  return NextResponse.json(appointment)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body
  const updated = await db.appointment.update({
    where: { id },
    data: {
      ...(rest.title !== undefined && { title: rest.title }),
      ...(rest.date !== undefined && { date: new Date(rest.date) }),
      ...(rest.duration !== undefined && { duration: Number(rest.duration) }),
      ...(rest.cost !== undefined && { cost: Number(rest.cost) }),
      ...(rest.location !== undefined && { location: rest.location }),
      ...(rest.notes !== undefined && { notes: rest.notes }),
      ...(rest.completed !== undefined && { completed: rest.completed }),
      ...(rest.reminder !== undefined && { reminder: rest.reminder }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await db.appointment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
