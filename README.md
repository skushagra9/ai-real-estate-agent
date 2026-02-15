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
| `NEXTAUTH_URL` | Yes (prod) | Vercel | **Must be the exact URL users visit** (e.g. `https://agent-aggregator.site.skushagra.in` or `https://your-app.vercel.app`). Used for redirects and session cookies; if it doesn’t match the browser URL, login will redirect back to `/login`. |
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
- **Environment variables:** Add all variables above. Set `NEXTAUTH_URL` to your **exact** live URL (e.g. `https://your-app.vercel.app`) so login redirects and session cookies work. Ensure `DATABASE_URL` is set (e.g. from Railway).
- **Optional:** Run seed once for demo users and sample data (after first successful deploy):
  ```bash
  DATABASE_URL="<railway-postgres-url>" pnpm run db:seed
  ```

---

## Troubleshooting: “After login I’m sent back to the login page”

Two common causes:

1. **Wrong or missing `NEXTAUTH_URL`**  
   NextAuth uses `NEXTAUTH_URL` as the app’s canonical URL. It’s used for:
   - **Redirects** after sign-in (e.g. to `/` then dashboard).
   - **Session cookie** (domain/path). If the cookie is set for a different host than the one you’re visiting, the browser won’t send it, so the app sees no session and shows login again.

   **Fix:** In Vercel → Project → Settings → Environment Variables, set `NEXTAUTH_URL` to the **exact** URL people use to open the app (no trailing slash), e.g. `https://agent-aggregator.site.skushagra.in`. If you use a custom domain, use that; if you use the default Vercel URL, use that. Redeploy after changing.

2. **No users in the database**  
   If the production DB was never seeded, there are no users to log in as.

   **Fix:** Run the seed once against the production DB (same `DATABASE_URL` as in Vercel):
   ```bash
   DATABASE_URL="<your-railway-url>" pnpm run db:seed
   ```
   Then log in with e.g. `admin@loanflow.com` / `password123`.

3. **NEXTAUTH_URL is correct but login still fails**  
   The app logs why sign-in was rejected. In **Vercel → your project → Logs**, filter or search for `[Auth]`. You’ll see one of:
   - `[Auth] authorize: no user for email …` – no user with that email (wrong email or DB not seeded).
   - `[Auth] authorize: user inactive …` – user exists but is inactive.
   - `[Auth] authorize: invalid password for …` – wrong password.
   - `[Auth] authorize error: …` – exception (e.g. DB connection). Fix the underlying error.

   Also ensure **`AUTH_SECRET`** is set in Vercel (same value everywhere). If it’s missing or wrong, the session cookie won’t verify and you’ll appear logged out after redirect.

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

