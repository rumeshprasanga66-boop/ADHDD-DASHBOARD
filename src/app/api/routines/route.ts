import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || todayStr()
  const tasks = await db.routineTask.findMany({ orderBy: { order: 'asc' } })
  const logs = await db.routineLog.findMany({ where: { date } })
  return NextResponse.json({ date, tasks, logs })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { taskId, date, done } = body
  const d = date || todayStr()

  // upsert the log
  const existing = await db.routineLog.findUnique({
    where: { taskId_date: { taskId, date: d } },
  })

  let log
  if (existing) {
    log = await db.routineLog.update({
      where: { id: existing.id },
      data: { done: done ?? !existing.done },
    })
  } else {
    log = await db.routineLog.create({
      data: { taskId, date: d, done: done ?? true },
    })
  }
  return NextResponse.json(log)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const task = await db.routineTask.create({
    data: {
      dayType: body.dayType || 'work',
      block: body.block || 'morning',
      time: body.time || '08:00',
      title: body.title,
      category: body.category || 'other',
      order: body.order ?? 99,
    },
  })
  return NextResponse.json(task)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await db.routineTask.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
