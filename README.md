# SkillLoop — Reciprocal Skill Exchange Platform

> **Navigating Ideas, Sharing Insights, Growing Together.**

SkillLoop is a responsive, interactive web platform (Desktop & Mobile) for **reciprocal (two-way) skill exchange** and peer-to-peer learning without monetary transactions. Every user acts as both a *Teacher* and a *Learner*: declaring skills they can teach (`TEACH`) and skills they want to learn (`LEARN`). The system matches compatible pairs in both directions, transparently explains why they match, and supports collaboration agreements, cross-timezone session scheduling, private messaging, study communities, and admin catalog moderation.

---

## Tech Stack & Technologies

| Layer | Technologies Used |
|---|---|
| **Frontend (`apps/web`)** | React 18, TypeScript, Vite 6, React Router v6, Tailwind CSS 3, PostCSS, Autoprefixer, Lucide React |
| **Backend (`apps/api`)** | Node.js (>= 20), Express, TypeScript, `tsx`, Zod (validation), `bcryptjs` (password hashing), Helmet, CORS, `express-rate-limit`, `cookie-parser`, `dotenv` |
| **Database & ORM (`prisma/`)** | PostgreSQL 17, Prisma ORM & Prisma Client (plus an automatic in-memory fallback store for DB-less local dev) |
| **Monorepo & Tooling** | npm Workspaces (`apps/*`, `packages/*`), `@skillloop/shared` (shared types & constants), `concurrently` |
| **Testing & Quality** | Vitest, Supertest, TypeScript (`tsc --noEmit`) |
| **Containers & Deployment** | Docker (`node:20-alpine` & `postgres:17-alpine`), Docker Compose, Vercel (`apps/web/vercel.json`), Railway (`railway.json` + Managed PostgreSQL) |

---

## Core Platform Features (P0, P1 & P2)

### 1. Core Skill Exchange Features (P0)
1. **Authentication, Secure Sessions, Sign Out & 1-Click Demo Personas (`FR-001`)**:
   - Account registration (*Sign Up* with password confirmation), *Sign In*, *Sign Out*, and password updates backed by server-side sessions (`HttpOnly` cookies) integrated with PostgreSQL.
   - Quick **Sign In / Sign Up / Sign Out** controls beside the header search bar, plus a *1-Click Demo Persona Switcher* (and *Sign Out* to guest mode) in the sidebar and on `/login`.
2. **User Profile, Custom Profile Avatars & Completeness Indicator (`FR-002`, `FR-005`)**:
   - Configurable display name, username, bio, IANA timezone, preferred communication language (`ID` / `EN`), and automatic profile completeness percentage calculation.
   - **Custom Profile Picture (8 Character Avatars)**: Interactive selector featuring 8 built-in illustrated characters on `/profile`, synced across the header, dashboard profile card, and PostgreSQL.
3. **Canonical Skill Catalog & Teach/Learn Declarations (`FR-003`, `FR-004`)**:
   - Skill search by canonical name or curated aliases (e.g., `js` → `JavaScript`, `ui/ux` → `UI/UX Design`), category filters, and `TEACH` / `LEARN` declarations with proficiency/target levels (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`), learning method preferences, and portfolio links.
4. **Deterministic & Explainable Reciprocal Matching Engine (`FR-006`, `FR-007`, `FR-008`)**:
   - Recommends partners with mutual two-way compatibility.
   - Computes directional scores (`DirectionScore = 0.70 * SkillFit + 0.20 * LevelFit + 0.10 * AvailabilityFit`) and a balanced overall score (`OverallScore = 0.65 * min(AtoB, BtoA) + 0.35 * avg(AtoB, BtoA)`).
   - Displays editorial-style partner cards with a transparent two-way compatibility breakdown.
5. **Collaboration Request Lifecycle & Counter-Proposals (`FR-009`, `FR-010`)**:
   - Send collaboration requests with an *Exchange Agreement*, and handle `ACCEPT`, `REJECT`, `CANCEL`, or `COUNTER` proposals.
6. **Cross-Timezone Session Scheduling & Virtual Meeting Links (`FR-011`, `FR-012`)**:
   - Manage session states (`PROPOSED`, `SCHEDULED`, `RESCHEDULE`, `COMPLETED`, `CANCELLED`) with cross-timezone display and virtual learning room links.
7. **User Dashboard, Activity Monitor (Daily/Weekly/Monthly) & Notification Center (`FR-013`, `FR-014`)**:
   - **User Profile Card** on the Dashboard summarizing skills, rating, language, and profile completeness progress.
   - **Interactive Activity Monitor** with **Daily (last 7 days)**, **Weekly (last 4 weeks)**, and **Monthly (last 6 months)** modes and clickable bar charts tracking learning duration, sessions, requests, and milestones.
   - Highlights *Top Reciprocal Partners of the Week*, *Exchange To-Do List*, and an *In-App Notification Center*.
8. **Safety Controls: Block & Report Users (`FR-015`)**:
   - Block users and submit violation reports directly to the Admin moderation queue.

### 2. Advanced Features & Community Ecosystem (P1 & P2)
9. **Milestone & Learning Progress Tracking**:
   - Per-collaboration learning milestones with a `0%`–`100%` progress slider and completion checklist.
10. **Session Reviews & Partner Reputation**:
    - Star ratings (`1–5`) and written reviews after `COMPLETED` sessions that automatically update partner reputation scores.
11. **Private Messaging & Learning Material Sharing (`/messages`)**:
    - Direct messages between collaboration partners supporting attached resource/repository links and message reporting.
12. **Communities & Study Circles (`/community`)**:
    - Create and join *Reciprocal Study Circles* organized by skill focus with recurring schedules and group discussion links.
13. **Role-Based Admin & Moderation (`/admin` — Admin Accounts Only)**:
    - **Access Control (`isAdmin`)**: The **Admin & Moderation** sidebar menu and all `/api/v1/admin/*` endpoints are restricted to Administrator accounts (**Raka Pratama — `raka@demo.skillloop.id`** or `admin@...` emails). Regular members do not see the Admin menu and are shown a *Restricted Access* page if visiting `/admin`.
    - **Canonical Skill Catalog Management**: Admins can add new canonical skills (`POST /api/v1/admin/skills`) or delete canonical skills (`DELETE /api/v1/admin/skills/:skillId`), complete with search and category filtering.
    - **Report Moderation & Account Status**: Review reports (`RESOLVED` / `DISMISSED`) and `Suspend` / `Activate` user accounts.
14. **Responsive Design (Desktop & Mobile) & Bilingual UI (`ID` / `EN`)**:
    - *Left Vertical Sidebar* on desktop, *Drawer Menu* + *Fixed Bottom Navigation Bar* on mobile, interactive footer, warm notebook-grid workspace (`#FAF1E6`), built-in SVG illustrations, and an *Interactive Local Fallback Store* so all flows remain testable even when the database server is offline.

---

## Monorepo Structure

```text
skillloop/
├── apps/
│   ├── api/                 # Express + TypeScript REST API (/api/v1)
│   └── web/                 # React + Vite + Tailwind CSS Frontend (+ vercel.json)
├── packages/
│   └── shared/              # Shared TypeScript types & constants (@skillloop/shared)
├── prisma/
│   ├── schema.prisma        # Relational PostgreSQL schema
│   └── migrations/          # SQL migrations
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── PRD_SkillLoop.md
│   └── SkillLoop_AI_Agent_Brief.md
├── Dockerfile               # Full-stack container build
├── docker-compose.yml       # PostgreSQL 17 & optional fullstack profile
├── railway.json             # Railway backend build/start/healthcheck config
├── .env.example             # Root environment variable template
└── package.json             # Root npm workspaces & scripts
```

---

## Getting Started

### 1. Prerequisites
- **Node.js** `>= 20.x` and **npm** `>= 10.x`
- **Docker Desktop** *(Optional — for running a local PostgreSQL container)*

> **Development Convenience Note:** If Docker Desktop or PostgreSQL is not running, `apps/api` automatically falls back to an *in-memory development store*, and `apps/web` includes an *interactive state store* pre-populated with the skill catalog, sessions, messages, communities, and 5 demo accounts so all features can be tested without extra setup.

### 2. Installation & Environment Setup
```bash
cp .env.example .env
npm install
```

### 3. Run PostgreSQL with Docker Compose (Recommended)
```bash
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
```

*(Optional)* To run the entire stack (**PostgreSQL + Backend API + Frontend Web**) inside Docker containers:
```bash
docker compose --profile fullstack up -d --build
# Open the app at http://localhost:4000
```

### 4. Run the Application (Backend + Frontend)
Run both apps concurrently from the root directory:
```bash
npm run dev
```

Or run them in two separate terminals:
```bash
# Terminal 1 — API Server (http://localhost:4000/api/v1)
npm run dev:api

# Terminal 2 — Web Frontend (http://localhost:5173)
npm run dev:web
```

### 5. Verification (Typecheck, Lint, Tests, Build)
```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

### 6. Deployment (Vercel + Railway + PostgreSQL)
SkillLoop is configured for split monorepo deployment:
- **Frontend (`apps/web`)** → **Vercel** (Root Directory: `apps/web`, Build: `npm run build`, Output: `dist`, Env: `VITE_API_URL`)
- **Backend (`apps/api`)** → **Railway** (Root Directory: `.`, configured via `railway.json`, Healthcheck: `/api/v1/health`)
- **Database** → **PostgreSQL** on **Railway** (`DATABASE_URL`)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the complete step-by-step manual deployment guide.

---

## Demo Accounts & Access Levels (1-Click Login)

All demo accounts share the password `DemoSkillLoop123!` and can be selected directly from the **Quick Demo Account (1-Click)** switcher in the sidebar or on `/login`:

| Account | Email | Role | Can Teach | Want to Learn | Notes |
|---|---|---|---|---|---|
| **Raka Pratama** | `raka@demo.skillloop.id` | **Administrator (`isAdmin: true`)** | JavaScript, HTML & CSS | UI/UX Design, Figma | Full access to **Admin & Moderation** (manage/delete skill catalog, review reports, suspend users) |
| **Nadia Lestary (Naya)** | `naya@demo.skillloop.id` | Member (`isAdmin: false`) | UI/UX Design, Figma | JavaScript, HTML & CSS | 96% Reciprocal Match with Raka & Dimas |
| **Evan Dimas Lee** | `dimas@demo.skillloop.id` | Member (`isAdmin: false`) | Public Speaking, HTML & CSS | Figma, JavaScript | Reciprocal Match with Naya & Raka |
| **Stefy Alya Catlyna** | `alya@demo.skillloop.id` | Member (`isAdmin: false`) | Python, SQL & PostgreSQL | React, JavaScript | 98% Reciprocal Match with Farhan |
| **Farhan Akbar** | `farhan@demo.skillloop.id` | Member (`isAdmin: false`) | React, TypeScript | Python, SQL & PostgreSQL | 98% Reciprocal Match with Alya |
