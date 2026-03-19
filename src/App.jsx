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
  ReceiptText,
  Settings,
  Sun,
  TrendingDown,
  TrendingUp,
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

const TRANSACTIONS = [
  { id: 'T001', date: '2026-03-18', business: 'Cafe', type: 'income', amount: 14250, category: 'Sales' },
  { id: 'T002', date: '2026-03-18', business: 'Travel', type: 'expense', amount: 3200, category: 'Fuel' },
  { id: 'T003', date: '2026-03-17', business: 'Textile', type: 'income', amount: 22100, category: 'Wholesale' },
  { id: 'T004', date: '2026-03-17', business: 'Hardware', type: 'expense', amount: 8900, category: 'Inventory' },
  { id: 'T005', date: '2026-03-16', business: 'Cafe', type: 'expense', amount: 2800, category: 'Supplies' },
  { id: 'T006', date: '2026-03-15', business: 'Travel', type: 'income', amount: 18100, category: 'Packages' },
  { id: 'T007', date: '2026-03-14', business: 'Hardware', type: 'income', amount: 26400, category: 'Retail' },
  { id: 'T008', date: '2026-03-14', business: 'Textile', type: 'expense', amount: 11900, category: 'Logistics' },
  { id: 'T009', date: '2026-02-28', business: 'Cafe', type: 'income', amount: 12600, category: 'Sales' },
  { id: 'T010', date: '2026-02-25', business: 'Travel', type: 'expense', amount: 4600, category: 'Marketing' },
  { id: 'T011', date: '2026-02-19', business: 'Textile', type: 'income', amount: 19700, category: 'Wholesale' },
  { id: 'T012', date: '2026-02-13', business: 'Hardware', type: 'expense', amount: 7100, category: 'Rent' },
  { id: 'T013', date: '2026-01-26', business: 'Cafe', type: 'expense', amount: 2300, category: 'Utilities' },
  { id: 'T014', date: '2026-01-20', business: 'Travel', type: 'income', amount: 15300, category: 'Packages' },
  { id: 'T015', date: '2026-01-15', business: 'Textile', type: 'expense', amount: 8600, category: 'Payroll' },
  { id: 'T016', date: '2026-01-09', business: 'Hardware', type: 'income', amount: 21000, category: 'Retail' },
  { id: 'T017', date: '2025-12-26', business: 'Cafe', type: 'income', amount: 11800, category: 'Sales' },
  { id: 'T018', date: '2025-12-17', business: 'Travel', type: 'expense', amount: 5100, category: 'Maintenance' },
  { id: 'T019', date: '2025-12-10', business: 'Textile', type: 'income', amount: 17350, category: 'Bulk' },
  { id: 'T020', date: '2025-12-02', business: 'Hardware', type: 'expense', amount: 6200, category: 'Inventory' },
]

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

const monthLabel = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
}

const applyDateFilter = (items, filter) => {
  if (filter === 'all') return items

  const dayMap = { '30d': 30, '90d': 90, '365d': 365 }
  const days = dayMap[filter]
  const now = new Date('2026-03-19')
  const threshold = new Date(now)
  threshold.setDate(now.getDate() - days)

  return items.filter((item) => new Date(item.date) >= threshold)
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedBusiness, setSelectedBusiness] = useState('All Businesses')
  const [dateFilter, setDateFilter] = useState('90d')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('expense-tracker-theme') === 'dark')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('expense-tracker-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900)
    return () => clearTimeout(timer)
  }, [])

  const businesses = useMemo(() => ['All Businesses', ...new Set(TRANSACTIONS.map((item) => item.business))], [])

  const scopedTransactions = useMemo(() => {
    const byDate = applyDateFilter(TRANSACTIONS, dateFilter)
    if (selectedBusiness === 'All Businesses') return byDate
    return byDate.filter((item) => item.business === selectedBusiness)
  }, [dateFilter, selectedBusiness])

  const filteredTransactions = useMemo(() => {
    let data = [...scopedTransactions]

    if (typeFilter !== 'all') {
      data = data.filter((item) => item.type === typeFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      data = data.filter(
        (item) =>
          item.business.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query),
      )
    }

    data.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1

      if (sortBy === 'amount') {
        return (a.amount - b.amount) * direction
      }

      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction
    })

    return data
  }, [scopedTransactions, searchQuery, typeFilter, sortBy, sortDirection])

  const metrics = useMemo(() => {
    const revenue = scopedTransactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0)

    const expenses = scopedTransactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0)

    const currentMonth = scopedTransactions
      .filter((item) => item.date.startsWith('2026-03'))
      .reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0)

    const previousMonth = scopedTransactions
      .filter((item) => item.date.startsWith('2026-02'))
      .reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0)

    const growth = previousMonth === 0 ? 100 : ((currentMonth - previousMonth) / Math.abs(previousMonth)) * 100

    return {
      revenue,
      expenses,
      profit: revenue - expenses,
      growth,
    }
  }, [scopedTransactions])

  const profitTrendData = useMemo(() => {
    const byMonth = scopedTransactions.reduce((acc, item) => {
      const label = monthLabel(item.date)
      if (!acc[label]) {
        acc[label] = { month: label, income: 0, expense: 0, profit: 0 }
      }

      if (item.type === 'income') acc[label].income += item.amount
      if (item.type === 'expense') acc[label].expense += item.amount
      acc[label].profit = acc[label].income - acc[label].expense
      return acc
    }, {})

    return Object.values(byMonth)
  }, [scopedTransactions])

  const expenseCategoryData = useMemo(() => {
    const byCategory = scopedTransactions
      .filter((item) => item.type === 'expense')
      .reduce((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + item.amount
        return acc
      }, {})

    return Object.entries(byCategory).map(([name, value]) => ({ name, value }))
  }, [scopedTransactions])

  const businessComparisonData = useMemo(() => {
    const rows = TRANSACTIONS.reduce((acc, item) => {
      if (!acc[item.business]) {
        acc[item.business] = { business: item.business, income: 0, expense: 0, profit: 0 }
      }

      if (item.type === 'income') acc[item.business].income += item.amount
      if (item.type === 'expense') acc[item.business].expense += item.amount
      acc[item.business].profit = acc[item.business].income - acc[item.business].expense
      return acc
    }, {})

    return Object.values(rows)
  }, [])

  const bestPerformer = [...businessComparisonData].sort((a, b) => b.profit - a.profit)[0]
  const highestExpenseCategory = [...expenseCategoryData].sort((a, b) => b.value - a.value)[0]
  const recentTransactions = filteredTransactions.slice(0, 6)
  const sectionTitle = NAV_ITEMS.find((item) => item.id === activePage)?.label ?? 'Dashboard'

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
              <p className="font-semibold text-[var(--text-primary)]">Expense &amp; Profit Tracker</p>
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
            <p className="font-semibold text-[var(--text-primary)]">MBA Portfolio Angle</p>
            <p className="mt-1">Cross-business financial analytics with KPI trend intelligence.</p>
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
                <select
                  className="input-select"
                  onChange={(event) => setSelectedBusiness(event.target.value)}
                  value={selectedBusiness}
                >
                  {businesses.map((business) => (
                    <option key={business} value={business}>
                      {business}
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

                <div className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--panel-soft)] px-3 py-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700 text-xs font-semibold text-white">AL</div>
                  <div className="hidden text-sm leading-tight md:block">
                    <p className="font-medium">Ashish</p>
                    <p className="text-xs text-[var(--text-muted)]">Finance Admin</p>
                  </div>
                </div>
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
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <KpiCard icon={Banknote} label="Total Revenue" value={formatCurrency(metrics.revenue)} trend="up" />
                      <KpiCard
                        icon={ArrowDownRight}
                        label="Total Expenses"
                        value={formatCurrency(metrics.expenses)}
                        trend="down"
                      />
                      <KpiCard
                        icon={metrics.profit >= 0 ? TrendingUp : TrendingDown}
                        label="Net Profit"
                        value={formatCurrency(metrics.profit)}
                        trend={metrics.profit >= 0 ? 'up' : 'down'}
                      />
                      <KpiCard
                        icon={metrics.growth >= 0 ? ArrowUpRight : ArrowDownRight}
                        label="Monthly Growth"
                        value={`${metrics.growth.toFixed(1)}%`}
                        trend={metrics.growth >= 0 ? 'up' : 'down'}
                      />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                      <Panel className="xl:col-span-2" title="Profit Trend (Line)">
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={profitTrendData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                              <XAxis dataKey="month" stroke="var(--text-muted)" />
                              <YAxis stroke="var(--text-muted)" tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                              <Legend />
                              <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} />
                              <Line type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2} />
                              <Line type="monotone" dataKey="profit" stroke="#0ea5e9" strokeWidth={3} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </Panel>

                      <Panel title="Expense Categories (Pie)">
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

                    <Panel title="Recent Transactions">
                      <TransactionTable rows={recentTransactions} />
                    </Panel>
                  </>
                )}

                {activePage === 'businesses' && (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {businessComparisonData.map((item) => (
                      <Panel key={item.business} title={item.business}>
                        <div className="space-y-2 text-sm">
                          <MetricLine label="Income" value={formatCurrency(item.income)} positive />
                          <MetricLine label="Expense" value={formatCurrency(item.expense)} />
                          <MetricLine label="Profit" value={formatCurrency(item.profit)} positive={item.profit >= 0} />
                        </div>
                      </Panel>
                    ))}
                  </div>
                )}

                {activePage === 'transactions' && (
                  <Panel title="All Transactions">
                    <div className="mb-4 grid gap-3 md:grid-cols-4">
                      <input
                        className="input-select md:col-span-2"
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search by business, category, or type"
                        value={searchQuery}
                      />
                      <select className="input-select" onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}>
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
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
                    <TransactionTable rows={filteredTransactions} />
                  </Panel>
                )}

                {activePage === 'reports' && (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <Panel title="Business Comparison (Bar)">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={businessComparisonData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                            <XAxis dataKey="business" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="income" fill="#16a34a" radius={6} />
                            <Bar dataKey="expense" fill="#dc2626" radius={6} />
                            <Bar dataKey="profit" fill="#0ea5e9" radius={6} />
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
                          Highest expense category: <strong>{highestExpenseCategory?.name ?? 'N/A'}</strong>
                        </li>
                        <li className="rounded-lg bg-[var(--panel-soft)] p-3">
                          Revenue to expense ratio:{' '}
                          <strong>{metrics.expenses === 0 ? 'N/A' : (metrics.revenue / metrics.expenses).toFixed(2)}x</strong>
                        </li>
                        <li className="rounded-lg bg-[var(--panel-soft)] p-3">
                          Growth trend: <strong>{metrics.growth >= 0 ? 'Positive momentum' : 'Needs cost controls'}</strong>
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
                        <p className="mt-1 text-sm text-[var(--text-muted)]">Choose visual mode for meetings and presentations.</p>
                        <button className="mt-3 input-select w-auto" onClick={() => setDarkMode((prev) => !prev)} type="button">
                          Switch to {darkMode ? 'Light' : 'Dark'} Mode
                        </button>
                      </div>

                      <div className="rounded-xl border border-[var(--border-color)] p-4">
                        <p className="font-semibold">Display Currency</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">Default set to INR for India business portfolio.</p>
                        <p className="mt-3 rounded-lg bg-[var(--panel-soft)] p-2 text-sm">Currency: INR (Rs)</p>
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

  return (
    <div className="panel-fade rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <div
          className={clsx(
            'grid h-10 w-10 place-items-center rounded-lg',
            trend === 'up'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
          )}
        >
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

function TransactionTable({ rows }) {
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
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t border-[var(--border-color)]" key={row.id}>
              <td className="px-4 py-3">{new Date(row.date).toLocaleDateString('en-IN')}</td>
              <td className="px-4 py-3">{row.business}</td>
              <td className="px-4 py-3">
                <span
                  className={clsx(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    row.type === 'income'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300',
                  )}
                >
                  {row.type}
                </span>
              </td>
              <td
                className={clsx(
                  'px-4 py-3 font-medium',
                  row.type === 'income' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300',
                )}
              >
                {formatCurrency(row.amount)}
              </td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{row.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="p-5 text-center text-[var(--text-muted)]">No transactions found for current filters.</p>}
    </div>
  )
}

export default App
