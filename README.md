# LoanFlow — Commercial Loan Referral Platform

A full-stack platform for managing commercial loan referrals between **partners** (real estate agents, brokers), a **loan broker admin**, and **borrowers**. Built for the Agent Integrator Phase 2 deliverable.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database:** PostgreSQL (Prisma 7 + `@prisma/adapter-pg`)
- **Auth:** NextAuth v5 (Credentials, JWT with `role` + `partnerId`)
- **UI:** Tailwind CSS + shadcn/ui
- **Email:** Resend (transactional emails)
- **Deployment:** PostgreSQL on **Railway**, app on **Vercel**

## Features

### Partner Portal
- Self-service signup and login
- Multi-step deal submission (borrower info → deal details → notes)
- Dashboard with deal tracking and commission visibility
- Deal detail with timeline

### Admin Dashboard
- Pipeline overview with stage counts and metrics (pipeline value, gross revenue, partner payables)
- Deal management with stage transitions (Submitted → In Review → Accepted → Lender Placed → Term Sheet → Closing → Closed)
- Lender database with CSV import
- Smart lender matching by state, loan amount, and property type
- Notes with visibility (Internal / Partner / Borrower)
- Commission tracking and "Mark Paid"
- Partner management

### Borrower Status
- Token-based public page (no login): `/status/[token]`
- Simplified status display; link emailed on deal creation and resend from admin

---

## Getting Started (Local)

### Prerequisites
- Node.js 18+
- pnpm (or npm)
- PostgreSQL 15+ (or Docker for local DB)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/skushagra9/ai-real-estate-agent
cd ai-real-estate-agent
pnpm install

# 2. Environment
cp .env.example .env
# Edit .env: set DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL (e.g. http://localhost:3000)

# 3. Database
pnpm exec prisma migrate deploy
# Optional: seed demo data
pnpm run db:seed

# 4. Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Where to set | Description |
|----------|----------|--------------|-------------|
| `DATABASE_URL` | Yes | Railway (Postgres) → Vercel | PostgreSQL connection URL |
| `AUTH_SECRET` | Yes | Vercel | NextAuth secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Local only | .env | **Set to `http://localhost:3000` for local dev.** In Vercel production **do not set** (leave it unset). When unset, NextAuth uses the request host so the session cookie matches the URL you’re on—login then works from your custom domain and from any preview URL. If you set it in prod, it must exactly match the single URL users visit. |
| `RESEND_API_KEY` | No | Vercel | Resend API key; if missing, emails are skipped |
| `RESEND_FROM_ADDRESS` | No | Vercel | Sender for emails (e.g. `LoanFlow <noreply@yourdomain.com>`) |
| `EMAIL_APP_URL` | No | Vercel | Public URL for links in emails (recommended in prod) |

---

## Deployment

### 1. PostgreSQL on Railway
- Create a new project → Add **PostgreSQL**.
- Copy the **connection URL** (e.g. `postgresql://...`).
- Use this as `DATABASE_URL` in Vercel.

### 2. App on Vercel
- Import the GitHub repo.
- **Build command:** `pnpm build` (or `npm run build`). The build script runs `prisma generate`, then `prisma migrate deploy` (so migrations apply to your production DB on every deploy), then `next build`.
- **Output:** Next.js default (`.next`).
- **Environment variables:** Add `DATABASE_URL` (from Railway), `AUTH_SECRET`, and the rest. **Do not set `NEXTAUTH_URL` in Vercel** so the app uses the request host and login works from your custom domain and preview URLs. Use `NEXTAUTH_URL` only in local `.env` (`http://localhost:3000`).
- **Optional:** Run seed once for demo users and sample data (after first successful deploy):
  ```bash
  DATABASE_URL="<railway-postgres-url>" pnpm run db:seed
  ```

---

## Troubleshooting: "After login I'm sent back to the login page" (works locally, fails in prod)

**Why:** Locally you always use `http://localhost:3000`, so the session cookie is for that host. In prod, if `NEXTAUTH_URL` is set to one URL (e.g. Vercel) but you open the app at another (e.g. custom domain), the cookie is set for `NEXTAUTH_URL`'s domain and the browser won't send it on your actual URL, so you appear logged out.

**Solid fix:**

1. **In Vercel, remove `NEXTAUTH_URL`** (delete it from Environment Variables if present). When `NEXTAUTH_URL` is **not set**, NextAuth uses the **request host** for the session cookie. The app sets **`trustHost: true`** so that behind Vercel's proxy the correct host (and thus cookie domain) is used—login then works from your custom domain and preview URLs. Keep `NEXTAUTH_URL` only in **local** `.env` as `http://localhost:3000`. Redeploy after any env or code change.

2. **No users in the database**  
   Run the seed once against the production DB (same `DATABASE_URL` as in Vercel):
   ```bash
   DATABASE_URL="<your-railway-url>" pnpm run db:seed
   ```
   Then log in with e.g. `admin@loanflow.com` / `password123`.

3. **Login still fails**  
   In **Vercel → Logs**, search for `[Auth]`. You'll see: no user for email, user inactive, invalid password, or an error. Ensure **`AUTH_SECRET`** is set in Vercel.

---

## Demo Credentials

Use these to test all flows **without signing up**. (Seeded by `pnpm run db:seed`.)

| Role | Email | Password |
|------|--------|----------|
| **Admin** | admin@loanflow.com | password123 |
| Partner | jane@kw.com | password123 |
| Partner | tom@remax.com | password123 |
| Partner | sara@cb.com | password123 |
| Partner | mike@exp.com | password123 |
| Partner | lisa@century21.com | password123 |

**Borrower flow:** Create a deal as a partner (or use an existing deal). The borrower receives an email with the status link, or copy the link from the deal detail in admin (`/status/<token>`).

---

## How to Test User Flows

1. **Admin**
   - Log in as `admin@loanflow.com` → redirects to `/admin/dashboard`.
   - Pipeline: view deals, filter by stage, open a deal.
   - Deal detail: change stage, add notes (internal/partner/borrower), assign lender, mark commission paid.
   - Lenders: browse, search, import CSV (`public/demo-lenders.csv`).
   - Partners: list and edit partners.
   - Commissions: filter by status, mark paid.

2. **Partner**
   - Log in as `jane@kw.com` → redirects to `/partner/dashboard`.
   - Submit a new deal: `/partner/deals/new` (3 steps).
   - Deal list and detail: see timeline and estimated commission.
   - Commissions: view earned, pending, projected.

3. **Borrower**
   - No login. Open status link: `/status/<token>` (get token from deal in admin or from borrower email).
   - See deal summary, stage, and borrower-visible updates.

---

## Phase 1 Questions & Decisions (Marked)

These were open questions or decisions from Phase 1 planning; documented here for the client.

- **Notifications:** Phase 1 described a future “scalability phase” with a **pub/sub pipeline (e.g. Redis/RabbitMQ)** to move email off the request path. **We are not using a Redis (or other) message pipeline for this MVP.** Emails are sent synchronously after state changes. This is manageable at current scale and **not required for this basic MVP**; we can ship to production as-is and introduce a queue later if needed.
- **Borrower emails:** Borrower gets status-link email on deal creation and can be notified on stage change / lender assigned when “Enable client tracking” is on and borrower email is set.
- **Admin accounts:** Admin users are created via seed or manually in the DB; no public admin signup.

---

## Deviations from Phase 1 Plan

- **Async notifications:** No Redis/pub-sub in this build; **sync email in request path** only. Documented above under Phase 1 questions.
- Any other small UX or routing differences from the written plan are minor and do not change scope or core flows.

---

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin (dashboard, deals, lenders, partners, commissions)
│   ├── partner/        # Partner (dashboard, deals, commissions)
│   ├── login/, signup/
│   ├── status/[token]/ # Borrower status (public)
│   └── api/            # Auth, lender search, etc.
├── components/
├── lib/
│   ├── auth.ts         # NextAuth config
│   ├── prisma.ts       # Prisma client (adapter-pg)
│   ├── email.ts        # Resend
│   └── actions/        # Server actions (deals, commissions)
└── middleware.ts       # Auth + role-based route protection
prisma/
├── schema.prisma
├── prisma.config.ts    # CLI datasource (Prisma 7)
├── seed.ts
└── migrations/
```

## Reference Docs

- **Phase 1 scope & technical plan:** `PHASE1-PLAN.md`
- **Architecture & flows:** `ARCHITECTURE.md`

