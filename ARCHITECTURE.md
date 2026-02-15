# LoanFlow — Architecture & Execution Flow

This document describes the application architecture, request flow, and how the main features work end-to-end.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Next.js 16 (App Router)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Middleware (auth)  │  Layouts (admin / partner)  │  Server Components     │
│  Route protection   │  Role-based UI               │  + Client Components   │
└─────────────────────────────────────────────────────────────────────────────┘
          │                        │                            │
          ▼                        ▼                            ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────────────┐
│  NextAuth       │    │  Server Actions     │    │  API Routes              │
│  (Credentials)  │    │  src/lib/actions/   │    │  /api/auth, /api/        │
│  JWT session    │    │  deals.ts           │    │  lenders/search,         │
│  role/partnerId │    │  (createDeal,       │    │  test-email, etc.        │
└─────────────────┘    │   updateDealStage,  │    └─────────────────────────┘
          │             │   assignLender, …)  │                 │
          │             └─────────────────────┘                 │
          │                        │                            │
          └────────────────────────┼────────────────────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  Prisma → PostgreSQL          │
                    │  (User, Partner, Deal,        │
                    │   Borrower, Lender,           │
                    │   DealEvent, Commission)      │
                    └──────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │  Resend (email)             │
                    │  src/lib/email.ts           │
                    │  Tracking + partner notify   │
                    └─────────────────────────────┘
```

- **Front end:** React (Next.js App Router), server and client components, Sonner toasts.
- **Auth:** NextAuth with credentials (email + password), JWT session with `role` (ADMIN | PARTNER) and `partnerId` for partners.
- **Data:** Prisma ORM, single PostgreSQL database.
- **Email:** Resend; used for borrower tracking emails and partner notifications (stage change, lender assigned). Config: `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`; optional `EMAIL_APP_URL` for link domain in emails.

---

## 2. Roles & Route Access

| Role     | Access                                                                 | Layout / Entry        |
|----------|------------------------------------------------------------------------|------------------------|
| **ADMIN**   | `/admin/*` (dashboard, pipeline/deals, lenders, partners, commissions)  | `src/app/admin/layout.tsx`  |
| **PARTNER** | `/partner/*` (dashboard, submit deal, deal detail, commissions)         | `src/app/partner/layout.tsx` |
| **Public**  | `/`, `/login`, `/signup`, `/status/[token]`, `/api/auth/*`              | No role check              |

**Middleware** (`src/middleware.ts`):

1. Allows public paths: `/`, `/login`, `/signup`, `/api/auth/*`, `/status/*`.
2. If not authenticated → redirect to `/login`.
3. If authenticated: `/admin/*` requires ADMIN; `/partner/*` requires PARTNER; otherwise redirect to the other area’s dashboard.

Layouts re-check session and redirect to `/login` if missing or wrong role.

---

## 3. Data Model (Core Entities)

- **User** — Credentials, `role` (ADMIN | PARTNER), optional `partnerId`. One user per partner for simplicity; partner company has one `Partner` and one or more `User`s linked via `partnerId`.
- **Partner** — Company (name, contact, email, `defaultCommissionPct`). Has many `Deal`s and `Commission`s.
- **Borrower** — Client (name, email, phone). Created per deal; one deal = one borrower record for that submission.
- **Deal** — Central entity: reference number, partner, borrower, loan/property/financial fields, `stage`, `assignedAdminId`, `assignedLenderId`, `borrowerAccessToken` (for public status link), `enableClientTracking`.
- **DealEvent** — Timeline: stage changes, notes, lender assigned, etc.; has `visibility` (INTERNAL | PARTNER | BORROWER).
- **Lender** — Lenders DB (name, contact, min/max amount, states, property types). Used for admin “assign lender” and search.
- **DealLender** — Join: deal ↔ lender with status (ASSIGNED, CONTACTED, etc.). One “assigned” lender per deal (`deal.assignedLenderId`).
- **Commission** — One per deal: estimated → confirmed (at close) → paid; stores `partnerPct`, `grossCommission`, `partnerAmount`, `closedLoanAmount`, `paidAt`.

---

## 4. Execution Flows

### 4.1 Authentication

1. User hits `/login`, submits email + password.
2. NextAuth `Credentials` provider runs: lookup `User` by email, `bcrypt.compare` password, update `lastLoginAt`.
3. JWT is issued with `sub` (user id), `email`, `role`, `partnerId`; session callback exposes these on `session.user`.
4. Middleware and layout use `session.user.role` and `session.user.partnerId` for protection and UI.

### 4.2 Partner: Submit New Deal

1. Partner is on `/partner/deals/new` (client page with multi-step wizard).
2. Form collects: loan type, transaction type, property type, financials, client name/email/phone, “enable client tracking” and optional “send tracking email” after submit.
3. On submit, client calls server action **`createDeal`** (`src/lib/actions/deals.ts`) with the form payload.
4. **createDeal** (server):
   - Ensures session is PARTNER with `partnerId`.
   - Loads partner (for `defaultCommissionPct`).
   - Generates unique `referenceNumber` (e.g. `DL-2026-xxxxx`).
   - Creates **Borrower** (name, email, phone).
   - Creates **Deal** (all loan/property/financial fields, `partnerId`, `borrowerId`, `stage: SUBMITTED`, `borrowerAccessToken`).
   - Creates **Commission** (ESTIMATED, `partnerPct`, estimated gross and partner amount from `loanAmountRequested` and `BROKER_GROSS_COMMISSION_RATE`).
   - Creates **DealEvent** (STAGE_CHANGE, to SUBMITTED, INTERNAL).
   - Revalidates partner and admin paths.
   - Returns `{ dealId, referenceNumber, borrowerAccessToken, enableClientTracking }`.
5. UI shows success; if “Send via Email” is used, it calls **`sendTrackingEmail`** (see below).

### 4.3 Partner: Send Tracking Email to Borrower

1. After deal creation, partner can click “Send via Email” (or copy link). That button calls **`sendTrackingEmail(dealId, clientEmail, clientName)`**.
2. **sendTrackingEmail** (server):
   - Loads deal (and partner for context).
   - Builds tracking URL with **`getBaseUrlForEmail()`** (uses `EMAIL_APP_URL` or `NEXTAUTH_URL` so links in emails are not localhost).
   - Calls **`sendEmail`** (`src/lib/email.ts`) with subject, HTML body, and **plain-text body** (for deliverability).
   - Returns `{ success, error?, trackingUrl }`; UI shows toast on success or error.

### 4.4 Admin: Pipeline (Stage Changes, Assign Lender, Notes)

- **Stage change**
  - Admin opens deal at `/admin/deals/[id]`, uses **StageActions** (e.g. “Move to Under Review”, “Move to Closed” with optional reason/closed amount).
  - **`updateDealStage(dealId, newStage, reason?, closedAmount?)`**:
    - Validates allowed transition via `STAGE_TRANSITIONS`.
    - Updates `Deal` (stage, optional decline/lost reason, or `loanAmountClosed` for CLOSED).
    - Creates **DealEvent** (STAGE_CHANGE, fromStage → toStage).
    - If new stage is CLOSED and `closedAmount` provided: updates **Commission** to CONFIRMED and sets `grossCommission`, `partnerAmount`, `closedLoanAmount`.
    - Calls **`notifyPartner`** (email with “View Deal” link using `getBaseUrlForEmail()`).
    - Revalidates admin/partner deal and dashboard paths.

- **Assign lender**
  - **AssignLenderPanel** loads top lenders via **GET /api/lenders/search** (state, amount, propertyType, limit); can “View all” and search. Admin clicks a lender to assign.
  - **`assignLender(dealId, lenderId)`**:
    - Sets `deal.assignedLenderId`, upserts **DealLender** (ASSIGNED).
    - Creates **DealEvent** (LENDER_ASSIGNED) with lender name.
    - **notifyPartner** emails partner.
    - Revalidates deal pages.

- **Notes**
  - **AddNoteForm** (admin) and **PartnerNoteForm** (partner) call **`addDealNote(dealId, note, visibility)`**.
  - Creates **DealEvent** (NOTE) with INTERNAL | PARTNER | BORROWER visibility; revalidates deal pages.

### 4.5 Admin: Mark Commission Paid

- On `/admin/commissions`, **MarkPaidButton** calls **`markCommissionPaid(commissionId)`**.
- **markCommissionPaid** updates **Commission**: `status = PAID`, `paidAt = now()`; revalidates commission lists.

### 4.6 Borrower: Public Status Page

1. Borrower receives email (or link) with URL `/status/[token]` where `token = deal.borrowerAccessToken`.
2. **Status page** (`src/app/status/[token]/page.tsx`) is a **server component**; no login.
3. It loads **Deal** by `borrowerAccessToken`, with borrower, partner, and events visible to BORROWER (or PARTNER).
4. Renders: greeting, progress stepper, stage history, and contact (agent name/email/phone) so the borrower can reach the partner.

---

## 5. Key Files

| Path | Purpose |
|------|--------|
| `src/lib/auth.ts` | NextAuth config (credentials, JWT/session, role/partnerId). |
| `src/lib/prisma.ts` | Prisma client singleton. |
| `src/lib/email.ts` | Resend wrapper: `sendEmail({ to, subject, html, text? })`; from-address and docs for RESEND_* / EMAIL_APP_URL. |
| `src/lib/actions/deals.ts` | All deal-related server actions: createDeal, updateDealStage, assignLender, addDealNote, markCommissionPaid, sendTrackingEmail; helpers: resolveActorId, getBaseUrl, getBaseUrlForEmail, notifyPartner. |
| `src/lib/constants.ts` | Enums/labels (stages, loan types, etc.), STAGE_TRANSITIONS, BROKER_GROSS_COMMISSION_RATE, estimatedPartnerCommission, formatCurrency, generateReferenceNumber, getStageInfo. |
| `src/middleware.ts` | Auth wrapper: public routes, redirect unauthenticated, enforce ADMIN on /admin, PARTNER on /partner. |
| `src/app/admin/layout.tsx` | Admin shell + sidebar; redirect if not ADMIN. |
| `src/app/partner/layout.tsx` | Partner shell + nav; redirect if not PARTNER. |
| `src/app/partner/deals/new/page.tsx` | Client wizard: form → createDeal → success + optional sendTrackingEmail. |
| `src/app/admin/deals/[id]/page.tsx` | Admin deal detail: StageActions, AssignLenderPanel, AddNoteForm. |
| `src/app/status/[token]/page.tsx` | Public borrower status by token. |
| `src/app/api/lenders/search/route.ts` | GET; admin-only; returns lenders (optionally filtered) with match scoring. |
| `src/app/api/test-email/route.ts` | GET (dev only); tests sendEmail with query `to`. |

---

## 6. Environment & Config

- **Database:** `DATABASE_URL` (PostgreSQL).
- **Auth:** NextAuth `AUTH_SECRET` (and optional `NEXTAUTH_URL`).
- **Email:** `RESEND_API_KEY`; `RESEND_FROM_ADDRESS` (e.g. `LoanFlow <notifications@yourdomain.com>`) once domain is verified; optional `EMAIL_APP_URL` for links in emails (recommended in production to avoid localhost and improve deliverability).

---

## 7. Build & Run

- **Build:** `pnpm build` — compiles Next.js (Turbopack), type-checks, generates static/dynamic routes.
- **Dev:** `pnpm dev` — local server with hot reload; use `.env` for secrets.
- **DB:** `pnpm prisma generate` and `pnpm prisma migrate` / `prisma db push` as needed; seed with `pnpm prisma db seed` if configured.

The application is designed so that: partners submit deals and can send tracking emails; admins move deals through the pipeline, assign lenders, add notes, and mark commissions paid; borrowers use the public status link to see progress and contact the partner; and all deal/commission state and emails are driven by the server actions and shared constants above.
