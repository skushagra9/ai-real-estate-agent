# LoanFlow — How the flow is wired and how everything works

This doc explains the three user types, how they get in, what they can do, and how the pieces connect (auth, routes, server actions, DB, and UI).

---

## 1. The three users (and how they’re different)

| Who | How they get in | Where they go | Purpose |
|-----|-----------------|---------------|---------|
| **Referral Partner** | Sign up at `/signup` or log in at `/login` | `/partner/*` | Submit deals, track status, see commissions, add notes for the broker. |
| **Broker (Admin)** | Log in at `/login` (no public signup) | `/admin/*` | Manage pipeline, change stages, assign lenders, add notes (internal/partner/borrower), manage commissions. |
| **Borrower** | No login. Uses a link with a secret token. | `/status/[token]` | View deal status and progress; no account. |

**Important:** Client (borrower) and referral partner are different people. The partner refers the borrower; the broker works the deal.

---

## 2. Auth and routing (how access is enforced)

- **Auth:** NextAuth (Auth.js) with **Credentials** (email + password). Session is JWT, 30-day max age.
- **Login:** `/login` → credentials checked against `User` (email + `passwordHash`). Session gets `role` and, for partners, `partnerId`.
- **Home:** `/` → if not logged in → `/login`; if ADMIN → `/admin/dashboard`; else → `/partner/dashboard`.
- **Middleware** (`src/middleware.ts`):
  - **Public:** `/login`, `/signup`, `/api/auth/*`, `/status/*`, `/`.
  - **No session:** redirect to `/login`.
  - **`/admin/*`** and not ADMIN → redirect to `/partner/dashboard`.
  - **`/partner/*`** and not PARTNER → redirect to `/admin/dashboard`.

So: only ADMIN sees admin routes; only PARTNER sees partner routes; borrower never hits these, they only use `/status/[token]`.

---

## 3. Partner flow (referral partner)

### 3.1 Getting in

- **Signup:** `POST /api/auth/signup` with `firstName`, `lastName`, `email`, `password`, `companyName`, `phone` (optional).
  - Creates **Partner** (companyName, contactName, email, phone).
  - Creates **User** with `role: PARTNER`, `partnerId` → that Partner.
  - No admin invite; open signup.
- **Login:** Same as admin; role in session decides redirect (partner → `/partner/dashboard`).

### 3.2 Submit a deal

- **Page:** `/partner/deals/new` (multi-step form).
- **Action:** `createDeal` (server action in `src/lib/actions/deals.ts`).
  - **Who:** Only PARTNER with `partnerId`.
  - **Does:**  
    - Resolve or create **Borrower** (by client email).  
    - Create **Deal** (reference number, partnerId, borrowerId, all form fields, `borrowerAccessToken` for status link, first **DealEvent** SUBMITTED).  
    - Create **Commission** (status ESTIMATED, partnerPct from form or partner default, partnerAmount null).  
  - **Returns:** `dealId`, `referenceNumber`, `borrowerAccessToken`, `enableClientTracking`.
- **After submit:** Success screen with deal ref and optional “Send tracking link” (calls `sendTrackingEmail`).
- **Revalidation:** Partner dashboard, admin deals, admin dashboard so both sides see the new deal.

### 3.3 View deals and commissions

- **Deal list:** `/partner/dashboard`  
  - Loads deals for `session.user.partnerId`, with borrower and commission.  
  - Summary: active count, total earned (PAID), pending (CONFIRMED), projected (ESTIMATED; projected amount = loanAmountRequested × 2% × partnerPct).  
  - Table: reference, borrower, amount, status, commission, date; reference links to deal detail.
- **Deal detail:** `/partner/deals/[id]`  
  - Only if deal.partnerId === session.user.partnerId.  
  - Read-only: deal info, borrower, commission, timeline (partner- and borrower-visible events only).  
  - **Add note:** `PartnerNoteForm` → `addDealNote(dealId, note, "PARTNER")`. Partners can only add partner-visible notes.

### 3.4 Commissions

- **Page:** `/partner/commissions`.  
  - Loads commissions for `session.user.partnerId` with deal + borrower.  
  - **Total earned:** sum of `partnerAmount` where status PAID.  
  - **Pending payout:** sum of `partnerAmount` where status CONFIRMED.  
  - **Projected:** sum of estimated amount for ESTIMATED (loanAmountRequested × 2% × partnerPct).  
  - Table: deal, borrower, loan amount, your %, commission (or projected if ESTIMATED), status, date.

**Wiring:** All partner data is filtered by `partnerId` from the session; no access to other partners’ deals or commissions.

---

## 4. Admin flow (broker)

### 4.1 Getting in

- Admin user is created in **seed** (e.g. `admin@loanflow.com`). No signup UI for admin.
- Login same as partner; role ADMIN → redirect to `/admin/dashboard`.

### 4.2 Dashboard and pipeline

- **Dashboard:** `/admin/dashboard`  
  - All deals, all commissions, partner count, active lender count.  
  - **Active deals:** count of deals not CLOSED/DECLINED/LOST.  
  - **Needs attention:** deals in SUBMITTED or UNDER_REVIEW.  
  - **Pipeline value:** sum of loanAmountRequested for active deals.  
  - **Gross revenue:** sum of grossCommission for CONFIRMED/PAID.  
  - **Partner payables:** sum of partnerAmount for CONFIRMED.  
  - **Needs Attention** table: links to deal detail; empty state when none.
- **Pipeline:** `/admin/deals`  
  - All deals with borrower, partner, assigned lender; stage badges; table with reference, borrower, partner, amount, type, state, lender, stage, date.

### 4.3 Deal detail and actions

- **Page:** `/admin/deals/[id]`  
  - Full deal, borrower, commission, assigned lender, **all** events (including INTERNAL).
- **Stage change:** `StageActions` → `updateDealStage(dealId, newStage, reason?, closedAmount?)`.
  - **Who:** ADMIN only.  
  - **Does:** Validates transition (from `STAGE_TRANSITIONS`), updates Deal (stage, stageChangedAt, decline/lost reason or closed amount), creates DealEvent (PARTNER visibility). If newStage is CLOSED and closedAmount provided: finds Commission, sets grossCommission = closedAmount × 2%, partnerAmount = gross × partnerPct, status CONFIRMED.  
  - **Revalidation:** admin deals/dashboard, partner dashboard and commissions.
- **Assign lender:** `AssignLenderPanel` → `assignLender(dealId, lenderId)`.
  - **Who:** ADMIN only.  
  - **Does:** Sets deal.assignedLenderId, upserts DealLender (ASSIGNED), creates DealEvent LENDER_ASSIGNED (PARTNER visibility).  
  - **Revalidation:** admin deal, admin deals, partner dashboard.
- **Add note:** `AddNoteForm` → `addDealNote(dealId, note, visibility)`.
  - **Who:** ADMIN can use INTERNAL, PARTNER, or BORROWER; partner only PARTNER (enforced in action).  
  - **Does:** Creates DealEvent (NOTE, chosen visibility).  
  - **Revalidation:** admin and partner deal pages.

### 4.4 Lenders and partners

- **Lenders:** `/admin/lenders` — list/search lenders; optional CSV import. Used when assigning a lender to a deal.
- **Partners:** `/admin/partners` — list partners (company, contact, email, commission %, active deal count, total earned from PAID commissions).

### 4.5 Commissions

- **Page:** `/admin/commissions`  
  - All commissions; filters by status; **Mark paid** for CONFIRMED → `markCommissionPaid(commissionId)`.
- **Mark paid:** Sets commission status PAID, paidAt, creates DealEvent COMMISSION_UPDATE (PARTNER visibility). Revalidates admin and partner commissions.

---

## 5. Borrower flow (client, no login)

### 5.1 How they get the link

- When a deal is created, `Deal.borrowerAccessToken` is set (unique, unguessable).
- **Link:** `https://<domain>/status/<borrowerAccessToken>`.
- Partner can “Send tracking link” from the success screen after submit → `sendTrackingEmail(dealId, borrowerEmail, borrowerName)` (Resend; if no API key, logs to console).

### 5.2 What they see

- **Page:** `/status/[token]` (public; no auth).  
  - Lookup: `prisma.deal.findUnique({ where: { borrowerAccessToken: token } })` with borrower, partner (and partner users), and events where visibility in [BORROWER, PARTNER] and eventType STAGE_CHANGE.  
  - If no deal: 404.
- **UI:** Deal summary (loan type, property type, address if any), progress stepper from current stage, latest borrower-visible update, broker/agent contact (from partner’s user or partner record). No login, no navigation.

**Wiring:** Access is entirely by token; no session. Only that deal’s data is exposed.

---

## 6. End-to-end flow (one deal, all three users)

1. **Partner** signs up or logs in → goes to `/partner/dashboard`.
2. **Partner** submits a deal at `/partner/deals/new` → `createDeal` → Deal + Borrower + Commission (ESTIMATED) + first DealEvent (SUBMITTED). Partner sees success and can send borrower the status link.
3. **Admin** sees the deal in Needs Attention on `/admin/dashboard` and in Pipeline on `/admin/deals`. Opens deal → can move to UNDER_REVIEW, PROCESSING, etc. (`updateDealStage`), add notes, assign lender (`assignLender`).
4. When admin moves to CLOSED and enters closed amount → Commission becomes CONFIRMED with partnerAmount. Later admin marks commission PAID → partner sees it in Commissions and dashboard.
5. **Borrower** opens `/status/<token>` (from email or partner) → sees deal summary, stage, and contact. No account.

---

## 7. Where things live (quick reference)

| What | Where |
|------|--------|
| Auth (login, session, role) | `src/lib/auth.ts`, NextAuth Credentials, JWT with role + partnerId |
| Partner signup | `POST /api/auth/signup` → Partner + User (PARTNER, partnerId) |
| Deal creation | `createDeal` in `src/lib/actions/deals.ts` (PARTNER only) |
| Stage changes | `updateDealStage` (ADMIN only); closes deal and sets Commission CONFIRMED when CLOSED |
| Lender assignment | `assignLender` (ADMIN only) |
| Notes | `addDealNote` (ADMIN: any visibility; PARTNER: PARTNER only) |
| Commission paid | `markCommissionPaid` (ADMIN only) |
| Tracking email | `sendTrackingEmail` (Resend or console) |
| Borrower status | `/status/[token]` — lookup by `borrowerAccessToken`, no auth |
| Revalidation | After each mutation we revalidate the relevant partner and admin paths so lists and detail stay in sync |

---

## 8. Database (core models)

- **User** — auth; role ADMIN | PARTNER; partnerId for PARTNER.
- **Partner** — company, contact, email, defaultCommissionPct; has many Users and Deals.
- **Borrower** — client info (name, email, phone); created/updated when partner submits.
- **Deal** — central record: partnerId, borrowerId, assignedLenderId, all deal fields, stage, borrowerAccessToken, etc.
- **DealEvent** — timeline: eventType (STAGE_CHANGE, NOTE, LENDER_ASSIGNED, COMMISSION_UPDATE), visibility (INTERNAL, PARTNER, BORROWER), note, actorId.
- **Commission** — per deal: status (ESTIMATED → CONFIRMED → PAID), partnerPct, partnerAmount, closedLoanAmount, grossCommission, paidAt.
- **Lender** — lender DB; linked via Deal.assignedLenderId and DealLender.
- **DealLender** — which lender(s) were assigned/considered per deal.

Row-level “who sees what” is enforced in app code: partner queries filter by `session.user.partnerId`; admin sees all; borrower sees one deal by token only.

---

That’s how the flow is wired and how everything works end to end.
