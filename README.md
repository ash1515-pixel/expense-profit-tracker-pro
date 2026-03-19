# Multi-Business Expense & Profit Management Platform

Advanced accounting-style web app for managing multiple businesses with data entry, analytics, authentication, and monthly report exports.

Resume line:
`Built a multi-business expense and profit management platform with editable transaction workflows, cloud-ready auth/database sync, KPI analytics, and monthly PDF/Excel report export.`

## Stack

- React + Vite
- Tailwind CSS v4
- Recharts
- Lucide Icons
- XLSX
- jsPDF + jspdf-autotable
- Supabase JS (optional cloud auth/db)
- Python openpyxl (advanced Excel workbook generator)

## Core Features

- SaaS-style layout (sidebar, topbar, KPI cards, charts)
- Business management:
  - Add business
  - Edit business
  - Delete business
- Entry management per business:
  - Add / edit / delete entries
  - Types: `revenue`, `income`, `expense`, `investment`, `purchase`
  - Purchase details: item, vendor, category, note
- Financial KPIs:
  - Revenue, Income, Expenses, Purchases, Investments
  - Operating Profit, Net Cashflow, Monthly Growth
- Analytics:
  - Cashflow trend line chart
  - Cost category pie chart
  - Business comparison bar chart
- Reports:
  - Month + business filtered reports
  - Export Excel and PDF
- Auth and data modes:
  - Local mode (default): localStorage
  - Cloud mode (Supabase): auth + sync
- Dark mode with persistence

## Local Setup

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm run lint
npm run build
```

## Optional Cloud Setup (Supabase)

1. Copy `.env.example` to `.env`
2. Fill values:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

3. Create required tables/policies using handbook SQL:
- [`docs/PROJECT_HANDBOOK.md`](docs/PROJECT_HANDBOOK.md)

## Advanced Excel Artifact

Generate workbook:

```bash
npm run excel:generate
```

Output:
- `output/spreadsheet/Expense_Profit_Tracker_Advanced.xlsx`

## Handbook

- Full implementation and setup handbook:
  - [`docs/PROJECT_HANDBOOK.md`](docs/PROJECT_HANDBOOK.md)
