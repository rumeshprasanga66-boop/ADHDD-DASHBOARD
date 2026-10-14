'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, CalendarHeart, Apple, Dumbbell, LayoutDashboard, Moon, Sun, Sparkles, CalendarDays } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Dashboard } from '@/components/habify/dashboard'
import { BudgetTab } from '@/components/habify/budget-tab'
import { AppointmentsTab } from '@/components/habify/appointments-tab'
import { FoodTab } from '@/components/habify/food-tab'
import { WorkoutTab } from '@/components/habify/workout-tab'
import { RoutinesTab } from '@/components/habify/routines-tab'

type TabKey = 'dashboard' | 'budget' | 'appointments' | 'food' | 'workout' | 'routines'

const TABS: { key: TabKey; label: string; icon: typeof Wallet }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'budget', label: 'Budget', icon: Wallet },
  { key: 'appointments', label: 'ADHD', icon: CalendarHeart },
  { key: 'food', label: 'Food', icon: Apple },
  { key: 'workout', label: 'Workout', icon: Dumbbell },
  { key: 'routines', label: 'Routine', icon: CalendarDays },
]

export default function Home() {
  const [tab, setTab] = useState<TabKey>('dashboard')
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  return (
    <div className="app-bg min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/90 to-accent shadow-lg shadow-primary/20">
              <Sparkles className="size-5 text-primary-foreground" />
              <span className="absolute -right-0.5 -top-0.5 flex size-3">
                <span className="absolute inline-flex size-full animate-pulse-soft rounded-full bg-chart-4/70" />
                <span className="relative inline-flex size-3 rounded-full bg-chart-4" />
              </span>
            </div>
            <div className="leading-tight">
              <h1 className="text-lg font-semibold tracking-tight">Habify</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Personal balance — budget · ADHD · food · body
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Tab nav */}
        <div className="mx-auto max-w-7xl px-2 pb-3 sm:px-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-muted/50 p-1.5 scroll-soft">
              {TABS.map(({ key, label, icon: Icon }) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={tab} className="mt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="pb-28 pt-5"
                >
                  {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
                  {tab === 'budget' && <BudgetTab />}
                  {tab === 'appointments' && <AppointmentsTab />}
                  {tab === 'food' && <FoodTab />}
                  {tab === 'workout' && <WorkoutTab />}
                  {tab === 'routines' && <RoutinesTab />}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </header>

      {/* Sticky footer */}
      <footer className="mt-auto border-t border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p className="flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-chart-3" />
            Habify · your calm personal system
          </p>
          <p>Made with care · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}
