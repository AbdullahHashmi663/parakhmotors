# Parakh Motors 🚗

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://parakhmotors.vercel.app)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

> **A luxury automotive dealership experience built with Next.js App Router, Supabase PostgreSQL, and modern motion design.**

🌐 **Live Website**: [https://parakhmotors.vercel.app](https://parakhmotors.vercel.app)

---

## 🌟 Key Features

- **Automotive Inventory & Catalog**: Real-time vehicle listings with high-resolution imagery and specifications.
- **Forensic Inspection HUD**: Interactive vehicle inspection breakdowns and transparent grading.
- **Customer Portals**: Sell-my-car appraisal requests, tailored car-finder requests, and test-drive inquiries.
- **Theme & Brand Studio**: Dealership branding, customizable theme tokens, and dynamic styling.
- **Full Backend API**: Built-in RESTful API endpoints backed by Supabase PostgreSQL.
- **Admin Dashboard**: Comprehensive management interface for inventory, requests, and dealership settings.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm

### Environment Setup
Create a `.env.local` file in the project root:
```env
DATABASE_URL="your-supabase-connection-string"
ADMIN_PASSWORD="your-admin-password"
ADMIN_SESSION_SECRET="your-session-secret"
DATABASE_SSL_CA_PATH="supabase/certs/prod-ca-2021.crt"
```

### Installation & Development
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (Turbopack, App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS & CSS Modules (Design Token Architecture)
- **Database**: PostgreSQL (Supabase) via `pg` connection pooling
- **Deployment**: Vercel

---

© 2026 Parakh Motors. All rights reserved.

