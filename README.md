# Multi-Business Expense & Profit Analytics Dashboard

Advanced finance web app for tracking income and expenses across multiple businesses, with KPI analytics and visual reporting.

Resume line:
`Built a multi-business expense and profit analytics dashboard with real-time KPI visualization, filtering, search/sort controls, and executive reporting views.`

## Stack

- React + Vite
- Tailwind CSS v4
- Recharts
- Lucide Icons

## Core Features

- SaaS-style UI with sidebar, topbar, and responsive dashboard layout
- Business selector (`Cafe`, `Travel`, `Textile`, `Hardware`, or all businesses)
- Date range filters (`30d`, `90d`, `12 months`, `all time`)
- KPI cards:
  - Total Revenue
  - Total Expenses
  - Net Profit
  - Monthly Growth %
- Visual reports:
  - Line chart for profit trends
  - Pie chart for expense categories
  - Bar chart for cross-business comparison
- Transactions module:
  - Search
  - Type filter (`income` / `expense`)
  - Sort toggle (`date` / `amount`, `asc` / `desc`)
- Multi-page sections:
  - Dashboard
  - Businesses
  - Transactions
  - Reports
  - Settings
- Theme toggle (dark/light mode) with persisted preference
- Loading skeletons for better UX
- Advanced Excel model included at `output/spreadsheet/Expense_Profit_Tracker_Advanced.xlsx`
  - Formula-driven KPI summary
  - Multi-business comparison tables
  - Native Excel charts (line, pie, bar)

## Run Locally

```bash
npm install
npm run dev
```

## Generate the Excel Model

```bash
python3 scripts/generate_excel_tracker.py
```

## Quality Checks

```bash
npm run lint
npm run build
```

## Project Goal

This project is intentionally designed like a mini accounting SaaS (Zoho-style) to demonstrate:

- Product thinking
- Financial analytics modeling
- Dashboard UX skills
- Frontend engineering execution suitable for MBA/portfolio showcase
