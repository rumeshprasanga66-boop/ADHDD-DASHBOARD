import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get('month') || currentMonth()
  const [incomes, expenses] = await Promise.all([
    db.income.findMany({ where: { month } }),
    db.expense.findMany({ where: { month } }),
  ])
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const balance = totalIncome - totalExpenses
  return NextResponse.json({ month, incomes, expenses, totalIncome, totalExpenses, balance })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type } = body
  const month = body.month || currentMonth()

  if (type === 'income') {
    const income = await db.income.create({
      data: {
        source: body.source,
        amount: Number(body.amount),
        month,
        note: body.note || null,
      },
    })
    return NextResponse.json(income)
  }
  if (type === 'expense') {
    const expense = await db.expense.create({
      data: {
        category: body.category,
        label: body.label,
        amount: Number(body.amount),
        month,
        isFixed: body.isFixed ?? true,
      },
    })
    return NextResponse.json(expense)
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { type, id } = body
  if (type === 'income') {
    const updated = await db.income.update({
      where: { id },
      data: {
        ...(body.source !== undefined && { source: body.source }),
        ...(body.amount !== undefined && { amount: Number(body.amount) }),
        ...(body.note !== undefined && { note: body.note }),
      },
    })
    return NextResponse.json(updated)
  }
  if (type === 'expense') {
    const updated = await db.expense.update({
      where: { id },
      data: {
        ...(body.label !== undefined && { label: body.label }),
        ...(body.amount !== undefined && { amount: Number(body.amount) }),
        ...(body.category !== undefined && { category: body.category }),
      },
    })
    return NextResponse.json(updated)
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const { type, id } = await req.json()
  if (type === 'income') {
    await db.income.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }
  if (type === 'expense') {
    await db.expense.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
