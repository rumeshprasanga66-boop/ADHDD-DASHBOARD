'use client'

import { useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from './progress-ring'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { fmtLei, currentMonth, monthLabel } from '@/lib/format'
import {
  Plus,
  Trash2,
  Pencil,
  TrendingUp,
  TrendingDown,
  Wallet,
  Home,
  Zap,
  Wifi,
  Bus,
  Shirt,
  PiggyBank,
  Dumbbell,
  Apple,
  Receipt,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface Income {
  id: string
  source: string
  amount: number
  month: string
  note: string | null
}
interface Expense {
  id: string
  category: string
  label: string
  amount: number
  month: string
  isFixed: boolean
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CATEGORY_META: Record<string, { label: string; icon: typeof Home; color: string }> = {
  rent: { label: 'Rent', icon: Home, color: 'text-chart-5' },
  board: { label: 'Board', icon: Receipt, color: 'text-chart-4' },
  utilities: { label: 'Utilities', icon: Zap, color: 'text-chart-5' },
  data: { label: 'Data', icon: Wifi, color: 'text-chart-2' },
  food: { label: 'Food', icon: Apple, color: 'text-chart-3' },
  transport: { label: 'Transport', icon: Bus, color: 'text-chart-2' },
  clothes: { label: 'Clothes', icon: Shirt, color: 'text-chart-4' },
  savings: { label: 'Savings', icon: PiggyBank, color: 'text-chart-3' },
  gym: { label: 'Gym', icon: Dumbbell, color: 'text-primary' },
  other: { label: 'Other', icon: Receipt, color: 'text-muted-foreground' },
}

export function BudgetTab() {
  const [month, setMonth] = useState(currentMonth())
  const { data, isLoading, mutate } = useSWR<{
    incomes: Income[]
    expenses: Expense[]
    totalIncome: number
    totalExpenses: number
    balance: number
  }>(`/api/budget?month=${month}`, fetcher)

  const [openIncome, setOpenIncome] = useState(false)
  const [openExpense, setOpenExpense] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  async function refresh() {
    await mutate()
    await globalMutate('/api/dashboard')
  }

  async function deleteIncome(id: string) {
    await fetch('/api/budget', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'income', id }),
    })
    toast.success('Income removed')
    refresh()
  }

  async function deleteExpense(id: string) {
    await fetch('/api/budget', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'expense', id }),
    })
    toast.success('Expense removed')
    refresh()
  }

  async function updateExpenseAmount(id: string, amount: number) {
    await fetch('/api/budget', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'expense', id, amount }),
    })
    refresh()
  }

  async function updateIncomeAmount(id: string, amount: number) {
    await fetch('/api/budget', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'income', id, amount }),
    })
    refresh()
  }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Wallet className="size-5 text-primary" /> Budget Plan
          </h2>
          <p className="text-sm text-muted-foreground">
            Track income, spending & savings · {monthLabel(month)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-[160px] rounded-xl"
          />
          <AddIncomeDialog open={openIncome} onOpenChange={setOpenIncome} month={month} onDone={refresh} />
          <AddExpenseDialog open={openExpense} onOpenChange={setOpenExpense} month={month} onDone={refresh} />
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="overflow-hidden rounded-3xl border-none bg-gradient-to-br from-chart-3/90 to-chart-3/70 text-primary-foreground shadow-lg shadow-chart-3/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary-foreground/80">
                  <TrendingUp className="size-3.5" /> Income
                </div>
                <p className="mt-2 text-3xl font-bold">{fmtLei(data.totalIncome)}</p>
                <p className="mt-1 text-xs text-primary-foreground/80">{data.incomes.length} sources</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-none bg-gradient-to-br from-chart-5/90 to-chart-5/70 text-primary-foreground shadow-lg shadow-chart-5/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary-foreground/80">
                  <TrendingDown className="size-3.5" /> Expenses
                </div>
                <p className="mt-2 text-3xl font-bold">{fmtLei(data.totalExpenses)}</p>
                <p className="mt-1 text-xs text-primary-foreground/80">{data.expenses.length} categories</p>
              </CardContent>
            </Card>

            <Card
              className={`relative overflow-hidden rounded-3xl border-none text-primary-foreground shadow-lg ${
                data.balance >= 0
                  ? 'bg-gradient-to-br from-primary to-accent shadow-primary/20'
                  : 'bg-gradient-to-br from-chart-5 to-chart-5/80 shadow-chart-5/20'
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-primary-foreground/80">
                      Balance
                    </div>
                    <p className="mt-2 text-3xl font-bold">{fmtLei(data.balance)}</p>
                    <p className="mt-1 text-xs text-primary-foreground/80">
                      {data.balance >= 0 ? 'Surplus · save it' : 'Over budget'}
                    </p>
                  </div>
                  <ProgressRing
                    value={data.totalIncome > 0 ? Math.max(0, (data.balance / data.totalIncome) * 100) : 0}
                    size={76}
                    strokeWidth={8}
                    label={`${data.totalIncome > 0 ? Math.round((data.balance / data.totalIncome) * 100) : 0}%`}
                    color="white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Income sources */}
          <Card className="rounded-3xl border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-chart-3" /> Income Sources
                </span>
                <Badge variant="secondary" className="rounded-full">{fmtLei(data.totalIncome)}</Badge>
              </CardTitle>
              <CardDescription>Where your money comes in this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.incomes.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No income added yet.</p>
              )}
              {data.incomes.map((inc) => (
                <IncomeRow
                  key={inc.id}
                  income={inc}
                  onDelete={() => deleteIncome(inc.id)}
                  onUpdate={(v) => updateIncomeAmount(inc.id, v)}
                />
              ))}
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card className="rounded-3xl border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingDown className="size-4 text-chart-5" /> Expenses Breakdown
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Fixed & variable monthly spending
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCollapsed((c) => !c)}
                >
                  {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                  {collapsed ? 'Expand' : 'Collapse'}
                </Button>
              </div>
            </CardHeader>
            {!collapsed && (
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {data.expenses.map((exp) => (
                    <ExpenseRow
                      key={exp.id}
                      expense={exp}
                      percent={data.totalExpenses > 0 ? (exp.amount / data.totalExpenses) * 100 : 0}
                      onDelete={() => deleteExpense(exp.id)}
                      onUpdate={(v) => updateExpenseAmount(exp.id, v)}
                    />
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

function IncomeRow({
  income,
  onDelete,
  onUpdate,
}: {
  income: Income
  onDelete: () => void
  onUpdate: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(income.amount))

  const icon = income.source.toLowerCase().includes('caminetto') ? '🍝'
    : income.source.toLowerCase().includes('extra') ? '💼'
    : income.source.toLowerCase().includes('food') ? '🍎'
    : '💰'

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-background text-lg shadow-sm">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{income.source}</p>
        {income.note && <p className="truncate text-xs text-muted-foreground">{income.note}</p>}
      </div>
      {editing ? (
        <Input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-28 rounded-xl"
          autoFocus
        />
      ) : (
        <span className="text-sm font-semibold text-chart-3">{fmtLei(income.amount)}</span>
      )}
      <div className="flex items-center gap-1">
        {editing ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            onClick={() => {
              onUpdate(Number(val))
              setEditing(false)
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="size-8 rounded-lg text-destructive" onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function ExpenseRow({
  expense,
  percent,
  onDelete,
  onUpdate,
}: {
  expense: Expense
  percent: number
  onDelete: () => void
  onUpdate: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(expense.amount))
  const meta = CATEGORY_META[expense.category] || CATEGORY_META.other
  const Icon = meta.icon

  return (
    <div className="rounded-2xl bg-muted/40 p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-background shadow-sm">
          <Icon className={`size-4 ${meta.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{expense.label}</p>
            {expense.isFixed ? (
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[9px]">FIXED</Badge>
            ) : (
              <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">VAR</Badge>
            )}
          </div>
          <p className="text-[11px] capitalize text-muted-foreground">{expense.category}</p>
        </div>
        {editing ? (
          <Input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-24 rounded-xl"
            autoFocus
          />
        ) : (
          <span className="text-sm font-semibold">{fmtLei(expense.amount)}</span>
        )}
        <div className="flex items-center gap-1">
          {editing ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => {
                onUpdate(Number(val))
                setEditing(false)
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="size-8 rounded-lg text-destructive" onClick={onDelete}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/60 to-accent/60 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-right text-[10px] text-muted-foreground">{percent.toFixed(1)}% of spend</p>
    </div>
  )
}

function AddIncomeDialog({
  open,
  onOpenChange,
  month,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  month: string
  onDone: () => void
}) {
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  async function submit() {
    if (!source || !amount) {
      toast.error('Please fill in source and amount')
      return
    }
    await fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'income', source, amount: Number(amount), note, month }),
    })
    toast.success('Income added')
    setSource('')
    setAmount('')
    setNote('')
    onOpenChange(false)
    onDone()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <Plus className="size-4" /> Income
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add Income</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Al Caminetto Restaurant" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Amount (lei)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Monthly salary..." className="rounded-xl" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" className="rounded-xl">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} className="rounded-xl">Add Income</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddExpenseDialog({
  open,
  onOpenChange,
  month,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  month: string
  onDone: () => void
}) {
  const [label, setLabel] = useState('')
  const [category, setCategory] = useState('other')
  const [amount, setAmount] = useState('')
  const [isFixed, setIsFixed] = useState(true)

  async function submit() {
    if (!label || !amount) {
      toast.error('Please fill in label and amount')
      return
    }
    await fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'expense', label, category, amount: Number(amount), isFixed, month }),
    })
    toast.success('Expense added')
    setLabel('')
    setAmount('')
    onOpenChange(false)
    onDone()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl">
          <Plus className="size-4" /> Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Apartment Rental" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount (lei)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isFixed ? 'default' : 'outline'}
              size="sm"
              className="rounded-xl"
              onClick={() => setIsFixed(true)}
            >
              Fixed
            </Button>
            <Button
              variant={!isFixed ? 'default' : 'outline'}
              size="sm"
              className="rounded-xl"
              onClick={() => setIsFixed(false)}
            >
              Variable
            </Button>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" className="rounded-xl">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} className="rounded-xl">Add Expense</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
