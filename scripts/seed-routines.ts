import { db } from '../src/lib/db'

async function main() {
  await db.routineLog.deleteMany()
  await db.routineTask.deleteMany()

  console.log('Seeding Work Day routine...')
  const workTasks = [
    { time: '07:00', title: 'Wake Up', block: 'morning', category: 'wake' },
    { time: '07:30', title: 'Clean room', block: 'morning', category: 'clean' },
    { time: '08:00', title: 'Cook / Eat', block: 'morning', category: 'cook' },
    { time: '08:30', title: 'Iron clothes / Music', block: 'morning', category: 'music' },
    { time: '09:00', title: '100 Push-ups', block: 'morning', category: 'workout' },
    { time: '09:00', title: 'Meditation (9:00–9:30)', block: 'morning', category: 'meditation' },
    { time: '09:45', title: 'Go for work', block: 'morning', category: 'work' },
  ]
  let order = 0
  for (const t of workTasks) {
    await db.routineTask.create({ data: { dayType: 'work', ...t, order: order++ } })
  }

  console.log('Seeding Off Day routine...')
  const offTasks = [
    // Morning
    { time: '07:00', title: 'Wake Up', block: 'morning', category: 'wake' },
    { time: '07:30', title: 'Clean room', block: 'morning', category: 'clean' },
    { time: '08:00', title: 'Cook / Eat', block: 'morning', category: 'cook' },
    { time: '08:30', title: 'Music / Relax', block: 'morning', category: 'music' },
    { time: '09:00', title: 'Push-ups (100–200)', block: 'morning', category: 'workout' },
    { time: '09:30', title: 'Meditation', block: 'morning', category: 'meditation' },
    // Daytime
    { time: '10:00', title: 'Start Trading / Work', block: 'daytime', category: 'work' },
    { time: '10:30', title: 'Go to gym', block: 'daytime', category: 'workout' },
    { time: '12:30', title: 'Lunch', block: 'daytime', category: 'cook' },
    { time: '13:00', title: 'Trading / Journal', block: 'daytime', category: 'work' },
    { time: '14:00', title: 'Learn...', block: 'daytime', category: 'learn' },
    { time: '14:30', title: '100 Push-ups', block: 'daytime', category: 'workout' },
    { time: '15:00', title: 'Sleep / Nap', block: 'daytime', category: 'sleep' },
    { time: '16:00', title: 'Snack / Tea', block: 'daytime', category: 'cook' },
    { time: '16:30', title: 'Wash / Iron', block: 'daytime', category: 'hygiene' },
    { time: '17:00', title: 'Cook Dinner', block: 'daytime', category: 'cook' },
    { time: '17:30', title: 'Go out (5:30–6:00)', block: 'daytime', category: 'social' },
    // Evening & Night
    { time: '19:00', title: 'Music / Learn', block: 'evening', category: 'music' },
    { time: '20:00', title: '100 Push-ups + Dinner', block: 'evening', category: 'workout' },
    { time: '20:30', title: 'Meditation', block: 'evening', category: 'meditation' },
    { time: '21:00', title: 'Research / Journal', block: 'evening', category: 'learn' },
    { time: '21:30', title: 'Read for tomorrow', block: 'evening', category: 'learn' },
    { time: '22:00', title: 'Sleep (Target: 9 hours sleep)', block: 'evening', category: 'sleep' },
    { time: '23:00', title: 'Wash well / Limit screen time / Sleep', block: 'evening', category: 'sleep' },
  ]
  order = 0
  for (const t of offTasks) {
    await db.routineTask.create({ data: { dayType: 'off', ...t, order: order++ } })
  }

  console.log('✅ Routines seeded!')
  console.log(`  Work day: ${workTasks.length} tasks`)
  console.log(`  Off day: ${offTasks.length} tasks`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
