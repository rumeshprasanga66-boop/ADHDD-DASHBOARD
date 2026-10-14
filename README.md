# Habify — Personal Balance System

A calm, all-in-one personal management app for budget planning, ADHD appointments, food tracking, daily routines, and workout planning — built for an ADHD-friendly workflow with a 2-work / 2-off day cycle.

Built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma (SQLite), SWR, and Framer Motion.

## Features

### 🏠 Dashboard
- Monthly balance hero with progress ring
- Live cards: next ADHD appointment, medication, food/freezer status, workout progress, today's routine
- Savings goal tracker (15% of income target)

### 💰 Budget Plan
- Income sources (Al Caminetto Restaurant, Extra Work, Food Money)
- Expense breakdown with categories: rent, board, utilities, data, food, transport, clothes, savings, gym
- Month picker, inline edit, add/remove, percentage bars
- Romanian Lei (RON) currency

### 🧠 ADHD Appointments
- Live countdown timer to next appointment
- Romanian-locale calendar with appointment dots
- Medication tracker (Concerta) with taken toggle
- Appointment cost tracking (500 lei) + medication cost (200 lei)

### 🍎 Food Tracker
- Romania live prices for common foods (chicken, pork, beef, dairy, veg, grains)
- Freezer / Fridge / Pantry stock tracking with quantities (kg, pack, buc, l)
- Calorie counting per item
- Low-stock warnings
- Search + category/location filters

### 📅 Daily Routines
- **Work Day schedule** (7 tasks): wake, clean, cook, push-ups, meditation, go to work
- **Off Day schedule** (24 tasks): morning + daytime + evening & night blocks
- **Right Now** card: live clock + current task + next task with countdown
- Timeline with time pills, category icons, Now/Next badges
- **2-on / 2-off cycle**: routine auto-switches based on the date
- 10-day cycle preview strip (clickable)

### 🏋️ Workout Plan
- 3-day split: Chest · Back · Legs
- Weight-gainer rep ranges (5–12) designed for ADHD
- Rest timer (live countdown, stoppable)
- Exercise completion tracking
- Session logging

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **Database**: Prisma ORM + SQLite
- **Data fetching**: SWR
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Theme**: next-themes (light/dark)
- **Toasts**: Sonner

## Getting Started

### Prerequisites
- Node.js 18+ / Bun
- A SQLite-compatible environment

### Installation

```bash
# Install dependencies
bun install

# Copy env file and set your database URL
cp .env.example .env

# Push database schema
bun run db:push

# Seed default data (income, expenses, food, workouts, routines)
bun run scripts/seed.ts
bun run scripts/seed-routines.ts

# Start dev server
bun run dev
```

Open `http://localhost:3000` in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server on port 3000 |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run build` | Production build |
| `bun run scripts/seed.ts` | Seed budget/food/workout/appointment data |
| `bun run scripts/seed-routines.ts` | Seed Work/Off day routine schedules |

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (budget, appointments, food, workouts, routines, dashboard)
│   ├── globals.css    # Calm lavender/blue/white theme
│   ├── layout.tsx
│   └── page.tsx       # Main tabbed app
├── components/
│   ├── habify/        # Feature components (dashboard, budget-tab, etc.)
│   └── ui/            # shadcn/ui components
└── lib/
    ├── db.ts          # Prisma client
    ├── format.ts      # Currency/date helpers
    └── routine-cycle.ts  # 2-work/2-off day cycle logic
prisma/
└── schema.prisma      # 8 models: Income, Expense, Appointment, Medication, FoodItem, WorkoutPlan, Exercise, RoutineTask, RoutineLog
scripts/
├── seed.ts            # Default data seed
└── seed-routines.ts   # Routine schedule seed
```

## License

Personal project.
