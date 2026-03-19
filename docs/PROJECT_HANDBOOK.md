# Expense & Profit Tracker - Project Handbook

## 1. Project Summary

**Project Name:** Expense & Profit Tracker (Advanced Excel + Web App)

**Live URL:** https://expense-profit-tracker-f1v266u19-ac858247-gmailcoms-projects.vercel.app

**GitHub:** https://github.com/ash1515-pixel/expense-profit-tracker-pro

This project is a mini accounting and business management platform (Zoho-style) for handling multi-business operations with data-entry workflows, analytics dashboards, and downloadable management reports.

---

## 2. Business Problem Solved

Traditional student projects are view-only dashboards.

This project solves real operational needs:
- Add and manage multiple businesses
- Enter real financial transactions by business
- Track revenue, income, expenses, investments, and purchases
- Record purchased items with vendor information
- View actionable KPIs and trends
- Export monthly reports for management review (PDF + Excel)

---

## 3. Core Features Implemented

### 3.1 Business Management
- Create business (name + sector)
- Edit business
- Delete business
- Per-business analytics cards

### 3.2 Entry Management
- Add entries with:
  - Date
  - Business
  - Type (`revenue`, `income`, `expense`, `investment`, `purchase`)
  - Amount
  - Category
  - Purchased item name
  - Vendor
  - Notes
- Edit entry
- Delete entry
- Search, filter, and sort entries

### 3.3 Financial Analytics
- KPI cards:
  - Revenue
  - Income
  - Expenses
  - Purchases
  - Investments
  - Operating Profit
  - Net Cashflow
  - Monthly Growth
- Charts:
  - Cashflow trend (line)
  - Cost distribution by category (pie)
  - Business comparison (bar)

### 3.4 Reports & Export
- Monthly report filters by:
  - Month
  - Business or all businesses
- Export monthly report to:
  - Excel (`.xlsx`)
  - PDF (`.pdf`)

### 3.5 Auth + Storage
- Login/signup UI
- Works in two modes:
  - **Local Mode** (default fallback): browser localStorage
  - **Cloud Mode**: Supabase auth + database sync when env vars are configured

---

## 4. Tech Stack

- React + Vite
- Tailwind CSS (custom theming)
- Recharts
- Lucide Icons
- XLSX (Excel export)
- jsPDF + jspdf-autotable (PDF export)
- Supabase JS SDK (optional cloud auth/db)
- openpyxl (advanced Excel workbook generator script)

---

## 5. Folder & File Guide

- `src/App.jsx` -> main application logic and UI
- `src/index.css` -> theme and shared styles
- `scripts/generate_excel_tracker.py` -> advanced Excel workbook generator
- `output/spreadsheet/Expense_Profit_Tracker_Advanced.xlsx` -> generated workbook
- `.env.example` -> cloud mode env template

---

## 6. Local Setup

```bash
npm install
npm run dev
```

Build and lint:

```bash
npm run lint
npm run build
```

Generate advanced Excel workbook:

```bash
npm run excel:generate
```

---

## 7. Supabase Cloud Setup (Optional)

Create a `.env` file using `.env.example`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 7.1 Required SQL Tables

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists businesses (
  id text primary key,
  user_id uuid not null,
  name text not null,
  sector text,
  created_at date,
  inserted_at timestamptz default now()
);

create table if not exists entries (
  id text primary key,
  user_id uuid not null,
  business_id text not null,
  date date not null,
  type text not null,
  amount numeric not null,
  category text,
  item_name text,
  vendor text,
  note text,
  inserted_at timestamptz default now()
);

alter table businesses enable row level security;
alter table entries enable row level security;

create policy "businesses owner policy"
on businesses for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "entries owner policy"
on entries for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

---

## 8. Portfolio Resume Description

Use this line:

**“Built a multi-business expense and profit management platform with editable transaction workflows, cloud-ready auth/database sync, KPI analytics, and monthly PDF/Excel report export.”**

---

## 9. Suggested Demo Flow

1. Login
2. Create a new business
3. Add revenue, expense, purchase, and investment entries
4. Show KPI change on dashboard in real-time
5. Open Reports page and filter by month/business
6. Export PDF and Excel reports

---

## 10. Known Notes

- If Supabase env vars are missing, app automatically uses local mode.
- Cloud sync expects `businesses` and `entries` tables to be present.
- Build warning about large JS bundle is currently due export + chart libraries in one bundle; can be reduced later via code-splitting.
