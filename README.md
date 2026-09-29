# 🪙 Gold Nexus Suite

Enterprise Pawn Brokerage, Gold Loan Management & Customer Mobile Passbook Ecosystem.

```
                          ┌───────────────────────────┐
                          │   Supabase (PostgreSQL)   │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │   Go Backend Serverless   │
                          │   (Vercel Edge / Go API)  │
                          └──────┬──────────┬─────────┘
                                 │          │
         ┌───────────────────────┘          └───────────────────────┐
         ▼                                                          ▼
┌─────────────────┐                                        ┌─────────────────┐
│  Pawn Broker    │                                        │ Customer Mobile │
│  Admin Portal   │                                        │ & Web Passbook  │
│  (Vercel SPA)   │                                        │ (Vercel SPA)    │
└─────────────────┘                                        └─────────────────┘
```

---

## 📁 Repository Structure

```
gold-nexus-suite/
├── api/                      # Native Vercel Go Serverless Function (Zero Cold Start)
│   └── index.go              # Edge router, CORS, Supabase Postgres Pooler handler
├── apps/
│   ├── gold-pawn-broker/     # Pawn Broker POS, A4 & 80mm Thermal Receipt Generator, Barcode/QR Scanner
│   └── nexus-gold-customer/  # Customer Doorstep Loan Calculator, Mobile Passbook & Online Repayments
├── backend/                  # Standalone Golang HTTP Server for local development & Docker
│   ├── main.go               # REST API, Seed Data, Supabase Postgres Connector
│   ├── Dockerfile            # Multi-stage production container build
│   ├── supabase/
│   │   └── schema.sql        # Supabase DDL (Tables, Indexes, RLS Policies, Seed Records)
│   └── .env.example
├── vercel.json               # Vercel Serverless Function routing
├── package.json              # NPM Workspaces Root
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### 1. Start the Golang Backend
```bash
cd backend
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
```

---

## 🗄️ Database Setup (Supabase)

1. Open your project in the [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor** tab.
3. Paste the contents of `backend/supabase/schema.sql` and click **Run**.
4. Navigate to **Project Settings** -> **Database** -> **Connection string** (URI).
5. Copy the connection URI and paste it into `backend/.env` as `DATABASE_URL`.

---

## 🚀 Live Production Links (Vercel)

- **Go Backend API**: [https://pawn-broker-api.vercel.app](https://pawn-broker-api.vercel.app)
- **Pawn Broker Admin**: [https://pawn-broker-admin.vercel.app](https://pawn-broker-admin.vercel.app)
- **Customer App**: [https://nexus-gold-customer.vercel.app](https://nexus-gold-customer.vercel.app)

---

## 📜 Key Features

- **Single-Page Calibrated A4 & 80mm Thermal Receipt Generator** with embedded real Code128 barcodes and verified digital passbook QR codes.
- **Hardware-Free Camera & Gun Scanner**: Scans real pawn tickets, packet labels, customer cards, and deep-link URLs.
- **Biometric Webcam Photo Capture** directly embedded in customer intake and mortgage creation.
- **Pawn Ticket Passbook Portal**: Endpoints allowing customers to scan ticket QR codes to view live mortgage balances, accrued interest, and settlement calculations.
