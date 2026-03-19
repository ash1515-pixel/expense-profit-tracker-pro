import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  ReceiptText,
  Settings,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'businesses', label: 'Businesses', icon: Building2 },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText },
  { id: 'reports', label: 'Reports', icon: CircleDollarSign },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const COLORS = ['#16a34a', '#dc2626', '#0ea5e9', '#f59e0b', '#8b5cf6', '#f97316']
const ENTRY_TYPES = ['revenue', 'income', 'expense', 'investment', 'purchase']
const STORAGE_KEYS = {
  businesses: 'expense-tracker-businesses',
  entries: 'expense-tracker-entries',
  theme: 'expense-tracker-theme',
}

const INITIAL_BUSINESSES = [
  { id: 'b-cafe', name: 'Cafe', sector: 'Food & Beverage', createdAt: '2026-01-01' },
  { id: 'b-travel', name: 'Travel', sector: 'Tourism', createdAt: '2026-01-01' },
  { id: 'b-textile', name: 'Textile', sector: 'Manufacturing', createdAt: '2026-01-01' },
  { id: 'b-hardware', name: 'Hardware', sector: 'Retail', createdAt: '2026-01-01' },
]

const INITIAL_ENTRIES = [
  { id: 'e-1', date: '2026-03-18', businessId: 'b-cafe', type: 'revenue', amount: 14250, category: 'Sales', itemName: '', vendor: '', note: 'POS collections' },
  { id: 'e-2', date: '2026-03-18', businessId: 'b-travel', type: 'expense', amount: 3200, category: 'Fuel', itemName: 'Fuel refill', vendor: 'HP Fuel', note: '' },
  { id: 'e-3', date: '2026-03-17', businessId: 'b-textile', type: 'income', amount: 22100, category: 'Wholesale', itemName: '', vendor: '', note: '' },
  { id: 'e-4', date: '2026-03-17', businessId: 'b-hardware', type: 'purchase', amount: 8900, category: 'Inventory', itemName: 'Drill machine stock', vendor: 'Makita Dealer', note: '' },
  { id: 'e-5', date: '2026-03-16', businessId: 'b-cafe', type: 'investment', amount: 12000, category: 'Capital Injection', itemName: '', vendor: '', note: 'Owner top-up' },
]

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0)

const monthLabel = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
}

const getToday = () => new Date().toISOString().slice(0, 10)

const safeParse = (raw, fallback) => {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

const applyDateFilter = (items, filter) => {
  if (filter === 'all') return items
  const dayMap = { '30d': 30, '90d': 90, '365d': 365 }
  const days = dayMap[filter]
  const now = new Date()
  const threshold = new Date(now)
  threshold.setDate(now.getDate() - days)
  return items.filter((item) => new Date(item.date) >= threshold)
}

const getBusinessName = (businesses, businessId) => businesses.find((item) => item.id === businessId)?.name ?? 'Unknown'

const getEntryImpact = (type) => {
  if (type === 'revenue' || type === 'income') return 1
  return -1
}

const getTypeTone = (type) => {
  if (type === 'revenue' || type === 'income') return 'good'
  if (type === 'investment') return 'neutral'
  return 'bad'
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedBusiness, setSelectedBusiness] = useState('all')
  const [dateFilter, setDateFilter] = useState('90d')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(STORAGE_KEYS.theme) === 'dark')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState(() => safeParse(localStorage.getItem(STORAGE_KEYS.businesses), INITIAL_BUSINESSES))
  const [entries, setEntries] = useState(() => safeParse(localStorage.getItem(STORAGE_KEYS.entries), INITIAL_ENTRIES))
  const [businessForm, setBusinessForm] = useState({ name: '', sector: '' })
  const [entryForm, setEntryForm] = useState({
    date: getToday(),
    businessId: businesses[0]?.id ?? '',
    type: 'revenue',
    amount: '',
    category: '',
    itemName: '',
    vendor: '',
    note: '',
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem(STORAGE_KEYS.theme, darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.businesses, JSON.stringify(businesses))
  }, [businesses])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries))
  }, [entries])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(timer)
  }, [])

  const scopedEntries = useMemo(() => {
    const byDate = applyDateFilter(entries, dateFilter)
    if (selectedBusiness === 'all') return byDate
    return byDate.filter((item) => item.businessId === selectedBusiness)
  }, [entries, dateFilter, selectedBusiness])

  const filteredEntries = useMemo(() => {
    let data = scopedEntries.map((item) => ({ ...item, businessName: getBusinessName(businesses, item.businessId) }))

    if (typeFilter !== 'all') data = data.filter((item) => item.type === typeFilter)

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      data = data.filter(
        (item) =>
          item.businessName.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          item.itemName.toLowerCase().includes(query) ||
          item.vendor.toLowerCase().includes(query),
      )
    }

    data.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1
      if (sortBy === 'amount') return (a.amount - b.amount) * direction
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction
    })

    return data
  }, [scopedEntries, typeFilter, searchQuery, sortBy, sortDirection, businesses])

  const metrics = useMemo(() => {
    const totals = scopedEntries.reduce(
      (acc, entry) => {
        acc[entry.type] += entry.amount
        return acc
      },
      { revenue: 0, income: 0, expense: 0, investment: 0, purchase: 0 },
    )

    const grossInflow = totals.revenue + totals.income
    const outflow = totals.expense + totals.purchase
    const operatingProfit = grossInflow - outflow
    const netCashflow = operatingProfit - totals.investment

    const currentMonthKey = new Date().toISOString().slice(0, 7)
    const currentMonth = scopedEntries
      .filter((item) => item.date.startsWith(currentMonthKey))
      .reduce((sum, item) => sum + item.amount * getEntryImpact(item.type), 0)

    const previousDate = new Date()
    previousDate.setMonth(previousDate.getMonth() - 1)
    const previousMonthKey = previousDate.toISOString().slice(0, 7)
    const previousMonth = scopedEntries
      .filter((item) => item.date.startsWith(previousMonthKey))
      .reduce((sum, item) => sum + item.amount * getEntryImpact(item.type), 0)

    const growth = previousMonth === 0 ? 100 : ((currentMonth - previousMonth) / Math.abs(previousMonth)) * 100

    return { ...totals, grossInflow, outflow, operatingProfit, netCashflow, growth }
  }, [scopedEntries])

  const profitTrendData = useMemo(() => {
    const byMonth = scopedEntries.reduce((acc, item) => {
      const label = monthLabel(item.date)
      if (!acc[label]) acc[label] = { month: label, inflow: 0, outflow: 0, net: 0 }
      if (item.type === 'revenue' || item.type === 'income') acc[label].inflow += item.amount
      if (item.type === 'expense' || item.type === 'purchase' || item.type === 'investment') acc[label].outflow += item.amount
      acc[label].net = acc[label].inflow - acc[label].outflow
      return acc
    }, {})
    return Object.values(byMonth)
  }, [scopedEntries])

  const expenseCategoryData = useMemo(() => {
    const byCategory = scopedEntries
      .filter((item) => item.type === 'expense' || item.type === 'purchase')
      .reduce((acc, item) => {
        acc[item.category || 'Uncategorized'] = (acc[item.category || 'Uncategorized'] ?? 0) + item.amount
        return acc
      }, {})
    return Object.entries(byCategory).map(([name, value]) => ({ name, value }))
  }, [scopedEntries])

  const businessComparisonData = useMemo(() => {
    return businesses.map((business) => {
      const businessEntries = entries.filter((item) => item.businessId === business.id)
      const revenue = businessEntries.filter((item) => item.type === 'revenue').reduce((sum, item) => sum + item.amount, 0)
      const income = businessEntries.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
      const expense = businessEntries.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
      const purchase = businessEntries.filter((item) => item.type === 'purchase').reduce((sum, item) => sum + item.amount, 0)
      const investment = businessEntries.filter((item) => item.type === 'investment').reduce((sum, item) => sum + item.amount, 0)
      const profit = revenue + income - expense - purchase
      const net = profit - investment

      return { business: business.name, revenue, income, expense, purchase, investment, profit, net }
    })
  }, [entries, businesses])

  const bestPerformer = [...businessComparisonData].sort((a, b) => b.net - a.net)[0]
  const highestCostCategory = [...expenseCategoryData].sort((a, b) => b.value - a.value)[0]
  const recentEntries = filteredEntries.slice(0, 8)
  const sectionTitle = NAV_ITEMS.find((item) => item.id === activePage)?.label ?? 'Dashboard'

  const handleBusinessCreate = (event) => {
    event.preventDefault()
    const name = businessForm.name.trim()
    const sector = businessForm.sector.trim()
    if (!name) return
    const exists = businesses.some((item) => item.name.toLowerCase() === name.toLowerCase())
    if (exists) return

    const newBusiness = {
      id: `b-${crypto.randomUUID?.() ?? Date.now()}`,
      name,
      sector: sector || 'General',
      createdAt: getToday(),
    }

    setBusinesses((prev) => [...prev, newBusiness])
    setBusinessForm({ name: '', sector: '' })
    setSelectedBusiness(newBusiness.id)
    setEntryForm((prev) => ({ ...prev, businessId: newBusiness.id }))
  }

  const handleEntryCreate = (event) => {
    event.preventDefault()
    if (!entryForm.businessId || !entryForm.amount) return
    const amount = Number(entryForm.amount)
    if (!Number.isFinite(amount) || amount <= 0) return

    const newEntry = {
      id: `e-${crypto.randomUUID?.() ?? Date.now()}`,
      date: entryForm.date || getToday(),
      businessId: entryForm.businessId,
      type: entryForm.type,
      amount,
      category: entryForm.category.trim() || 'General',
      itemName: entryForm.itemName.trim(),
      vendor: entryForm.vendor.trim(),
      note: entryForm.note.trim(),
    }

    setEntries((prev) => [newEntry, ...prev])
    setEntryForm((prev) => ({
      ...prev,
      amount: '',
      category: '',
      itemName: '',
      vendor: '',
      note: '',
      date: getToday(),
    }))
  }

  const handleDeleteEntry = (entryId) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId))
  }

  const renderSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[...Array(4)].map((_, idx) => (
        <div className="skeleton-panel h-28" key={idx} />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(22,163,74,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.14),transparent_32%)]" />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setMobileNavOpen(false)} role="presentation" />
      )}

      <div className="relative z-30 flex min-h-screen">
        <aside
          className={clsx(
            'fixed inset-y-0 left-0 z-30 w-72 border-r border-[var(--border-color)] bg-[var(--panel-bg)] p-6 transition-transform duration-300 lg:static lg:translate-x-0',
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-green-600/90 text-white shadow-lg">
              <BriefcaseBusiness size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">FinOps Suite</p>
              <p className="font-semibold text-[var(--text-primary)]">Business Management Tracker</p>
            </div>
          </div>

          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition',
                    activePage === item.id
                      ? 'bg-green-600 text-white shadow'
                      : 'text-[var(--text-muted)] hover:bg-[var(--panel-soft)] hover:text-[var(--text-primary)]',
                  )}
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id)
                    setMobileNavOpen(false)
                  }}
                  type="button"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="mt-8 rounded-xl border border-[var(--border-color)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--text-muted)]">
            <p className="font-semibold text-[var(--text-primary)]">Live Mode Enabled</p>
            <p className="mt-1">All entries are editable and saved in browser storage.</p>
          </div>
        </aside>

        <main className="w-full lg:pl-0">
          <header className="sticky top-0 z-10 border-b border-[var(--border-color)] bg-[color-mix(in_srgb,var(--panel-bg)_84%,transparent)] backdrop-blur-lg">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
              <button
                className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border-color)] bg-[var(--panel-soft)] lg:hidden"
                onClick={() => setMobileNavOpen((prev) => !prev)}
                type="button"
              >
                {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Financial Command Center</p>
                <h1 className="text-lg font-semibold md:text-xl">{sectionTitle}</h1>
              </div>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <select className="input-select" onChange={(event) => setSelectedBusiness(event.target.value)} value={selectedBusiness}>
                  <option value="all">All Businesses</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>

                <select className="input-select" onChange={(event) => setDateFilter(event.target.value)} value={dateFilter}>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="365d">Last 12 Months</option>
                  <option value="all">All Time</option>
                </select>

                <button
                  className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border-color)] bg-[var(--panel-soft)]"
                  onClick={() => setDarkMode((prev) => !prev)}
                  type="button"
                >
                  {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                </button>
              </div>
            </div>
          </header>

          <section className="space-y-6 p-4 md:p-6">
            {loading ? (
              renderSkeleton()
            ) : (
              <>
                {activePage === 'dashboard' && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <KpiCard icon={Banknote} label="Revenue" value={formatCurrency(metrics.revenue)} trend="up" />
                      <KpiCard icon={ArrowUpRight} label="Income" value={formatCurrency(metrics.income)} trend="up" />
                      <KpiCard icon={ArrowDownRight} label="Expenses" value={formatCurrency(metrics.expense)} trend="down" />
                      <KpiCard icon={Wallet} label="Purchases" value={formatCurrency(metrics.purchase)} trend="down" />
                      <KpiCard icon={TrendingDown} label="Investment" value={formatCurrency(metrics.investment)} trend="neutral" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <KpiCard
                        icon={metrics.operatingProfit >= 0 ? TrendingUp : TrendingDown}
                        label="Operating Profit"
                        value={formatCurrency(metrics.operatingProfit)}
                        trend={metrics.operatingProfit >= 0 ? 'up' : 'down'}
                      />
                      <KpiCard
                        icon={metrics.netCashflow >= 0 ? TrendingUp : TrendingDown}
                        label="Net Cashflow"
                        value={formatCurrency(metrics.netCashflow)}
                        trend={metrics.netCashflow >= 0 ? 'up' : 'down'}
                      />
                      <KpiCard
                        icon={metrics.growth >= 0 ? ArrowUpRight : ArrowDownRight}
                        label="Monthly Growth"
                        value={`${metrics.growth.toFixed(1)}%`}
                        trend={metrics.growth >= 0 ? 'up' : 'down'}
                      />
                      <KpiCard icon={Building2} label="Active Businesses" value={`${businesses.length}`} trend="neutral" />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                      <Panel className="xl:col-span-2" title="Cashflow Trend">
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={profitTrendData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                              <XAxis dataKey="month" stroke="var(--text-muted)" />
                              <YAxis stroke="var(--text-muted)" tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                              <Legend />
                              <Line type="monotone" dataKey="inflow" stroke="#16a34a" strokeWidth={2} />
                              <Line type="monotone" dataKey="outflow" stroke="#dc2626" strokeWidth={2} />
                              <Line type="monotone" dataKey="net" stroke="#0ea5e9" strokeWidth={3} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </Panel>

                      <Panel title="Cost Categories">
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={expenseCategoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                                {expenseCategoryData.map((entry, index) => (
                                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </Panel>
                    </div>

                    <Panel title="Recent Entries">
                      <TransactionTable rows={recentEntries} onDelete={handleDeleteEntry} />
                    </Panel>
                  </>
                )}

                {activePage === 'businesses' && (
                  <div className="space-y-4">
                    <Panel title="Add Business">
                      <form className="grid gap-3 md:grid-cols-3" onSubmit={handleBusinessCreate}>
                        <input
                          className="input-select"
                          placeholder="Business name"
                          value={businessForm.name}
                          onChange={(event) => setBusinessForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                        <input
                          className="input-select"
                          placeholder="Sector (e.g. Retail)"
                          value={businessForm.sector}
                          onChange={(event) => setBusinessForm((prev) => ({ ...prev, sector: event.target.value }))}
                        />
                        <button className="input-select flex items-center justify-center gap-2 bg-green-600 text-white" type="submit">
                          <Plus size={16} />
                          Add Business
                        </button>
                      </form>
                    </Panel>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {businessComparisonData.map((item) => (
                        <Panel key={item.business} title={item.business}>
                          <div className="space-y-2 text-sm">
                            <MetricLine label="Revenue" value={formatCurrency(item.revenue)} positive />
                            <MetricLine label="Income" value={formatCurrency(item.income)} positive />
                            <MetricLine label="Expense" value={formatCurrency(item.expense)} />
                            <MetricLine label="Purchase" value={formatCurrency(item.purchase)} />
                            <MetricLine label="Investment" value={formatCurrency(item.investment)} />
                            <MetricLine label="Net" value={formatCurrency(item.net)} positive={item.net >= 0} />
                          </div>
                        </Panel>
                      ))}
                    </div>
                  </div>
                )}

                {activePage === 'transactions' && (
                  <div className="space-y-4">
                    <Panel title="Add Entry">
                      <form className="grid gap-3 md:grid-cols-4" onSubmit={handleEntryCreate}>
                        <input
                          type="date"
                          className="input-select"
                          value={entryForm.date}
                          onChange={(event) => setEntryForm((prev) => ({ ...prev, date: event.target.value }))}
                        />
                        <select
                          className="input-select"
                          value={entryForm.businessId}
                          onChange={(event) => setEntryForm((prev) => ({ ...prev, businessId: event.target.value }))}
                        >
                          {businesses.map((business) => (
                            <option key={business.id} value={business.id}>
                              {business.name}
                            </option>
                          ))}
                        </select>
                        <select
                          className="input-select"
                          value={entryForm.type}
                          onChange={(event) => setEntryForm((prev) => ({ ...prev, type: event.target.value }))}
                        >
                          {ENTRY_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input-select"
                          placeholder="Amount"
                          value={entryForm.amount}
                          onChange={(event) => setEntryForm((prev) => ({ ...prev, amount: event.target.value }))}
                        />
                        <input
                          className="input-select"
                          placeholder="Category"
                          value={entryForm.category}
                          onChange={(event) => setEntryForm((prev) => ({ ...prev, category: event.target.value }))}
                        />
                        <input
                          className="input-select"
                          placeholder="Item purchased (optional)"
                          value={entryForm.itemName}
                          onChange={(event) => setEntryForm((prev) => ({ ...prev, itemName: event.target.value }))}
                        />
                        <input
                          className="input-select"
                          placeholder="Vendor / Supplier"
                          value={entryForm.vendor}
                          onChange={(event) => setEntryForm((prev) => ({ ...prev, vendor: event.target.value }))}
                        />
                        <input
                          className="input-select"
                          placeholder="Notes"
                          value={entryForm.note}
                          onChange={(event) => setEntryForm((prev) => ({ ...prev, note: event.target.value }))}
                        />
                        <button className="input-select flex items-center justify-center gap-2 bg-green-600 text-white md:col-span-4" type="submit">
                          <Plus size={16} />
                          Save Entry
                        </button>
                      </form>
                    </Panel>

                    <Panel title="All Entries">
                      <div className="mb-4 grid gap-3 md:grid-cols-4">
                        <input
                          className="input-select md:col-span-2"
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder="Search by business, category, item, vendor"
                          value={searchQuery}
                        />
                        <select className="input-select" onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}>
                          <option value="all">All Types</option>
                          {ENTRY_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <button
                          className="input-select text-left"
                          onClick={() => {
                            setSortBy((prev) => (prev === 'date' ? 'amount' : 'date'))
                            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                          }}
                          type="button"
                        >
                          Sort: {sortBy} ({sortDirection})
                        </button>
                      </div>
                      <TransactionTable rows={filteredEntries} onDelete={handleDeleteEntry} />
                    </Panel>
                  </div>
                )}

                {activePage === 'reports' && (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <Panel title="Business Comparison">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={businessComparisonData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                            <XAxis dataKey="business" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#16a34a" radius={6} />
                            <Bar dataKey="expense" fill="#dc2626" radius={6} />
                            <Bar dataKey="investment" fill="#f59e0b" radius={6} />
                            <Bar dataKey="net" fill="#0ea5e9" radius={6} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Panel>

                    <Panel title="Insights Snapshot">
                      <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                        <li className="rounded-lg bg-[var(--panel-soft)] p-3">
                          Best performer: <strong>{bestPerformer?.business ?? 'N/A'}</strong>
                        </li>
                        <li className="rounded-lg bg-[var(--panel-soft)] p-3">
                          Highest cost category: <strong>{highestCostCategory?.name ?? 'N/A'}</strong>
                        </li>
                        <li className="rounded-lg bg-[var(--panel-soft)] p-3">
                          Gross inflow: <strong>{formatCurrency(metrics.grossInflow)}</strong>
                        </li>
                        <li className="rounded-lg bg-[var(--panel-soft)] p-3">
                          Total operational outflow: <strong>{formatCurrency(metrics.outflow)}</strong>
                        </li>
                      </ul>
                    </Panel>
                  </div>
                )}

                {activePage === 'settings' && (
                  <Panel title="Workspace Settings">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-[var(--border-color)] p-4">
                        <p className="font-semibold">Theme</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">Switch visual mode for presentations.</p>
                        <button className="mt-3 input-select w-auto" onClick={() => setDarkMode((prev) => !prev)} type="button">
                          Switch to {darkMode ? 'Light' : 'Dark'} Mode
                        </button>
                      </div>

                      <div className="rounded-xl border border-[var(--border-color)] p-4">
                        <p className="font-semibold">Data Storage</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">Your data is currently saved in browser localStorage.</p>
                        <p className="mt-3 rounded-lg bg-[var(--panel-soft)] p-2 text-sm">
                          Businesses: {businesses.length} | Entries: {entries.length}
                        </p>
                      </div>
                    </div>
                  </Panel>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

function Panel({ title, className, children }) {
  return (
    <article className={clsx('panel-fade rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4 md:p-5', className)}>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </article>
  )
}

function KpiCard({ label, value, icon, trend }) {
  const IconComponent = icon
  const tone =
    trend === 'up'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
      : trend === 'neutral'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'

  return (
    <div className="panel-fade rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <div className={clsx('grid h-10 w-10 place-items-center rounded-lg', tone)}>
          <IconComponent size={18} />
        </div>
      </div>
    </div>
  )
}

function MetricLine({ label, value, positive }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[var(--text-muted)]">{label}</p>
      <p className={positive ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}>{value}</p>
    </div>
  )
}

function TransactionTable({ rows, onDelete }) {
  return (
    <div className="overflow-auto rounded-xl border border-[var(--border-color)]">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--panel-soft)] text-left text-[var(--text-muted)]">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Business</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Item</th>
            <th className="px-4 py-3 font-medium">Vendor</th>
            <th className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const tone = getTypeTone(row.type)
            return (
              <tr className="border-t border-[var(--border-color)]" key={row.id}>
                <td className="px-4 py-3">{new Date(row.date).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">{row.businessName}</td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      'rounded-full px-2 py-1 text-xs font-medium',
                      tone === 'good'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : tone === 'neutral'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300',
                    )}
                  >
                    {row.type}
                  </span>
                </td>
                <td className={clsx('px-4 py-3 font-medium', tone === 'good' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300')}>
                  {formatCurrency(row.amount)}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{row.category || '-'}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{row.itemName || '-'}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{row.vendor || '-'}</td>
                <td className="px-4 py-3">
                  <button className="rounded-lg border border-[var(--border-color)] p-2 text-rose-600" onClick={() => onDelete(row.id)} type="button">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {!rows.length && <p className="p-5 text-center text-[var(--text-muted)]">No entries found for current filters.</p>}
    </div>
  )
}

export default App
