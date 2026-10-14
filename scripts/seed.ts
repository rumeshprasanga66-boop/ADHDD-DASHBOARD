import { db } from '../src/lib/db'

async function main() {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Clear existing data
  await db.exercise.deleteMany()
  await db.workoutPlan.deleteMany()
  await db.workoutSession.deleteMany()
  await db.foodItem.deleteMany()
  await db.medication.deleteMany()
  await db.appointment.deleteMany()
  await db.expense.deleteMany()
  await db.income.deleteMany()

  console.log('Seeding income sources...')
  await db.income.createMany({
    data: [
      { source: 'Al Caminetto Restaurant', amount: 2500, month, note: 'Monthly salary from restaurant' },
      { source: 'Extra Work', amount: 1000, month, note: 'Freelance / extra shifts' },
      { source: 'Food Money', amount: 400, month, note: 'Food allowance' },
    ],
  })

  console.log('Seeding expenses (defaults)...')
  await db.expense.createMany({
    data: [
      { category: 'rent', label: 'Apartment Rental', amount: 1300, month, isFixed: true },
      { category: 'board', label: 'Down Board Bill', amount: 400, month, isFixed: true },
      { category: 'utilities', label: 'Current & Gas (Electricity + Gas)', amount: 100, month, isFixed: true },
      { category: 'data', label: 'Data / Internet', amount: 100, month, isFixed: true },
      { category: 'food', label: 'Food Money', amount: 0, month, isFixed: false },
      { category: 'transport', label: 'Transport', amount: 100, month, isFixed: true },
      { category: 'clothes', label: 'Clothes', amount: 0, month, isFixed: false },
      { category: 'savings', label: 'Savings', amount: 0, month, isFixed: false },
      { category: 'gym', label: 'Gym Membership', amount: 150, month, isFixed: true },
    ],
  })

  console.log('Seeding ADHD appointments & medication...')
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  nextWeek.setHours(10, 0, 0, 0)
  await db.appointment.create({
    data: {
      title: 'ADHD Specialist Appointment',
      date: nextWeek,
      duration: 60,
      cost: 500,
      location: 'Clinic',
      notes: 'Monthly ADHD check-up & prescription renewal',
      reminder: true,
    },
  })
  await db.medication.create({
    data: {
      name: 'Concerta',
      dosage: '36mg',
      cost: 200,
      month,
      taken: false,
      notes: 'Take once daily in the morning',
    },
  })

  console.log('Seeding food items (Romania live prices)...')
  await db.foodItem.createMany({
    data: [
      { name: 'Chicken Breast', category: 'meat', price: 32, quantity: 2, unit: 'kg', stock: 1.2, stockUnit: 'kg', calories: 165, location: 'freezer' },
      { name: 'Pork Leg', category: 'meat', price: 28, quantity: 1.5, unit: 'kg', stock: 0.8, stockUnit: 'kg', calories: 242, location: 'freezer' },
      { name: 'Minced Beef', category: 'meat', price: 45, quantity: 1, unit: 'kg', stock: 0.5, stockUnit: 'kg', calories: 254, location: 'freezer' },
      { name: 'Frozen Pizza', category: 'frozen', price: 18, quantity: 2, unit: 'pack', stock: 2, stockUnit: 'pack', calories: 280, location: 'freezer' },
      { name: 'Frozen Vegetables Mix', category: 'frozen', price: 12, quantity: 1, unit: 'pack', stock: 1, stockUnit: 'pack', calories: 60, location: 'freezer' },
      { name: 'Fish Fillet (Salau)', category: 'meat', price: 38, quantity: 1, unit: 'kg', stock: 0.6, stockUnit: 'kg', calories: 110, location: 'freezer' },
      { name: 'Milk 3.5%', category: 'dairy', price: 9, quantity: 2, unit: 'l', stock: 1.5, stockUnit: 'l', calories: 61, location: 'fridge' },
      { name: 'Eggs (10 pack)', category: 'dairy', price: 16, quantity: 1, unit: 'pack', stock: 8, stockUnit: 'buc', calories: 78, location: 'fridge' },
      { name: 'Yellow Cheese', category: 'dairy', price: 35, quantity: 0.5, unit: 'kg', stock: 0.3, stockUnit: 'kg', calories: 350, location: 'fridge' },
      { name: 'Yogurt', category: 'dairy', price: 6, quantity: 2, unit: 'pack', stock: 2, stockUnit: 'pack', calories: 90, location: 'fridge' },
      { name: 'Rice (1kg)', category: 'grains', price: 10, quantity: 1, unit: 'kg', stock: 0.8, stockUnit: 'kg', calories: 130, location: 'pantry' },
      { name: 'Pasta (500g)', category: 'grains', price: 7, quantity: 1, unit: 'pack', stock: 1, stockUnit: 'pack', calories: 158, location: 'pantry' },
      { name: 'Potatoes (kg)', category: 'veg', price: 5, quantity: 2, unit: 'kg', stock: 1.5, stockUnit: 'kg', calories: 77, location: 'pantry' },
      { name: 'Onions (kg)', category: 'veg', price: 6, quantity: 1, unit: 'kg', stock: 0.4, stockUnit: 'kg', calories: 40, location: 'pantry' },
      { name: 'Cooking Oil (1L)', category: 'pantry', price: 14, quantity: 1, unit: 'l', stock: 0.7, stockUnit: 'l', calories: 884, location: 'pantry' },
      { name: 'Bread', category: 'grains', price: 5, quantity: 1, unit: 'buc', stock: 1, stockUnit: 'buc', calories: 265, location: 'pantry' },
      { name: 'Bananas (kg)', category: 'fruit', price: 8, quantity: 1, unit: 'kg', stock: 0.6, stockUnit: 'kg', calories: 89, location: 'pantry' },
      { name: 'Apples (kg)', category: 'fruit', price: 7, quantity: 1, unit: 'kg', stock: 0.9, stockUnit: 'kg', calories: 52, location: 'pantry' },
      { name: 'Coffee (250g)', category: 'pantry', price: 25, quantity: 1, unit: 'pack', stock: 1, stockUnit: 'pack', calories: 0, location: 'pantry' },
    ],
  })

  console.log('Seeding workout plans (3-day weight gainer for ADHD)...')
  const chest = await db.workoutPlan.create({
    data: { day: 1, dayName: 'Day 1 — Chest', focus: 'Chest' },
  })
  await db.exercise.createMany({
    data: [
      { workoutId: chest.id, name: 'Barbell Bench Press', sets: 4, reps: '6-8', restSec: 120, weight: '60kg', notes: 'Compound chest builder. Focus on form.', order: 1 },
      { workoutId: chest.id, name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', restSec: 90, weight: '20kg/hand', notes: 'Upper chest emphasis', order: 2 },
      { workoutId: chest.id, name: 'Cable Chest Fly', sets: 3, reps: '12-15', restSec: 75, weight: '15kg', notes: 'Slow controlled stretch', order: 3 },
      { workoutId: chest.id, name: 'Dips (Chest version)', sets: 3, reps: '8-12', restSec: 90, weight: 'Bodyweight', notes: 'Lean forward for chest', order: 4 },
      { workoutId: chest.id, name: 'Push-ups (Burnout)', sets: 2, reps: 'To failure', restSec: 60, weight: 'Bodyweight', notes: 'Finisher for pump', order: 5 },
    ],
  })

  const back = await db.workoutPlan.create({
    data: { day: 2, dayName: 'Day 2 — Back', focus: 'Back' },
  })
  await db.exercise.createMany({
    data: [
      { workoutId: back.id, name: 'Conventional Deadlift', sets: 4, reps: '5', restSec: 180, weight: '80kg', notes: 'King of mass. Brace hard.', order: 1 },
      { workoutId: back.id, name: 'Pull-ups / Lat Pulldown', sets: 3, reps: '8-10', restSec: 90, weight: 'Bodyweight / 50kg', notes: 'Width builder', order: 2 },
      { workoutId: back.id, name: 'Barbell Row', sets: 3, reps: '8-10', restSec: 90, weight: '50kg', notes: 'Thickness. Keep back flat.', order: 3 },
      { workoutId: back.id, name: 'Seated Cable Row', sets: 3, reps: '10-12', restSec: 75, weight: '40kg', notes: 'Squeeze shoulder blades', order: 4 },
      { workoutId: back.id, name: 'Face Pulls', sets: 3, reps: '15-20', restSec: 60, weight: '15kg', notes: 'Rear delts & posture', order: 5 },
    ],
  })

  const legs = await db.workoutPlan.create({
    data: { day: 3, dayName: 'Day 3 — Legs', focus: 'Legs' },
  })
  await db.exercise.createMany({
    data: [
      { workoutId: legs.id, name: 'Barbell Back Squat', sets: 4, reps: '6-8', restSec: 150, weight: '80kg', notes: 'Depth to parallel. Drive through heels.', order: 1 },
      { workoutId: legs.id, name: 'Romanian Deadlift', sets: 3, reps: '8-10', restSec: 90, weight: '60kg', notes: 'Hamstrings & glutes. Hip hinge.', order: 2 },
      { workoutId: legs.id, name: 'Leg Press', sets: 3, reps: '10-12', restSec: 90, weight: '120kg', notes: 'Full range, dont lock knees', order: 3 },
      { workoutId: legs.id, name: 'Walking Lunges', sets: 3, reps: '12/leg', restSec: 75, weight: '20kg dumbbells', notes: 'Unilateral mass', order: 4 },
      { workoutId: legs.id, name: 'Standing Calf Raise', sets: 4, reps: '15-20', restSec: 60, weight: '60kg', notes: 'Full stretch, pause at bottom', order: 5 },
    ],
  })

  console.log('✅ Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
