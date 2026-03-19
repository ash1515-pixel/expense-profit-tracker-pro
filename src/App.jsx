import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { createClient } from '@supabase/supabase-js'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Pencil,
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
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

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
  localUser: 'expense-tracker-local-user',
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
const getCurrentMonth = () => new Date().toISOString().slice(0, 7)

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

const impactSign = (type) => (type === 'revenue' || type === 'income' ? 1 : -1)
const entryTone = (type) => {
  if (type === 'revenue' || type === 'income') return 'good'
  if (type === 'investment') return 'neutral'
  return 'bad'
}

const toCloudBusiness = (business, userId) => ({
  id: business.id,
  user_id: userId,
  name: business.name,
  sector: business.sector,
  created_at: business.createdAt,
})

const toCloudEntry = (entry, userId) => ({
  id: entry.id,
  user_id: userId,
  business_id: entry.businessId,
  date: entry.date,
  type: entry.type,
  amount: entry.amount,
  category: entry.category,
  item_name: entry.itemName,
  vendor: entry.vendor,
  note: entry.note,
})

const fromCloudBusiness = (row) => ({
  id: row.id,
  name: row.name,
  sector: row.sector || 'General',
  createdAt: row.created_at || getToday(),
})

const fromCloudEntry = (row) => ({
  id: row.id,
  businessId: row.business_id,
  date: row.date,
  type: row.type,
  amount: Number(row.amount),
  category: row.category || 'General',
  itemName: row.item_name || '',
  vendor: row.vendor || '',
  note: row.note || '',
})

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
  const [statusMessage, setStatusMessage] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authReady, setAuthReady] = useState(false)
  const [sessionUser, setSessionUser] = useState(null)
  const [authForm, setAuthForm] = useState({ email: '', password: '' })

  const [businesses, setBusinesses] = useState(() => safeParse(localStorage.getItem(STORAGE_KEYS.businesses), INITIAL_BUSINESSES))
  const [entries, setEntries] = useState(() => safeParse(localStorage.getItem(STORAGE_KEYS.entries), INITIAL_ENTRIES))

  const [businessForm, setBusinessForm] = useState({ id: '', name: '', sector: '' })
  const [entryForm, setEntryForm] = useState({
    id: '',
    date: getToday(),
    businessId: businesses[0]?.id || '',
    type: 'revenue',
    amount: '',
    category: '',
    itemName: '',
    vendor: '',
    note: '',
  })

  const [reportMonth, setReportMonth] = useState(getCurrentMonth())
  const [reportBusinessId, setReportBusinessId] = useState('all')

  const cloudEnabled = Boolean(supabase)

  const showStatus = (message) => {
    setStatusMessage(message)
    window.setTimeout(() => setStatusMessage(''), 2400)
  }

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
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const init = async () => {
      if (cloudEnabled) {
        const { data } = await supabase.auth.getSession()
        setSessionUser(data.session?.user ?? null)
        setAuthReady(true)
      } else {
        const localUser = localStorage.getItem(STORAGE_KEYS.localUser)
        setSessionUser(localUser ? JSON.parse(localUser) : null)
        setAuthReady(true)
      }
    }

    init()

    if (!cloudEnabled) return () => {}

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null)
      setAuthReady(true)
    })

    return () => subscription.unsubscribe()
  }, [cloudEnabled])

  useEffect(() => {
    if (!cloudEnabled || !sessionUser) return

    const loadCloudData = async () => {
      const [{ data: cloudBusinesses }, { data: cloudEntries }] = await Promise.all([
        supabase.from('businesses').select('*').eq('user_id', sessionUser.id),
        supabase.from('entries').select('*').eq('user_id', sessionUser.id),
      ])

      if (Array.isArray(cloudBusinesses) && cloudBusinesses.length) {
        setBusinesses(cloudBusinesses.map(fromCloudBusiness))
      }

      if (Array.isArray(cloudEntries) && cloudEntries.length) {
        setEntries(cloudEntries.map(fromCloudEntry))
      }
    }

    loadCloudData()
  }, [cloudEnabled, sessionUser])

  const businessMap = useMemo(() => new Map(businesses.map((business) => [business.id, business.name])), [businesses])

  const scopedEntries = useMemo(() => {
    const byDate = applyDateFilter(entries, dateFilter)
    if (selectedBusiness === 'all') return byDate
    return byDate.filter((item) => item.businessId === selectedBusiness)
  }, [entries, dateFilter, selectedBusiness])

  const filteredEntries = useMemo(() => {
    let data = scopedEntries.map((item) => ({ ...item, businessName: businessMap.get(item.businessId) || 'Unknown' }))

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
  }, [scopedEntries, businessMap, typeFilter, searchQuery, sortBy, sortDirection])

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

    const currentMonthKey = getCurrentMonth()
    const previousDate = new Date()
    previousDate.setMonth(previousDate.getMonth() - 1)
    const previousMonthKey = previousDate.toISOString().slice(0, 7)

    const currentMonth = scopedEntries
      .filter((item) => item.date.startsWith(currentMonthKey))
      .reduce((sum, item) => sum + item.amount * impactSign(item.type), 0)

    const previousMonth = scopedEntries
      .filter((item) => item.date.startsWith(previousMonthKey))
      .reduce((sum, item) => sum + item.amount * impactSign(item.type), 0)

    const growth = previousMonth === 0 ? 100 : ((currentMonth - previousMonth) / Math.abs(previousMonth)) * 100

    return { ...totals, grossInflow, outflow, operatingProfit, netCashflow, growth }
  }, [scopedEntries])

  const trendData = useMemo(() => {
    const byMonth = scopedEntries.reduce((acc, item) => {
      const key = monthLabel(item.date)
      if (!acc[key]) acc[key] = { month: key, inflow: 0, outflow: 0, net: 0 }
      if (item.type === 'revenue' || item.type === 'income') acc[key].inflow += item.amount
      if (item.type === 'expense' || item.type === 'purchase' || item.type === 'investment') acc[key].outflow += item.amount
      acc[key].net = acc[key].inflow - acc[key].outflow
      return acc
    }, {})

    return Object.values(byMonth)
  }, [scopedEntries])

  const expenseCategoryData = useMemo(() => {
    const byCategory = scopedEntries
      .filter((item) => item.type === 'expense' || item.type === 'purchase')
      .reduce((acc, item) => {
        const category = item.category || 'Uncategorized'
        acc[category] = (acc[category] ?? 0) + item.amount
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

  const reportEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.date.startsWith(reportMonth))
      .filter((entry) => reportBusinessId === 'all' || entry.businessId === reportBusinessId)
      .map((entry) => ({ ...entry, businessName: businessMap.get(entry.businessId) || 'Unknown' }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [entries, reportMonth, reportBusinessId, businessMap])

  const reportTotals = useMemo(() => {
    const revenue = reportEntries.filter((entry) => entry.type === 'revenue').reduce((sum, entry) => sum + entry.amount, 0)
    const income = reportEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
    const expense = reportEntries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
    const purchase = reportEntries.filter((entry) => entry.type === 'purchase').reduce((sum, entry) => sum + entry.amount, 0)
    const investment = reportEntries.filter((entry) => entry.type === 'investment').reduce((sum, entry) => sum + entry.amount, 0)
    const net = revenue + income - expense - purchase - investment
    return { revenue, income, expense, purchase, investment, net }
  }, [reportEntries])

  const sectionTitle = NAV_ITEMS.find((item) => item.id === activePage)?.label ?? 'Dashboard'

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    const email = authForm.email.trim()
    const password = authForm.password
    if (!email || !password) return

    if (cloudEnabled) {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        showStatus(error ? error.message : 'Signup success. Check email confirmation if enabled.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) showStatus(error.message)
      }
      return
    }

    const fakeUser = { id: 'local-user', email }
    localStorage.setItem(STORAGE_KEYS.localUser, JSON.stringify(fakeUser))
    setSessionUser(fakeUser)
    showStatus('Logged in (local mode).')
  }

  const handleLogout = async () => {
    if (cloudEnabled) {
      await supabase.auth.signOut()
    } else {
      localStorage.removeItem(STORAGE_KEYS.localUser)
      setSessionUser(null)
    }
  }

  const saveBusinessCloud = async (business) => {
    if (!cloudEnabled || !sessionUser) return
    await supabase.from('businesses').upsert([toCloudBusiness(business, sessionUser.id)])
  }

  const deleteBusinessCloud = async (businessId) => {
    if (!cloudEnabled || !sessionUser) return
    await Promise.all([
      supabase.from('businesses').delete().eq('id', businessId).eq('user_id', sessionUser.id),
      supabase.from('entries').delete().eq('business_id', businessId).eq('user_id', sessionUser.id),
    ])
  }

  const saveEntryCloud = async (entry) => {
    if (!cloudEnabled || !sessionUser) return
    await supabase.from('entries').upsert([toCloudEntry(entry, sessionUser.id)])
  }

  const deleteEntryCloud = async (entryId) => {
    if (!cloudEnabled || !sessionUser) return
    await supabase.from('entries').delete().eq('id', entryId).eq('user_id', sessionUser.id)
  }

  const handleBusinessSubmit = async (event) => {
    event.preventDefault()
    const name = businessForm.name.trim()
    if (!name) return

    if (businessForm.id) {
      const updated = { ...businessForm, name, sector: businessForm.sector.trim() || 'General' }
      setBusinesses((prev) => prev.map((business) => (business.id === businessForm.id ? updated : business)))
      await saveBusinessCloud(updated)
      showStatus('Business updated.')
    } else {
      const duplicate = businesses.some((business) => business.name.toLowerCase() === name.toLowerCase())
      if (duplicate) {
        showStatus('Business name already exists.')
        return
      }
      const created = {
        id: `b-${crypto.randomUUID()}`,
        name,
        sector: businessForm.sector.trim() || 'General',
        createdAt: getToday(),
      }
      setBusinesses((prev) => [...prev, created])
      setEntryForm((prev) => ({ ...prev, businessId: created.id }))
      await saveBusinessCloud(created)
      showStatus('Business added.')
    }

    setBusinessForm({ id: '', name: '', sector: '' })
  }

  const editBusiness = (business) => {
    setBusinessForm({ id: business.id, name: business.name, sector: business.sector })
    setActivePage('businesses')
  }

  const deleteBusiness = async (businessId) => {
    setBusinesses((prev) => prev.filter((business) => business.id !== businessId))
    setEntries((prev) => prev.filter((entry) => entry.businessId !== businessId))
    if (selectedBusiness === businessId) setSelectedBusiness('all')
    if (entryForm.businessId === businessId) setEntryForm((prev) => ({ ...prev, businessId: businesses[0]?.id || '' }))
    await deleteBusinessCloud(businessId)
    showStatus('Business deleted.')
  }

  const handleEntrySubmit = async (event) => {
    event.preventDefault()
    const amount = Number(entryForm.amount)
    if (!entryForm.businessId || !Number.isFinite(amount) || amount <= 0) return

    const payload = {
      id: entryForm.id || `e-${crypto.randomUUID()}`,
      date: entryForm.date || getToday(),
      businessId: entryForm.businessId,
      type: entryForm.type,
      amount,
      category: entryForm.category.trim() || 'General',
      itemName: entryForm.itemName.trim(),
      vendor: entryForm.vendor.trim(),
      note: entryForm.note.trim(),
    }

    if (entryForm.id) {
      setEntries((prev) => prev.map((entry) => (entry.id === entryForm.id ? payload : entry)))
      showStatus('Entry updated.')
    } else {
      setEntries((prev) => [payload, ...prev])
      showStatus('Entry added.')
    }

    await saveEntryCloud(payload)

    setEntryForm((prev) => ({
      ...prev,
      id: '',
      date: getToday(),
      amount: '',
      category: '',
      itemName: '',
      vendor: '',
      note: '',
    }))
  }

  const editEntry = (entry) => {
    setEntryForm({
      id: entry.id,
      date: entry.date,
      businessId: entry.businessId,
      type: entry.type,
      amount: String(entry.amount),
      category: entry.category,
      itemName: entry.itemName,
      vendor: entry.vendor,
      note: entry.note,
    })
    setActivePage('transactions')
  }

  const deleteEntry = async (entryId) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId))
    await deleteEntryCloud(entryId)
    showStatus('Entry deleted.')
  }

  const exportMonthlyExcel = () => {
    const summaryRows = [
      ['Business', reportBusinessId === 'all' ? 'All Businesses' : businessMap.get(reportBusinessId) || 'Unknown'],
      ['Month', reportMonth],
      ['Revenue', reportTotals.revenue],
      ['Income', reportTotals.income],
      ['Expense', reportTotals.expense],
      ['Purchase', reportTotals.purchase],
      ['Investment', reportTotals.investment],
      ['Net', reportTotals.net],
    ]

    const transactionRows = reportEntries.map((entry) => ({
      Date: entry.date,
      Business: entry.businessName,
      Type: entry.type,
      Amount: entry.amount,
      Category: entry.category,
      Item: entry.itemName,
      Vendor: entry.vendor,
      Note: entry.note,
    }))

    const workbook = XLSX.utils.book_new()
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
    const txSheet = XLSX.utils.json_to_sheet(transactionRows)

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    XLSX.utils.book_append_sheet(workbook, txSheet, 'Entries')

    const businessName = reportBusinessId === 'all' ? 'all-businesses' : (businessMap.get(reportBusinessId) || 'business').toLowerCase()
    XLSX.writeFile(workbook, `expense-report-${businessName}-${reportMonth}.xlsx`)
    showStatus('Excel exported.')
  }

  const exportMonthlyPdf = () => {
    const doc = new jsPDF()
    const businessLabel = reportBusinessId === 'all' ? 'All Businesses' : businessMap.get(reportBusinessId) || 'Unknown'

    doc.setFontSize(16)
    doc.text('Monthly Business Report', 14, 15)
    doc.setFontSize(11)
    doc.text(`Business: ${businessLabel}`, 14, 23)
    doc.text(`Month: ${reportMonth}`, 14, 29)
    doc.text(`Net: ${formatCurrency(reportTotals.net)}`, 14, 35)

    autoTable(doc, {
      startY: 42,
      head: [['Date', 'Business', 'Type', 'Amount', 'Category', 'Item', 'Vendor']],
      body: reportEntries.map((entry) => [
        entry.date,
        entry.businessName,
        entry.type,
        formatCurrency(entry.amount),
        entry.category,
        entry.itemName || '-',
        entry.vendor || '-',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [31, 78, 120] },
    })

    const businessName = reportBusinessId === 'all' ? 'all-businesses' : (businessMap.get(reportBusinessId) || 'business').toLowerCase()
    doc.save(`expense-report-${businessName}-${reportMonth}.pdf`)
    showStatus('PDF exported.')
  }

  const renderSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[...Array(4)].map((_, idx) => (
        <div className="skeleton-panel h-28" key={idx} />
      ))}
    </div>
  )

  if (!authReady || loading) {
    return <div className="grid min-h-screen place-items-center text-[var(--text-muted)]">Loading workspace...</div>
  }

  if (!sessionUser) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--app-bg)] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-6">
          <h1 className="text-xl font-semibold">Business Management Login</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {cloudEnabled ? 'Supabase cloud auth enabled' : 'Local auth mode (set VITE_SUPABASE_URL/ANON_KEY for cloud)'}
          </p>

          <form className="mt-4 space-y-3" onSubmit={handleAuthSubmit}>
            <input
              className="input-select w-full"
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <input
              className="input-select w-full"
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            <button className="input-select w-full bg-green-600 text-white" type="submit">
              {authMode === 'signup' ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <button
            className="mt-3 text-sm text-[var(--text-muted)] underline"
            onClick={() => setAuthMode((prev) => (prev === 'login' ? 'signup' : 'login'))}
            type="button"
          >
            {authMode === 'login' ? 'Create account' : 'Already have account? Login'}
          </button>

          {statusMessage && <p className="mt-3 text-sm text-emerald-600">{statusMessage}</p>}
        </div>
      </div>
    )
  }

  const section = (
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
            <KpiCard icon={metrics.operatingProfit >= 0 ? TrendingUp : TrendingDown} label="Operating Profit" value={formatCurrency(metrics.operatingProfit)} trend={metrics.operatingProfit >= 0 ? 'up' : 'down'} />
            <KpiCard icon={metrics.netCashflow >= 0 ? TrendingUp : TrendingDown} label="Net Cashflow" value={formatCurrency(metrics.netCashflow)} trend={metrics.netCashflow >= 0 ? 'up' : 'down'} />
            <KpiCard icon={metrics.growth >= 0 ? ArrowUpRight : ArrowDownRight} label="Monthly Growth" value={`${metrics.growth.toFixed(1)}%`} trend={metrics.growth >= 0 ? 'up' : 'down'} />
            <KpiCard icon={Building2} label="Active Businesses" value={`${businesses.length}`} trend="neutral" />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Panel className="xl:col-span-2" title="Cashflow Trend">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
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
            <TransactionTable rows={filteredEntries.slice(0, 8)} onDelete={deleteEntry} onEdit={editEntry} />
          </Panel>
        </>
      )}

      {activePage === 'businesses' && (
        <div className="space-y-4">
          <Panel title={businessForm.id ? 'Edit Business' : 'Add Business'}>
            <form className="grid gap-3 md:grid-cols-4" onSubmit={handleBusinessSubmit}>
              <input className="input-select" placeholder="Business name" value={businessForm.name} onChange={(event) => setBusinessForm((prev) => ({ ...prev, name: event.target.value }))} />
              <input className="input-select" placeholder="Sector" value={businessForm.sector} onChange={(event) => setBusinessForm((prev) => ({ ...prev, sector: event.target.value }))} />
              <button className="input-select bg-green-600 text-white" type="submit">{businessForm.id ? 'Update Business' : 'Add Business'}</button>
              <button className="input-select" type="button" onClick={() => setBusinessForm({ id: '', name: '', sector: '' })}>Clear</button>
            </form>
          </Panel>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {businesses.map((business) => {
              const stats = businessComparisonData.find((item) => item.business === business.name) || {
                revenue: 0,
                income: 0,
                expense: 0,
                purchase: 0,
                investment: 0,
                net: 0,
              }

              return (
                <Panel key={business.id} title={business.name}>
                  <p className="mb-2 text-xs text-[var(--text-muted)]">{business.sector}</p>
                  <div className="space-y-2 text-sm">
                    <MetricLine label="Revenue" value={formatCurrency(stats.revenue)} positive />
                    <MetricLine label="Income" value={formatCurrency(stats.income)} positive />
                    <MetricLine label="Expense" value={formatCurrency(stats.expense)} />
                    <MetricLine label="Purchase" value={formatCurrency(stats.purchase)} />
                    <MetricLine label="Investment" value={formatCurrency(stats.investment)} />
                    <MetricLine label="Net" value={formatCurrency(stats.net)} positive={stats.net >= 0} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="input-select h-9" type="button" onClick={() => editBusiness(business)}>
                      <Pencil size={14} />
                    </button>
                    <button className="input-select h-9 text-rose-600" type="button" onClick={() => deleteBusiness(business.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Panel>
              )
            })}
          </div>
        </div>
      )}

      {activePage === 'transactions' && (
        <div className="space-y-4">
          <Panel title={entryForm.id ? 'Edit Entry' : 'Add Entry'}>
            <form className="grid gap-3 md:grid-cols-4" onSubmit={handleEntrySubmit}>
              <input type="date" className="input-select" value={entryForm.date} onChange={(event) => setEntryForm((prev) => ({ ...prev, date: event.target.value }))} />
              <select className="input-select" value={entryForm.businessId} onChange={(event) => setEntryForm((prev) => ({ ...prev, businessId: event.target.value }))}>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              <select className="input-select" value={entryForm.type} onChange={(event) => setEntryForm((prev) => ({ ...prev, type: event.target.value }))}>
                {ENTRY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input type="number" min="0" step="0.01" className="input-select" placeholder="Amount" value={entryForm.amount} onChange={(event) => setEntryForm((prev) => ({ ...prev, amount: event.target.value }))} />
              <input className="input-select" placeholder="Category" value={entryForm.category} onChange={(event) => setEntryForm((prev) => ({ ...prev, category: event.target.value }))} />
              <input className="input-select" placeholder="Purchased item" value={entryForm.itemName} onChange={(event) => setEntryForm((prev) => ({ ...prev, itemName: event.target.value }))} />
              <input className="input-select" placeholder="Vendor" value={entryForm.vendor} onChange={(event) => setEntryForm((prev) => ({ ...prev, vendor: event.target.value }))} />
              <input className="input-select" placeholder="Notes" value={entryForm.note} onChange={(event) => setEntryForm((prev) => ({ ...prev, note: event.target.value }))} />
              <button className="input-select bg-green-600 text-white md:col-span-2" type="submit">
                {entryForm.id ? 'Update Entry' : 'Save Entry'}
              </button>
              <button
                className="input-select md:col-span-2"
                type="button"
                onClick={() =>
                  setEntryForm((prev) => ({
                    ...prev,
                    id: '',
                    date: getToday(),
                    amount: '',
                    category: '',
                    itemName: '',
                    vendor: '',
                    note: '',
                  }))
                }
              >
                Clear
              </button>
            </form>
          </Panel>

          <Panel title="All Entries">
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              <input className="input-select md:col-span-2" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by business, category, item, vendor" />
              <select className="input-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">All Types</option>
                {ENTRY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button
                className="input-select text-left"
                type="button"
                onClick={() => {
                  setSortBy((prev) => (prev === 'date' ? 'amount' : 'date'))
                  setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                }}
              >
                Sort: {sortBy} ({sortDirection})
              </button>
            </div>
            <TransactionTable rows={filteredEntries} onDelete={deleteEntry} onEdit={editEntry} />
          </Panel>
        </div>
      )}

      {activePage === 'reports' && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Monthly Export">
            <div className="grid gap-3 md:grid-cols-2">
              <input type="month" className="input-select" value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} />
              <select className="input-select" value={reportBusinessId} onChange={(event) => setReportBusinessId(event.target.value)}>
                <option value="all">All Businesses</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              <button className="input-select flex items-center justify-center gap-2" type="button" onClick={exportMonthlyExcel}>
                <Download size={15} /> Export Excel
              </button>
              <button className="input-select flex items-center justify-center gap-2" type="button" onClick={exportMonthlyPdf}>
                <Download size={15} /> Export PDF
              </button>
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <MetricLine label="Revenue" value={formatCurrency(reportTotals.revenue)} positive />
              <MetricLine label="Income" value={formatCurrency(reportTotals.income)} positive />
              <MetricLine label="Expense" value={formatCurrency(reportTotals.expense)} />
              <MetricLine label="Purchase" value={formatCurrency(reportTotals.purchase)} />
              <MetricLine label="Investment" value={formatCurrency(reportTotals.investment)} />
              <MetricLine label="Net" value={formatCurrency(reportTotals.net)} positive={reportTotals.net >= 0} />
            </div>
          </Panel>

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

          <Panel className="xl:col-span-2" title="Insights Snapshot">
            <ul className="grid gap-3 text-sm text-[var(--text-muted)] md:grid-cols-2">
              <li className="rounded-lg bg-[var(--panel-soft)] p-3">Best performer: <strong>{bestPerformer?.business ?? 'N/A'}</strong></li>
              <li className="rounded-lg bg-[var(--panel-soft)] p-3">Highest cost category: <strong>{highestCostCategory?.name ?? 'N/A'}</strong></li>
              <li className="rounded-lg bg-[var(--panel-soft)] p-3">Gross inflow: <strong>{formatCurrency(metrics.grossInflow)}</strong></li>
              <li className="rounded-lg bg-[var(--panel-soft)] p-3">Operational outflow: <strong>{formatCurrency(metrics.outflow)}</strong></li>
            </ul>
          </Panel>
        </div>
      )}

      {activePage === 'settings' && (
        <Panel title="Workspace Settings">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--border-color)] p-4">
              <p className="font-semibold">Theme</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Switch mode for presentation and day usage.</p>
              <button className="mt-3 input-select w-auto" onClick={() => setDarkMode((prev) => !prev)} type="button">
                Switch to {darkMode ? 'Light' : 'Dark'}
              </button>
            </div>
            <div className="rounded-xl border border-[var(--border-color)] p-4">
              <p className="font-semibold">Data & Auth</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Mode: {cloudEnabled ? 'Supabase Cloud' : 'Local Browser Storage'}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Businesses: {businesses.length} | Entries: {entries.length}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">User: {sessionUser?.email || 'Local User'}</p>
            </div>
          </div>
        </Panel>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(22,163,74,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.14),transparent_32%)]" />

      {mobileNavOpen && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setMobileNavOpen(false)} role="presentation" />}

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
            <p className="font-semibold text-[var(--text-primary)]">Live Mode</p>
            <p className="mt-1">Create, edit, delete, export, and analyze all business data.</p>
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
                <select className="input-select" value={selectedBusiness} onChange={(event) => setSelectedBusiness(event.target.value)}>
                  <option value="all">All Businesses</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>

                <select className="input-select" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="365d">Last 12 Months</option>
                  <option value="all">All Time</option>
                </select>

                <button className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border-color)] bg-[var(--panel-soft)]" onClick={() => setDarkMode((prev) => !prev)} type="button">
                  {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                </button>

                <button className="input-select flex items-center gap-2" onClick={handleLogout} type="button">
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>
          </header>

          <section className="space-y-6 p-4 md:p-6">{loading ? renderSkeleton() : section}</section>
        </main>
      </div>

      {statusMessage && <div className="fixed bottom-4 right-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">{statusMessage}</div>}
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

function TransactionTable({ rows, onDelete, onEdit }) {
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
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const tone = entryTone(row.type)
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
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-[var(--border-color)] p-2" onClick={() => onEdit(row)} type="button">
                      <Pencil size={13} />
                    </button>
                    <button className="rounded-lg border border-[var(--border-color)] p-2 text-rose-600" onClick={() => onDelete(row.id)} type="button">
                      <Trash2 size={13} />
                    </button>
                  </div>
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
