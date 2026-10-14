import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const items = await db.foodItem.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const item = await db.foodItem.create({
    data: {
      name: body.name,
      category: body.category || 'other',
      price: Number(body.price) || 0,
      quantity: Number(body.quantity) || 0,
      unit: body.unit || 'buc',
      stock: (body.stock !== undefined ? Number(body.stock) : Number(body.quantity)) || 0,
      stockUnit: body.stockUnit || body.unit || 'buc',
      calories: Number(body.calories) || 0,
      location: body.location || 'pantry',
    },
  })
  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body
  const updated = await db.foodItem.update({
    where: { id },
    data: {
      ...(rest.name !== undefined && { name: rest.name }),
      ...(rest.category !== undefined && { category: rest.category }),
      ...(rest.price !== undefined && { price: Number(rest.price) }),
      ...(rest.quantity !== undefined && { quantity: Number(rest.quantity) }),
      ...(rest.unit !== undefined && { unit: rest.unit }),
      ...(rest.stock !== undefined && { stock: Number(rest.stock) }),
      ...(rest.stockUnit !== undefined && { stockUnit: rest.stockUnit }),
      ...(rest.calories !== undefined && { calories: Number(rest.calories) }),
      ...(rest.location !== undefined && { location: rest.location }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await db.foodItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
