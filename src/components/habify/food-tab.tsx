'use client'

import { useState, useMemo } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { ProgressRing } from './progress-ring'
import { toast } from 'sonner'
import { fmtLei } from '@/lib/format'
import {
  Apple,
  Plus,
  Trash2,
  Pencil,
  Snowflake,
  Refrigerator,
  Package,
  Flame,
  Search,
  ShoppingCart,
  Beef,
  Milk,
  Carrot,
  Wheat,
} from 'lucide-react'

interface FoodItem {
  id: string
  name: string
  category: string
  price: number
  quantity: number
  unit: string
  stock: number
  stockUnit: string
  calories: number
  location: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CATEGORY_META: Record<string, { label: string; icon: typeof Beef; color: string }> = {
  meat: { label: 'Meat & Fish', icon: Beef, color: 'text-chart-5' },
  dairy: { label: 'Dairy & Eggs', icon: Milk, color: 'text-chart-2' },
  veg: { label: 'Vegetables', icon: Carrot, color: 'text-chart-3' },
  fruit: { label: 'Fruit', icon: Apple, color: 'text-chart-5' },
  grains: { label: 'Grains & Bread', icon: Wheat, color: 'text-chart-4' },
  frozen: { label: 'Frozen', icon: Snowflake, color: 'text-chart-2' },
  pantry: { label: 'Pantry', icon: Package, color: 'text-muted-foreground' },
  other: { label: 'Other', icon: Package, color: 'text-muted-foreground' },
}

const LOCATION_META: Record<string, { label: string; icon: typeof Snowflake; color: string }> = {
  freezer: { label: 'Freezer', icon: Snowflake, color: 'bg-chart-2/15 text-chart-2' },
  fridge: { label: 'Fridge', icon: Refrigerator, color: 'bg-chart-3/15 text-chart-3' },
  pantry: { label: 'Pantry', icon: Package, color: 'bg-chart-4/15 text-chart-4' },
}

export function FoodTab() {
  const { data: items = [], mutate } = useSWR<FoodItem[]>('/api/food', fetcher)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [locFilter, setLocFilter] = useState<string>('all')
  const [catFilter, setCatFilter] = useState<string>('all')

  const refresh = async () => {
    await mutate()
    await globalMutate('/api/dashboard')
  }

  const filtered = useMemo(() => {
    return items
      .filter((i) => (locFilter === 'all' ? true : i.location === locFilter))
      .filter((i) => (catFilter === 'all' ? true : i.category === catFilter))
      .filter((i) =>
        search.trim() ? i.name.toLowerCase().includes(search.toLowerCase()) : true
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items, search, locFilter, catFilter])

  // Totals
  const totals = useMemo(() => {
    const value = items.reduce((s, i) => {
      const ratio = i.quantity > 0 ? i.stock / i.quantity : i.stock
      return s + i.price * (i.unit === i.stockUnit ? i.stock : ratio > 0 ? ratio * i.price : i.price * i.stock)
    }, 0)
    // Simpler value calc: price per unit * stock
    const value2 = items.reduce((s, i) => {
      const perUnit = i.quantity > 0 ? i.price / i.quantity : i.price
      return s + perUnit * i.stock
    }, 0)
    const calories = items.reduce((s, i) => {
      // calories is per 100g or per pack. If kg/l: stock*10*cal; if pack/buc: stock*cal
      const factor = i.stockUnit === 'kg' || i.stockUnit === 'l' ? 10 : 1
      return s + i.calories * i.stock * factor
    }, 0)
    const freezer = items.filter((i) => i.location === 'freezer')
    const fridge = items.filter((i) => i.location === 'fridge')
    const pantry = items.filter((i) => i.location === 'pantry')
    const lowStock = items.filter((i) => i.stock <= (i.quantity > 0 ? i.quantity * 0.2 : 1)).length
    return { value: value2, calories: Math.round(calories), freezer, fridge, pantry, lowStock }
  }, [items])

  async function deleteItem(id: string) {
    await fetch('/api/food', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    toast.success('Item removed')
    refresh()
  }

  async function updateStock(id: string, stock: number) {
    await fetch('/api/food', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stock }),
    })
    refresh()
  }

  async function updatePrice(id: string, price: number) {
    await fetch('/api/food', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, price }),
    })
    refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Apple className="size-5 text-chart-3" /> Food Tracker
          </h2>
          <p className="text-sm text-muted-foreground">
            Romania live prices · freezer stock · calories
          </p>
        </div>
        <AddFoodDialog open={open} onOpenChange={setOpen} onDone={refresh} />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Snowflake className="size-4" />}
          label="Freezer"
          value={`${totals.freezer.length}`}
          sub="items"
          gradient="from-chart-2/90 to-chart-2/70"
        />
        <StatCard
          icon={<Refrigerator className="size-4" />}
          label="Fridge"
          value={`${totals.fridge.length}`}
          sub="items"
          gradient="from-chart-3/90 to-chart-3/70"
        />
        <StatCard
          icon={<Package className="size-4" />}
          label="Pantry"
          value={`${totals.pantry.length}`}
          sub="items"
          gradient="from-chart-4/90 to-chart-4/70"
        />
        <StatCard
          icon={<Flame className="size-4" />}
          label="Calories on hand"
          value={totals.calories.toLocaleString()}
          sub="kcal"
          gradient="from-chart-5/90 to-chart-5/70"
        />
      </div>

      {/* Total value banner */}
      <Card className="overflow-hidden rounded-3xl border-none bg-gradient-to-br from-primary/90 to-accent/80 text-primary-foreground shadow-lg shadow-primary/20">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary-foreground/80">
              <ShoppingCart className="size-3.5" /> Total pantry value
            </p>
            <p className="mt-1 text-3xl font-bold">{fmtLei(totals.value)}</p>
            <p className="mt-1 text-xs text-primary-foreground/80">
              {totals.lowStock} item{totals.lowStock === 1 ? '' : 's'} running low · restock soon
            </p>
          </div>
          <ProgressRing
            value={Math.min(100, items.length * 5)}
            size={72}
            strokeWidth={8}
            label={`${items.length}`}
            sublabel="items"
            color="white"
          />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="rounded-3xl border-border/60">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Food Inventory</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="h-9 w-40 rounded-xl pl-8"
                />
              </div>
              <Select value={locFilter} onValueChange={setLocFilter}>
                <SelectTrigger className="h-9 w-32 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  <SelectItem value="freezer">Freezer</SelectItem>
                  <SelectItem value="fridge">Fridge</SelectItem>
                  <SelectItem value="pantry">Pantry</SelectItem>
                </SelectContent>
              </Select>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="h-9 w-36 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {Object.entries(CATEGORY_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription>{filtered.length} items shown</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[600px] scroll-soft pr-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {filtered.map((item) => (
                <FoodRow
                  key={item.id}
                  item={item}
                  onDelete={() => deleteItem(item.id)}
                  onUpdateStock={(v) => updateStock(item.id, v)}
                  onUpdatePrice={(v) => updatePrice(item.id, v)}
                />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                  No items match. Try a different filter or add one.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  gradient: string
}) {
  return (
    <Card className={`overflow-hidden rounded-3xl border-none bg-gradient-to-br ${gradient} text-primary-foreground shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-primary-foreground/80">
          {icon} {label}
        </div>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        <p className="text-[10px] text-primary-foreground/70">{sub}</p>
      </CardContent>
    </Card>
  )
}

function FoodRow({
  item,
  onDelete,
  onUpdateStock,
  onUpdatePrice,
}: {
  item: FoodItem
  onDelete: () => void
  onUpdateStock: (v: number) => void
  onUpdatePrice: (v: number) => void
}) {
  const [editingStock, setEditingStock] = useState(false)
  const [editingPrice, setEditingPrice] = useState(false)
  const [stock, setStock] = useState(String(item.stock))
  const [price, setPrice] = useState(String(item.price))

  const cat = CATEGORY_META[item.category] || CATEGORY_META.other
  const loc = LOCATION_META[item.location] || LOCATION_META.pantry
  const CatIcon = cat.icon
  const LocIcon = loc.icon

  const stockPercent = item.quantity > 0 ? Math.min(100, (item.stock / item.quantity) * 100) : 100
  const isLow = stockPercent <= 20

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted/40">
          <CatIcon className={`size-4 ${cat.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <Badge className={`rounded-full px-2 py-0 text-[9px] ${loc.color}`}>
              <LocIcon className="mr-0.5 size-2.5" /> {loc.label}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Flame className="size-3" /> {item.calories} kcal/{item.stockUnit === 'kg' || item.stockUnit === 'l' ? '100g' : 'pack'}</span>
            <span>· {cat.label}</span>
          </div>
        </div>
      </div>

      {/* Price + Stock */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-muted/30 p-2">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Price</p>
          {editingPrice ? (
            <div className="flex items-center gap-1">
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="h-7 rounded-lg text-sm" autoFocus />
              <Button size="icon" variant="ghost" className="size-7" onClick={() => { onUpdatePrice(Number(price)); setEditingPrice(false) }}>
                <Pencil className="size-3" />
              </Button>
            </div>
          ) : (
            <button onClick={() => setEditingPrice(true)} className="flex w-full items-center justify-between text-sm font-semibold">
              <span>{fmtLei(item.price)}</span>
              <span className="text-[10px] font-normal text-muted-foreground">/{item.unit}</span>
            </button>
          )}
        </div>
        <div className="rounded-xl bg-muted/30 p-2">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Left in {loc.label.toLowerCase()}</p>
          {editingStock ? (
            <div className="flex items-center gap-1">
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="h-7 rounded-lg text-sm" autoFocus />
              <Button size="icon" variant="ghost" className="size-7" onClick={() => { onUpdateStock(Number(stock)); setEditingStock(false) }}>
                <Pencil className="size-3" />
              </Button>
            </div>
          ) : (
            <button onClick={() => setEditingStock(true)} className="flex w-full items-center justify-between text-sm font-semibold">
              <span className={isLow ? 'text-chart-5' : ''}>{item.stock} {item.stockUnit}</span>
              <Pencil className="size-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Stock bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              isLow ? 'bg-chart-5' : stockPercent < 60 ? 'bg-chart-4' : 'bg-chart-3'
            }`}
            style={{ width: `${stockPercent}%` }}
          />
        </div>
        {isLow && <span className="text-[9px] font-medium text-chart-5">LOW</span>}
        <Button variant="ghost" size="icon" className="size-7 rounded-lg text-destructive" onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function AddFoodDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onDone: () => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('meat')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('kg')
  const [stock, setStock] = useState('1')
  const [stockUnit, setStockUnit] = useState('kg')
  const [calories, setCalories] = useState('')
  const [location, setLocation] = useState('freezer')

  async function submit() {
    if (!name || !price) {
      toast.error('Please fill in name and price')
      return
    }
    await fetch('/api/food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        category,
        price: Number(price),
        quantity: Number(quantity),
        unit,
        stock: Number(stock),
        stockUnit,
        calories: Number(calories) || 0,
        location,
      }),
    })
    toast.success('Food item added')
    setName('')
    setPrice('')
    setCalories('')
    onOpenChange(false)
    onDone()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <Plus className="size-4" /> Add Food
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl scroll-soft">
        <DialogHeader>
          <DialogTitle>Add Food Item</DialogTitle>
          <CardDescription>Track price, quantity & calories</CardDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chicken Breast" className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <Label>Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="freezer">Freezer</SelectItem>
                  <SelectItem value="fridge">Fridge</SelectItem>
                  <SelectItem value="pantry">Pantry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Price (lei)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Qty</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="pack">pack</SelectItem>
                  <SelectItem value="buc">buc</SelectItem>
                  <SelectItem value="l">l</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Stock left</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Stock unit</Label>
              <Select value={stockUnit} onValueChange={setStockUnit}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="pack">pack</SelectItem>
                  <SelectItem value="buc">buc</SelectItem>
                  <SelectItem value="l">l</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Calories</Label>
              <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="per 100g/pack" className="rounded-xl" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" className="rounded-xl">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} className="rounded-xl">Add Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
