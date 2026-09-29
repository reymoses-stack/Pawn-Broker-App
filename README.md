# 🪙 Gold Nexus Suite

Enterprise Pawn Brokerage, Gold Loan Management, Customer Passbook & Business OS Ecosystem.

```
                          ┌───────────────────────────┐
                          │   Supabase (PostgreSQL)   │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │      Go Backend API       │
                          │   (localhost:8080/Cloud)  │
                          └──────┬──────────┬─────────┘
                                 │          │
         ┌───────────────────────┼──────────┴───────────────────────┐
         ▼                       ▼                                  ▼
┌─────────────────┐    ┌─────────────────┐                ┌──────────────────┐
│  Pawn Broker    │    │ Customer Mobile │                │ Business OS      │
│  Admin Portal   │    │ & Web App       │                │ & Analytics      │
│  (Vercel SPA)   │    │ (Vercel SPA)    │                │ (Vercel SPA)     │
└─────────────────┘    └─────────────────┘                └──────────────────┘
```

---

## 📁 Repository Structure

```
gold-nexus-suite/
├── apps/
│   ├── gold-pawn-broker/     # Pawn Broker POS, A4 & 80mm Thermal Receipt Generator, Barcode/QR Scanner
│   ├── nexus-gold-customer/  # Customer Doorstep Loan Calculator, Mobile Passbook & Online Repayments
│   └── gold-business-os/     # Executive Multi-Branch Dashboard, Liquidity & Capital Management
├── backend/                  # High-Performance Golang HTTP Server + Supabase DB Migrations
│   ├── main.go               # REST API, Seed Data, Supabase Postgres Connector
│   ├── supabase/
│   │   └── schema.sql        # Supabase DDL (Tables, Indexes, RLS Policies, Seed Records)
│   └── .env.example
├── package.json              # NPM Workspaces Root
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### 1. Start the Golang Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase Connection String (or run in fallback in-memory mode)
go run main.go
# Running on http://localhost:8080
```

### 2. Start the Frontend Applications
From the repository root:
```bash
# Run Pawn Broker Admin (Port 5174)
npm run dev:broker

# Run Customer App (Port 5173)
npm run dev:customer

# Run Business OS (Port 5175)
npm run dev:business
```

---

## 🗄️ Database Setup (Supabase)

1. Open your project in the [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor** tab.
3. Paste the contents of [`backend/supabase/schema.sql`](file:///Users/revanthmoses/.gemini/antigravity-ide/scratch/gold-nexus-suite/backend/supabase/schema.sql) and click **Run**.
4. Navigate to **Project Settings** -> **Database** -> **Connection string** (URI).
5. Copy the connection URI and paste it into `backend/.env` as `DATABASE_URL`.

---

## 🚀 Vercel Deployment Guide

Deploy each frontend app directly to Vercel:

### App 1: Pawn Broker Admin Portal (`apps/gold-pawn-broker`)
- **Root Directory**: `apps/gold-pawn-broker`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Your deployed Go Backend URL (or leave empty for fallback)

### App 2: Customer App (`apps/nexus-gold-customer`)
- **Root Directory**: `apps/nexus-gold-customer`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Your deployed Go Backend URL

### App 3: Business OS (`apps/gold-business-os`)
- **Root Directory**: `apps/gold-business-os`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Your deployed Go Backend URL

---

## ☁️ Backend Deployment Guide (Render / Railway / Fly.io)

### Deploying to Render
1. Connect this GitHub repository.
2. Select **Web Service**.
3. Set **Root Directory**: `backend`
4. Set **Environment**: `Go`
5. **Build Command**: `go build -o server main.go`
6. **Start Command**: `./server`
7. Add Environment Variable:
   - `DATABASE_URL`: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
   - `PORT`: `8080` (or Render default)

---

## 📜 Key Features

- **Single-Page Calibrated A4 & 80mm Thermal Receipt Generator** with embedded real Code128 barcodes and verified digital passbook QR codes.
- **Hardware-Free Camera & Gun Scanner**: Scans real pawn tickets, packet labels, customer cards, and deep-link URLs.
- **Biometric Webcam Photo Capture** directly embedded in customer intake and mortgage creation.
- **Pawn Ticket Passbook Portal**: Endpoints allowing customers to scan ticket QR codes to view live mortgage balances, accrued interest, and settlement calculations.
