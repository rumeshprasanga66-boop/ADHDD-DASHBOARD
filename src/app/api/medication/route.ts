import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const medications = await db.medication.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(medications)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const now = new Date()
  const month = body.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const med = await db.medication.create({
    data: {
      name: body.name,
      dosage: body.dosage || '',
      cost: Number(body.cost) || 0,
      month,
      taken: body.taken ?? false,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(med)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body
  const updated = await db.medication.update({
    where: { id },
    data: {
      ...(rest.name !== undefined && { name: rest.name }),
      ...(rest.dosage !== undefined && { dosage: rest.dosage }),
      ...(rest.cost !== undefined && { cost: Number(rest.cost) }),
      ...(rest.taken !== undefined && { taken: rest.taken }),
      ...(rest.notes !== undefined && { notes: rest.notes }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await db.medication.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
