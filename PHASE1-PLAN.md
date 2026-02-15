# Commercial Loan Referral Platform — Phase 1: Scope of Work & Technical Plan

**Author:** Kushagra Sharma  
**Date:** February 15, 2026  
**Status:** Phase 1 Deliverable  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Understanding](#2-problem-understanding)
3. [Product Scope — V1](#3-product-scope--v1)
4. [Technical Architecture](#4-technical-architecture)
5. [Data Model](#5-data-model)
6. [Lender Database Strategy](#6-lender-database-strategy)
7. [Milestones & Build Plan](#7-milestones--build-plan)
8. [Risks & Assumptions](#8-risks--assumptions)
9. [Appendix: API Surface & Route Map](#9-appendix-api-surface--route-map)

---

## 1. Executive Summary

The client is a commercial loan broker whose entire operation depends on him being personally available — answering calls, chasing documents, matching lenders from memory, and manually updating referral partners on deal status. When he goes offline for six hours, 23 missed calls pile up. The business has a single point of failure: him.

This platform replaces the unstructured, phone-driven workflow with a structured system where:

- **Referral partners** submit deals through a form, track deal status in real time, and see their commissions — without ever calling the broker.
- **Borrowers** check their deal status through a secure link — without creating an account or knowing how to use software.
- **The broker (admin)** manages a deal pipeline, assigns lenders from a searchable database of 7,000 records, and tracks commissions — all from a single dashboard.



**V1 delivers three things:** a partner portal that stops the phone from ringing, an admin dashboard that turns tribal knowledge into a repeatable process, and a commission ledger that keeps referral partners loyal.

---

## 2. Problem Understanding

### 2.1 The Business Model

The client is a commercial loan broker. Business owners who need financing — to acquire real estate, buy a business, purchase equipment, or get working capital — come to him through referral partners. He matches them with the right lender from approximately 7,000 commercial lenders and earns a commission when the loan closes. The referral partner who brought the deal earns a referral commission.

Banks reject most commercial borrowers, even creditworthy ones. Alternative financing through brokers like the client is often the only viable path.

### 2.2 How Deals Flow Today (and Where It Breaks)

| Step | What Happens Today | What Breaks |
|------|-------------------|-------------|
| **Intake** | Partner sends deal via call/text/email. No structure. | Broker wastes time extracting basic info. Same questions asked every time. |
| **Collection** | Broker chases borrower for tax returns, bank statements, P&Ls. | Days to weeks of back-and-forth. *(Out of scope — separate team.)* |
| **Matching** | Broker matches lender from 7,000-record spreadsheet, entirely from memory. | Not scalable. Knowledge trapped in one person's head. |
| **Lifecycle** | Broker manually tracks every stage, manually notifies all parties. | Partners call constantly for updates. Broker is the bottleneck. |
| **Close** | Deal closes. Commission earned. Partner gets referral fee. | Commission tracking is ad-hoc. Partners don't trust they'll get paid. |

### 2.3 Who Are the Users (Really)?

**Referral Partners (realtors, loan officers):** These are salespeople. They are not technical. They are money-motivated and impatient. If a form takes more than 90 seconds or a dashboard is confusing, they will abandon it and go back to texting. They care about exactly two things: *where is my deal* and *where is my money*.

**Borrowers (business owners):** They are busy running businesses. They don't want to learn software. They want to open a link on their phone and see one sentence: "Your deal is in closing" or "We're reviewing lender options." That's it.

**The Broker (admin):** He is not a developer, but he understands operations. He needs a tool that feels like working through an inbox — "here's what needs my attention" — not like operating a complex system. If he hires assistants later, they need to be productive on day one without training.

### 2.4 What Success Looks Like

- The broker puts his phone on airplane mode for 6 hours. Nothing breaks.
- A new referral partner submits their first deal in under 2 minutes.
- A partner checks deal status and commission at 11 PM without calling anyone.
- A borrower's spouse asks "what's happening with the loan?" and the borrower shows them a link.
- The broker assigns a lender in 3 clicks, not 30 minutes of spreadsheet scanning.

---

## 3. Product Scope — V1

### 3.1 Partner Portal

The partner portal is the primary surface for referral partners. It must feel like a consumer app, not enterprise software.

#### Authentication
- **Simple email + password login** — no magic links; partners sign in with credentials
- **Open signup:** Anyone can create a partner account (sign up with email, password, name, company name). No admin invite required
- Session persists for 30 days on trusted devices
- Admin portal uses a **separate login** (admin credentials only; no crossover with partner accounts)

#### Deal Submission
A **3-step form** designed for speed. Minimal required fields. Autosave between steps.

**Step 1 — Borrower Info (required)**
- Borrower first name, last name
- Borrower email
- Borrower phone
- Business name

**Step 2 — Deal Info (required)**
- Property type (dropdown: Multifamily, Retail, Office, Industrial, Mixed-Use, Hospitality, Land, Self-Storage, Healthcare, Other)
- Transaction type (dropdown: Purchase, Refinance, Cash-Out Refinance, Bridge, Construction, SBA, Working Capital, Equipment, Other)
- Loan amount requested (currency input)
- Property state (dropdown, 50 states)
- Property city (optional, text)

**Step 3 — Additional Context (optional)**
- Free-text notes ("borrower has strong credit, owns 3 other properties")
- Urgency level (Normal / High / Urgent) — helps admin prioritize
- How did borrower find you? (dropdown: existing client, referral, cold outreach, other)

After submission: confirmation screen with deal reference number (e.g., `DL-2026-00142`), current status, and a note that they'll be updated when the broker reviews.

**Why this design:** Salespeople abandon long forms. Three short screens with clear progress feel fast. Optional fields mean partners can submit in 60 seconds if they want, or add context if they have it. Autosave means nothing is lost if they get a phone call mid-form.

**Partner signup (first-time):** On signup, partner enters email, password, first name, last name, and company name. System creates both a `Partner` record (for commissions and deal attribution) and a `User` record (for login) linked to that partner. They can then log in anytime with email + password.

#### Deal List & Deal Detail
- **Deal list:** Table showing borrower name, loan amount, property type, status badge, last update timestamp, and estimated commission.
- **Deal detail:** Full deal summary + a **timeline** showing every partner-visible event (stage changes, admin notes marked as partner-visible, lender assigned). Timeline is the single source of truth — partners never need to call.
- Partners can add a note to a deal (visible to admin) for follow-up context.

#### Commission Dashboard
- **Summary cards:** Total Earned (paid), Total Pending (confirmed but unpaid), Total Projected (estimated on active deals)
- **Commission table:** Each row = one deal. Columns: deal ref, borrower, loan amount, status, commission amount, commission status (Estimated / Confirmed / Paid), date.
- No payment processing — this is a ledger. Admin marks "Paid" when the wire goes out.

#### Notifications
- **Email on key stage changes:** deal accepted, deal declined (with reason), lender assigned, deal closed, commission paid.
- No in-app notification system in V1 (email is sufficient and these users live in their inbox).

---

### 3.2 Borrower Portal

Borrowers are the most casual users. They should never have to create an account, remember a password, or understand the platform.

#### Implementation: Secure Status Link
When a deal is created, the system generates a unique, unguessable token (e.g., 32-character hex). The borrower URL is:

```
https://platform.com/status/<token>
```

This link is emailed to the borrower automatically on deal creation, and can be resent by admin at any time.

#### What the Borrower Sees
A single, mobile-optimized page:
- **Deal summary:** Loan amount, property type, transaction type.
- **Current stage:** Displayed as a simple progress tracker (horizontal stepper with 5 simplified stages: Submitted → Under Review → Lender Matched → In Closing → Closed).
- **Latest update:** The most recent borrower-visible note from the timeline.
- **Contact info:** Broker's phone and email, clearly displayed.
- **No login, no navigation, no complexity.**

#### Why Not a Full Borrower Account?
- Borrowers interact with this platform once or twice during their deal lifecycle.
- Account creation adds friction and support overhead (password resets, etc.).
- A secure link provides the right level of access with zero onboarding.
- If the client later wants borrowers to have accounts (e.g., for repeat borrowers or document upload), the token system gracefully upgrades to an authenticated portal.

---

### 3.3 Admin Dashboard

The admin dashboard is the broker's operating system. It should feel like an inbox, not a database.

#### Pipeline Overview
- **Default view: "Needs Attention" inbox**
  - New deals (SUBMITTED) waiting for review
  - Deals with no update in 7+ days (stale)
  - Deals in CLOSING that need follow-up
- **Pipeline board (Kanban):** Columns for each active stage. Cards show borrower name, loan amount, partner name, days in stage.
- **Table view:** Filterable by stage, partner, property type, state, loan amount range, date range. Sortable by all columns. Searchable by borrower/partner name or deal reference.
- **Key metrics bar:** Total active deals, deals this month, total pipeline value, average days to close; optionally **closed volume / gross commissions** (broker earnings from closed deals) for at-a-glance earning visibility.

#### Deal Management
On the deal detail page, admin can:
- **Review full deal info** (everything the partner submitted + borrower info)
- **Change stage** via a dropdown or quick-action buttons:
  - SUBMITTED → IN_REVIEW (auto when admin first opens)
  - IN_REVIEW → ACCEPTED or DECLINED (decline requires reason)
  - ACCEPTED → LENDER_PLACED (after lender assignment)
  - LENDER_PLACED → TERM_SHEET
  - TERM_SHEET → CLOSING
  - CLOSING → CLOSED (requires closed loan amount) or LOST (requires reason)
- **Add notes** with visibility control:
  - **Internal:** Only admin users see this (strategy notes, lender feedback)
  - **Partner-visible:** Partner sees this in their timeline
  - **Borrower-visible:** Shows on borrower status page (e.g., "We've identified a great lender match and submitted your application")
- **Assign lender** (see Lender Database Strategy, Section 6)
- **Assign admin** (for multi-admin: which team member owns this deal)
- **View full timeline** (all events, including internal ones)

#### Lender Database Management
- **Import:** CSV upload with preview, field mapping, and validation report
- **Browse & Search:** Full-text search on lender name + filterable by state coverage, loan size range, property type specialties, transaction type specialties, lender type
- **Lender Detail:** View/edit lender info, see deals this lender has been assigned to
- *(Detailed in Section 6)*

#### Partner Management
- **Partner list:** Name, contact info, active deal count, total commissions earned (includes partners who signed up via the portal)
- **Add/edit partner:** Create or edit partner record, set default commission percentage
- **No invite flow:** Partners sign up themselves at the partner portal; admin can optionally create a partner record in advance if desired

#### Commission Management
- **Commission list:** All commissions, filterable by status (Estimated / Confirmed / Paid)
- **Mark paid:** Admin confirms commission was paid, enters date
- **Override:** Admin can adjust commission percentage or amount for a specific deal (with audit trail)

#### Earning visibility (broker + partners)
- **Partner earning:** Each partner sees their own **commission dashboard**: Total Earned (paid), Total Pending (confirmed but unpaid), Total Projected (estimated on active deals), plus a per-deal table (deal ref, borrower, loan amount, commission amount, status, date). Partners are notified by email when a deal closes (commission confirmed) and when commission is marked paid. This answers “where is my money?”
- **Broker earning:** The admin (broker) sees the other side of the same data. We store **gross commission** per closed deal (optional on `Commission`) and **closed loan amount**. The commission list and partner list support broker-side visibility: total gross commissions (broker revenue), total partner payouts (paid + pending). A simple **earnings summary** on the admin dashboard or commission page can show e.g. “Gross commissions (YTD or this period)” and “Partner payables (pending / paid).” No payment processing — this is a ledger; the broker’s “earning” is tracked as closed-deal gross commission and compared to what is owed to partners.
- **Platform/product earning:** How the software vendor charges the broker (SaaS, license, etc.) is out of scope for V1; the plan focuses on broker and partner earning visibility within the deal flow.

---


## 4. Technical Architecture

### 4.1 Stack Selection

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 14+ (App Router) with TypeScript | Full-stack in one framework. Server Components for fast page loads, Server Actions for mutations, API routes for any external integrations. Fastest path to production in 48 hours. |
| **Database** | PostgreSQL 15+ | Relational integrity for financial data (commissions). Array types + GIN indexes for lender filtering. JSONB for flexible metadata. Battle-tested at scale. |
| **ORM** | Prisma | Type-safe database access, declarative schema with migrations, excellent for rapid CRUD development. Schema-first approach means the data model is the source of truth. |
| **Authentication** | NextAuth.js (Auth.js v5) | Credentials (email + password) for both partner and admin. Partner portal supports open signup; admin users are created separately. Role-based session with middleware enforcement. |
| **UI** | Tailwind CSS + shadcn/ui | shadcn/ui provides accessible, professional components (tables, forms, dropdowns, sheets, dialogs) that look production-grade out of the box. Tailwind enables rapid custom styling. |
| **Email** | Resend | Simple transactional email API. Status and commission notification emails to partners; status link email to borrowers. Generous free tier for V1. |
| **Hosting** | Vercel (app) + Neon (managed Postgres) | Zero-config deployment. Preview deployments for testing. Neon provides serverless Postgres with branching. SSL, backups, and scaling handled by the platform. |
| **File Storage** | N/A for V1 | Document collection is out of scope. No file uploads needed. |

### 4.2 Application Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL (CDN + Edge)                       │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │                   Next.js Application                     │   │
│   │                                                           │   │
│   │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │   │
│   │  │   Partner    │  │    Admin     │  │   Borrower     │  │   │
│   │  │   Portal     │  │  Dashboard   │  │  Status Page   │  │   │
│   │  │ /(partner)/* │  │  /(admin)/*  │  │  /status/[tok] │  │   │
│   │  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │   │
│   │         │                 │                   │           │   │
│   │  ┌──────┴─────────────────┴───────────────────┴────────┐  │   │
│   │  │              Middleware (Auth + RBAC)                │  │   │
│   │  │  - Validates session                                │  │   │
│   │  │  - Enforces role-based route access                 │  │   │
│   │  │  - Redirects unauthenticated users                  │  │   │
│   │  └──────────────────────┬──────────────────────────────┘  │   │
│   │                         │                                 │   │
│   │  ┌──────────────────────┴──────────────────────────────┐  │   │
│   │  │              Server Actions + API Layer             │  │   │
│   │  │  - Deal CRUD & stage transitions                    │  │   │
│   │  │  - Lender search & assignment                       │  │   │
│   │  │  - Commission calculations                          │  │   │
│   │  │  - Partner/User management                          │  │   │
│   │  │  - CSV import processing                            │  │   │
│   │  └──────────────────────┬──────────────────────────────┘  │   │
│   │                         │                                 │   │
│   │  ┌──────────────────────┴──────────────────────────────┐  │   │
│   │  │              Service Layer                          │  │   │
│   │  │  - DealService (lifecycle, validation, events)      │  │   │
│   │  │  - LenderService (import, search, rank)             │  │   │
│   │  │  - CommissionService (calculate, confirm, pay)      │  │   │
│   │  │  - NotificationService (email dispatch)             │  │   │
│   │  └──────────────────────┬──────────────────────────────┘  │   │
│   │                         │                                 │   │
│   │  ┌──────────────────────┴──────────────────────────────┐  │   │
│   │  │              Prisma ORM                             │  │   │
│   │  └──────────────────────┬──────────────────────────────┘  │   │
│   └──────────────────────────┼───────────────────────────────┘   │
│                              │                                    │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐       ┌───────────────┐
                    │   Neon PostgreSQL   │       │    Resend     │
                    │   (Managed DB)      │       │  (Email API)  │
                    └─────────────────────┘       └───────────────┘
```

### 4.3 Route Architecture

```
/app
├── (auth)/
│   ├── login/page.tsx              → Login (email + password; role determines redirect)
│   ├── signup/page.tsx             → Partner signup only (creates partner account)
│   └── layout.tsx                  → Auth layout (centered, clean)
│
├── (partner)/                      → Protected: PARTNER role only
│   ├── layout.tsx                  → Partner navigation shell
│   ├── dashboard/page.tsx          → Deal list + commission summary
│   ├── deals/
│   │   ├── new/page.tsx            → 3-step deal submission form
│   │   └── [id]/page.tsx           → Deal detail + timeline
│   └── commissions/page.tsx        → Commission dashboard
│
├── (admin)/                        → Protected: ADMIN role only
│   ├── layout.tsx                  → Admin navigation shell
│   ├── dashboard/page.tsx          → Pipeline overview + "Needs Attention"
│   ├── deals/
│   │   ├── page.tsx                → Pipeline (kanban + table views)
│   │   └── [id]/page.tsx           → Deal detail + management controls
│   ├── lenders/
│   │   ├── page.tsx                → Lender database + search
│   │   └── import/page.tsx         → CSV import tool
│   ├── partners/
│   │   └── page.tsx                → Partner list + invite
│   └── commissions/page.tsx        → Commission management
│
├── status/
│   └── [token]/page.tsx            → Borrower status page (public, no auth)
│
├── api/
│   ├── auth/[...nextauth]/route.ts → NextAuth endpoints
│   ├── deals/route.ts              → Deal REST endpoints (if needed)
│   └── lenders/search/route.ts     → Lender search API (for client-side filtering)
│
├── layout.tsx                      → Root layout
├── page.tsx                        → Landing / redirect based on role
└── middleware.ts                   → Auth + RBAC enforcement
```

### 4.4 Authentication & Authorization

**Authentication Flows:**

| User Type | Method | Flow |
|-----------|--------|------|
| Admin | Email + Password | Admin logs in with credentials → session created → redirected to /admin/dashboard. Admin accounts are created via seed or by another admin (no public signup). |
| Partner | Email + Password | Partner signs up at /signup (email, password, name, company) or logs in at /login → session created → redirected to /partner/dashboard. Anyone can create a partner account. |
| Borrower | Token in URL | No authentication. Access controlled by unguessable token in the URL path. |

**Authorization (RBAC via Middleware):**

```
middleware.ts enforces:
  /admin/*    → requires session with role = ADMIN
  /partner/*  → requires session with role = PARTNER
  /status/*   → public (no session required, token-based access)
  /auth/*     → public
  /           → redirects to /admin/dashboard or /partner/dashboard based on role
```

**Row-Level Security (enforced in service layer):**
- Partners can only query/view their own deals and commissions.
- Admin can view all deals, all partners, all commissions.
- Borrower token grants read-only access to a single deal's public-facing data.

### 4.5 Event Model, Notifications, and Scale

**What “events” are in this system**

We use the word “event” in two ways:

1. **DealEvent (persisted)**  
   Every meaningful change (stage change, note added, lender assigned, commission update) is written as a row in `DealEvent`. This is the **audit trail and timeline**: who did what, when, and with what visibility (INTERNAL / PARTNER / BORROWER). Timeline views and filtering read from here.

2. **Notifications (V1 vs. later phase)**  
   - **V1 / initial build:** After a state change we **synchronously** call a notification step (e.g. `NotificationService.send...`) in the same request. Write to DB → write DealEvent → send email(s) in process. No queue, no worker.  
   - **Later phase (Scalability — see §7):** We move to **pub/sub**. After each state change we **publish one event** to a topic/queue with a **full payload** so every recipient can be notified from the same event. A **single worker** consumes and sends all emails (partner, borrower, etc.). No synchronous email in the request path.

**Who gets notified, and how**

| Recipient | How they’re notified | “Directly fired” to them? |
|-----------|----------------------|----------------------------|
| **Partner** | Email on key actions (deal submitted, accepted/declined, lender assigned, closed, commission paid, partner-visible notes). | Yes — we send an email when those actions happen (sync in V1, via worker in scalability phase). |
| **Borrower** | (1) One email when the deal is created: status link. (2) When they open the link, they see latest deal state and borrower-visible events. Optionally: email when admin adds a borrower-visible note. | In V1 they see updates on page load. In scalability phase the same pub/sub event can trigger a borrower email; payload has everything needed. |

**Scalability phase: Pub/Sub + single notification worker (detailed in §7)**

- After each state change we **publish** to a single topic (e.g. `notifications` or `deal.events`) with a payload that includes **everything** needed to send any email:
  - `eventType`, `dealId`, `referenceNumber`, `stage`, `visibility`, `note`, etc.
  - **Recipients and delivery data:** e.g. `partnerEmail`, `borrowerEmail`, `statusLink`, `commissionAmount`, `lenderName`, so the worker does not need to look up deal/partner/borrower for each send.
- One **worker** subscribes to that topic. For each message it decides which emails to send (partner, borrower, or both) based on `eventType` and `visibility`, and sends them using the payload. One worker handles all notification types; everyone (partner, borrower) gets what they need from the same event.
- Request path becomes: write to DB → write DealEvent → **publish event** → return. No email sending in the request. Scaling is then a matter of adding workers or scaling the queue.

### 4.6 Key Component Interactions

**Flow 1: Partner Submits a Deal**
```
Partner → fills 3-step form → submits
  → Server Action: createDeal()
    → Validates input
    → Creates Borrower record (or finds existing by email)
    → Creates Deal record (stage = SUBMITTED, generates borrower_access_token)
    → Creates DealEvent (type = STAGE_CHANGE, stage = SUBMITTED, visibility = PARTNER)
    → Triggers NotificationService:
      → Sends confirmation email to partner
      → Sends status link email to borrower
    → Returns deal ID
  → Partner redirected to deal detail page
```

**Flow 2: Admin Reviews and Accepts/Declines a Deal**
```
Admin → opens deal from pipeline → reviews info
  → If first view: auto-create event "Reviewed by [admin name]"
  → Admin clicks "Accept" or "Decline"
    → Server Action: updateDealStage()
      → Validates stage transition (SUBMITTED/IN_REVIEW → ACCEPTED or DECLINED)
      → If DECLINED: requires decline_reason
      → Updates Deal stage
      → Creates DealEvent (visibility = PARTNER)
      → Triggers NotificationService:
        → Emails partner: "Your deal DL-2026-00142 has been accepted" (or declined with reason)
```

**Flow 3: Admin Assigns Lender**
```
Admin → opens accepted deal → clicks "Assign Lender"
  → Client Component: fetches /api/lenders/search with deal parameters
    → Backend: LenderService.findMatches(deal)
      → Queries lender table:
        WHERE deal.loan_amount BETWEEN min_loan_amount AND max_loan_amount
        AND deal.property_state = ANY(coverage_states)
        AND deal.property_type = ANY(property_types)
      → Returns ranked results (exact specialty match first, then partial)
  → Admin sees filtered shortlist (10-20 lenders) with one-click "Assign"
  → Admin selects lender → clicks "Assign"
    → Server Action: assignLender()
      → Updates Deal.assigned_lender_id
      → Creates DealLender record (status = ASSIGNED)
      → Updates stage to LENDER_PLACED
      → Creates DealEvent (visibility = PARTNER)
      → Emails partner: "A lender has been matched to your deal"
```

**Flow 4: Borrower Checks Status**
```
Borrower → opens /status/<token>
  → Server Component: fetches deal by borrower_access_token
    → Returns deal summary + current stage + borrower-visible events
  → Renders: progress stepper + latest update + broker contact info
  → No auth required, no session, no cookies
```

**Flow 5: Deal Closes → Commission Created**
```
Admin → marks deal CLOSED → enters closed_loan_amount
  → Server Action: closeDeal()
    → Updates Deal stage to CLOSED
    → Creates/updates Commission record:
      → Looks up partner.default_commission_pct (or deal-level override)
      → Calculates partner_amount = closed_loan_amount × partner_pct
      → Sets commission status = CONFIRMED
    → Creates DealEvent (visibility = PARTNER)
    → Emails partner: "Your deal has closed! Commission: $X,XXX"
  → Later: Admin marks commission PAID → updates paid_at → emails partner
```

---

## 5. Data Model

### 5.1 Entity Relationship Overview

```
                    ┌──────────┐
                    │   User   │
                    │ (auth)   │
                    └────┬─────┘
                         │ belongs_to (if PARTNER role)
                         ▼
┌──────────┐       ┌──────────┐       ┌──────────────┐
│ Borrower │◄──────│   Deal   │──────►│   Partner    │
│          │  has  │ (central │  ref  │ (referral    │
└──────────┘       │  entity) │  by   │  source)     │
                   └────┬─────┘       └──────────────┘
                        │
           ┌────────────┼────────────┐
           │            │            │
           ▼            ▼            ▼
    ┌────────────┐ ┌──────────┐ ┌────────────┐
    │ DealEvent  │ │DealLender│ │ Commission │
    │ (timeline) │ │ (assign) │ │ (money)    │
    └────────────┘ └─────┬────┘ └────────────┘
                         │
                         ▼
                   ┌──────────┐
                   │  Lender  │
                   │ (7,000)  │
                   └──────────┘
```

### 5.2 Full Schema Definition

Below is the complete database schema using Prisma syntax, annotated with rationale.

```prisma
// ============================================================
// ENUMS
// ============================================================

enum UserRole {
  ADMIN
  PARTNER
}

enum DealStage {
  SUBMITTED        // Partner just submitted; not yet reviewed
  IN_REVIEW        // Admin has opened/acknowledged
  ACCEPTED         // Admin approved; ready for lender matching
  DECLINED         // Admin rejected (with reason)
  LENDER_PLACED    // Lender assigned; outreach in progress
  TERM_SHEET       // Lender issued term sheet
  CLOSING          // In closing process
  CLOSED           // Deal funded; commission earned
  LOST             // Deal fell through after acceptance
}

enum PropertyType {
  MULTIFAMILY
  RETAIL
  OFFICE
  INDUSTRIAL
  MIXED_USE
  HOSPITALITY
  LAND
  SELF_STORAGE
  HEALTHCARE
  OTHER
}

enum TransactionType {
  PURCHASE
  REFINANCE
  CASH_OUT_REFINANCE
  BRIDGE
  CONSTRUCTION
  SBA
  WORKING_CAPITAL
  EQUIPMENT
  OTHER
}

enum DealEventType {
  STAGE_CHANGE
  NOTE
  LENDER_ASSIGNED
  LENDER_REMOVED
  COMMISSION_UPDATE
  SYSTEM             // automated events (e.g., "reminder sent")
}

enum EventVisibility {
  INTERNAL           // admin eyes only
  PARTNER            // visible to admin + partner
  BORROWER           // visible to admin + partner + borrower
}

enum DealLenderStatus {
  ASSIGNED           // primary lender for this deal
  CONTACTED          // lender was contacted but not primary
  CONSIDERED         // lender appeared in shortlist, not contacted
  PASSED             // lender reviewed and passed on the deal
}

enum CommissionStatus {
  ESTIMATED          // deal is active; commission is projected
  CONFIRMED          // deal closed; commission amount finalized
  PAID               // commission disbursed to partner
}

enum DealUrgency {
  NORMAL
  HIGH
  URGENT
}

// ============================================================
// CORE ENTITIES
// ============================================================

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String    // required for all users (partner + admin)
  firstName       String
  lastName        String
  role            UserRole
  partnerId       String?   // FK → Partner (only for PARTNER role)
  isActive        Boolean   @default(true)
  lastLoginAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  partner         Partner?  @relation(fields: [partnerId], references: [id])
  assignedDeals   Deal[]    @relation("AssignedAdmin")
  dealEvents      DealEvent[]

  @@index([email])
  @@index([role])
  @@index([partnerId])
}

model Partner {
  id                    String    @id @default(cuid())
  companyName           String    // e.g., "Keller Williams - John Smith Team"
  contactName           String    // primary contact
  email                 String    @unique
  phone                 String?
  defaultCommissionPct  Decimal   @default(0.25)  // 25% of broker's gross
  isActive              Boolean   @default(true)
  notes                 String?   // admin-only internal notes
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Relations
  users                 User[]
  deals                 Deal[]
  commissions           Commission[]

  @@index([email])
  @@index([isActive])
}

model Borrower {
  id              String    @id @default(cuid())
  firstName       String
  lastName        String
  email           String
  phone           String
  businessName    String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  deals           Deal[]

  @@index([email])
  @@index([businessName])
}

model Deal {
  id                    String          @id @default(cuid())
  referenceNumber       String          @unique  // human-readable: DL-2026-00001
  
  // Relationships
  partnerId             String
  borrowerId            String
  assignedAdminId       String?         // which admin owns this deal
  assignedLenderId      String?         // primary lender (convenience FK)

  // Deal details
  propertyType          PropertyType
  transactionType       TransactionType
  loanAmountRequested   Decimal         // in dollars
  loanAmountClosed      Decimal?        // filled on close
  propertyState         String          @db.VarChar(2)  // e.g., "TX"
  propertyCity          String?
  propertyAddress       String?

  // Lifecycle
  stage                 DealStage       @default(SUBMITTED)
  stageChangedAt        DateTime        @default(now())
  declineReason         String?         // required if DECLINED
  lostReason            String?         // required if LOST

  // Partner input
  urgency               DealUrgency     @default(NORMAL)
  partnerNotes          String?         // free-text from partner at submission
  referralSource        String?         // how borrower found the partner

  // Borrower access
  borrowerAccessToken   String          @unique @default(cuid())

  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  // Relations
  partner               Partner         @relation(fields: [partnerId], references: [id])
  borrower              Borrower        @relation(fields: [borrowerId], references: [id])
  assignedAdmin         User?           @relation("AssignedAdmin", fields: [assignedAdminId], references: [id])
  assignedLender        Lender?         @relation(fields: [assignedLenderId], references: [id])
  events                DealEvent[]
  dealLenders           DealLender[]
  commission            Commission?

  @@index([partnerId])
  @@index([stage])
  @@index([assignedAdminId])
  @@index([assignedLenderId])
  @@index([propertyState])
  @@index([createdAt])
  @@index([borrowerAccessToken])
  @@index([stage, createdAt])         // pipeline queries
  @@index([partnerId, stage])         // partner's deals by stage
}

model DealEvent {
  id              String          @id @default(cuid())
  dealId          String
  actorId         String?         // null for system-generated events
  
  eventType       DealEventType
  fromStage       DealStage?      // for STAGE_CHANGE events
  toStage         DealStage?      // for STAGE_CHANGE events
  note            String?
  visibility      EventVisibility @default(INTERNAL)
  
  metadata        Json?           // flexible extra data (e.g., lender name on assignment)
  
  createdAt       DateTime        @default(now())

  // Relations
  deal            Deal            @relation(fields: [dealId], references: [id], onDelete: Cascade)
  actor           User?           @relation(fields: [actorId], references: [id])

  @@index([dealId, createdAt])    // timeline queries (sorted)
  @@index([dealId, visibility])   // filtered timeline (partner-visible, borrower-visible)
}

model Lender {
  id                  String    @id @default(cuid())
  name                String
  contactName         String?
  contactEmail        String?
  contactPhone        String?
  website             String?
  
  // Matching criteria
  minLoanAmount       Decimal?  // in dollars
  maxLoanAmount       Decimal?  // in dollars
  coverageStates      String[]  // ["TX", "CA", "FL"] or ["NATIONWIDE"]
  propertyTypes       String[]  // ["MULTIFAMILY", "RETAIL", ...]
  transactionTypes    String[]  // ["PURCHASE", "REFINANCE", ...]
  lenderType          String?   // "BANK", "CREDIT_UNION", "DEBT_FUND", "PRIVATE", "SBA_LENDER"
  
  // Admin notes
  notes               String?
  isActive            Boolean   @default(true)
  
  // Preserve raw import data for debugging/auditing
  rawImportData       Json?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  assignedDeals       Deal[]
  dealLenders         DealLender[]

  // ============================================================
  // INDEXES — Critical for fast lender search at 7,000 records
  // ============================================================
  // 
  // GIN indexes on array columns enable fast containment queries:
  //   WHERE 'TX' = ANY(coverage_states)
  //   WHERE 'MULTIFAMILY' = ANY(property_types)
  //
  // BTREE indexes on loan amounts enable range queries:
  //   WHERE min_loan_amount <= $deal_amount 
  //     AND max_loan_amount >= $deal_amount
  //
  // These are defined via raw SQL migration (Prisma doesn't 
  // natively support GIN on arrays), documented below.
  // ============================================================

  @@index([isActive])
  @@index([minLoanAmount])
  @@index([maxLoanAmount])
}

model DealLender {
  id          String            @id @default(cuid())
  dealId      String
  lenderId    String
  status      DealLenderStatus  @default(CONSIDERED)
  notes       String?
  createdAt   DateTime          @default(now())

  // Relations
  deal        Deal              @relation(fields: [dealId], references: [id], onDelete: Cascade)
  lender      Lender            @relation(fields: [lenderId], references: [id])

  @@unique([dealId, lenderId])  // a lender appears once per deal
  @@index([dealId])
  @@index([lenderId])
}

model Commission {
  id                String            @id @default(cuid())
  dealId            String            @unique  // one commission per deal in V1
  partnerId         String
  
  status            CommissionStatus  @default(ESTIMATED)
  grossCommission   Decimal?          // total broker commission (optional)
  partnerPct        Decimal           // e.g., 0.25 for 25%
  partnerAmount     Decimal?          // computed: grossCommission * partnerPct (or manual override)
  closedLoanAmount  Decimal?          // deal's final funded amount
  
  notes             String?
  paidAt            DateTime?
  
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  // Relations
  deal              Deal              @relation(fields: [dealId], references: [id], onDelete: Cascade)
  partner           Partner           @relation(fields: [partnerId], references: [id])

  @@index([partnerId])
  @@index([status])
  @@index([partnerId, status])  // partner's commissions by status
}
```

### 5.3 Additional SQL Indexes (Post-Migration)

Prisma does not natively support GIN indexes on PostgreSQL arrays. These are applied via a raw SQL migration:

```sql
-- Enable trigram extension for fuzzy name search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for lender array columns (fast containment queries)
CREATE INDEX idx_lender_coverage_states ON "Lender" USING GIN ("coverageStates");
CREATE INDEX idx_lender_property_types ON "Lender" USING GIN ("propertyTypes");
CREATE INDEX idx_lender_transaction_types ON "Lender" USING GIN ("transactionTypes");

-- Trigram index for lender name search (fuzzy/partial matching)
CREATE INDEX idx_lender_name_trgm ON "Lender" USING GIN ("name" gin_trgm_ops);

-- Composite index for the primary lender search query pattern
CREATE INDEX idx_lender_active_loan_range ON "Lender" ("isActive", "minLoanAmount", "maxLoanAmount")
  WHERE "isActive" = true;
```

### 5.4 Reference Number Generation

Deal reference numbers follow the pattern `DL-YYYY-NNNNN` (e.g., `DL-2026-00142`). Generated via a PostgreSQL sequence:

```sql
CREATE SEQUENCE deal_ref_seq START 1;

-- In application code:
-- referenceNumber = `DL-${year}-${nextval('deal_ref_seq').toString().padStart(5, '0')}`
```

This gives human-readable, phone-friendly identifiers. Partners can say "DL-2026-142" on a call and everyone knows what deal they mean.

### 5.5 The Lender Search Query

The core query that powers the "Assign Lender" shortlist:

```sql
SELECT l.*,
  -- Scoring: higher = better match
  (CASE WHEN l."propertyTypes" @> ARRAY[$propertyType] THEN 2 ELSE 0 END) +
  (CASE WHEN l."transactionTypes" @> ARRAY[$transactionType] THEN 2 ELSE 0 END) +
  (CASE WHEN l."coverageStates" @> ARRAY[$state] THEN 1 
        WHEN l."coverageStates" @> ARRAY['NATIONWIDE'] THEN 0.5 
        ELSE 0 END) AS match_score
FROM "Lender" l
WHERE l."isActive" = true
  AND (l."minLoanAmount" IS NULL OR l."minLoanAmount" <= $loanAmount)
  AND (l."maxLoanAmount" IS NULL OR l."maxLoanAmount" >= $loanAmount)
  AND (
    l."coverageStates" @> ARRAY[$state]::text[]
    OR l."coverageStates" @> ARRAY['NATIONWIDE']::text[]
  )
ORDER BY match_score DESC, l."name" ASC
LIMIT 20;
```

At 7,000 records with GIN + BTREE indexes, this returns in <50ms. No AI needed — just smart filtering and scoring.

---

## 6. Lender Database Strategy

The lender database (7,000 records in a spreadsheet) is the broker's most valuable asset. Importing it correctly and making it searchable is critical.

### 6.1 CSV Import Pipeline

```
CSV Upload → Parse → Validate → Normalize → Preview → Confirm → Upsert
```

**Step 1: Parse**
- Stream-parse the CSV (handle large files without memory issues)
- Map columns to expected fields via a UI column mapper (in case headers vary)

**Step 2: Validate**
- Check required fields: lender name (at minimum)
- Flag rows with missing/suspicious data (e.g., no contact info, no state coverage)
- Report: "7,000 rows parsed. 6,842 valid. 158 warnings (missing contact info). 0 errors."

**Step 3: Normalize**
This is where the value is. Raw CSV data is messy. Normalization rules:

| Field | Raw Examples | Normalized To |
|-------|-------------|---------------|
| State coverage | "Texas", "TX, CA, FL", "Nationwide", "All States" | `["TX"]`, `["TX","CA","FL"]`, `["NATIONWIDE"]` |
| Loan amounts | "$1MM - $10MM", "1000000-10000000", "$500K+" | `minLoanAmount: 1000000, maxLoanAmount: 10000000` |
| Property types | "multi family", "multifam", "MF, Retail" | `["MULTIFAMILY"]`, `["MULTIFAMILY", "RETAIL"]` |
| Lender type | "Bank", "credit union", "Debt Fund" | Standardized enum string |

The raw import data is preserved in `rawImportData` (JSONB) so nothing is lost.

**Step 4: Preview**
- Admin sees a table of normalized records with highlighted changes
- Can review, correct, and confirm before writing to DB

**Step 5: Upsert**
- Match on `name + contactEmail` to avoid duplicates on re-import
- Insert new, update existing, flag potential duplicates for review

### 6.2 Admin Lender Search UX

On the "Assign Lender" panel for a deal:

1. **Auto-filtered shortlist** appears immediately (matching deal's state, amount, property type)
2. **Manual filter bar** for further narrowing: state dropdown, loan size slider, property type multi-select, lender type, name search
3. **Each lender card shows:** Name, contact, states covered, loan range, specialties, lender type
4. **One-click "Assign" button** on each card
5. **"View all lenders" link** to browse the full database outside a deal context

### 6.3 Keeping Lender Data Clean

- Admin can edit any lender record directly
- Admin can deactivate lenders (soft delete via `isActive = false`)
- Re-import merges with existing records (doesn't create duplicates)
- Future: flag lenders with no deals assigned in 12+ months for review

---

## 7. Milestones & Build Plan

The build is structured in **three steps at most**. The first two steps deliver the full product with synchronous notifications; the third step is a **later phase** for **scalability (pub/sub + single notification worker)**.

### Dependency Overview

```
Step 1: Foundation + Core product (auth, deals, partner portal, admin pipeline)
    │
    └── Step 2: Lenders + Borrower portal + Commissions + Polish & deploy
            │
            └── Step 3: Scalability — Pub/Sub + single notification worker (later phase)
```

---

### Step 1 — Foundation + Core Product

| Task | Detail |
|------|--------|
| Project scaffolding | Next.js + TypeScript + Tailwind + shadcn/ui |
| Database | Prisma schema, migrations, seed script |
| Auth | NextAuth credentials (email + password); partner signup creates Partner + User; RBAC middleware |
| Layouts | Admin layout, Partner layout, Auth layout; deployment (Vercel + Neon) |
| Deal submission | 3-step form, borrower creation, deal creation (reference number, borrower token), DealEvent on submit |
| Partner portal | Deal list, deal detail with timeline; confirmation email to partner; status link email to borrower (sync) |
| Admin pipeline | Pipeline table + kanban or button-based stage change; "Needs Attention"; admin deal detail; stage transitions; notes (Internal / Partner / Borrower) |
| Notifications (V1) | Synchronous: after each action, call NotificationService in-process to send partner/borrower emails |

**Exit criterion:** Partner can sign up, log in, submit a deal, and see it; admin can review, accept/decline, move stages, add notes; partner and borrower receive emails (sent synchronously). App deployed and accessible.

---

### Step 2 — Lenders, Borrower Portal, Commissions, Polish

**Scope:** Lender database and assignment, borrower status page, commission tracking, and production polish. Notifications remain **synchronous**.

| Task | Detail |
|------|--------|
| Lender DB | CSV import (parse, normalize, preview, upsert); GIN + BTREE indexes; lender list/search and detail; Assign Lender panel on deal page; DealLender tracking |
| Borrower portal | Public /status/[token] page; progress stepper; borrower-visible events only; broker contact; mobile-friendly |
| Commissions | Auto-create commission on deal close; calculation; partner commission dashboard; admin commission list and mark paid |
| Polish & deploy | Empty/loading states, error handling, responsive layout, demo data and credentials, README, final deployment |

**Exit criterion:** Admin can import lenders and assign to deals; borrower can view status via link; commissions work end-to-end; app is polished, responsive, and testable with demo credentials.

---

### Step 3 — Scalability: Pub/Sub + Single Notification Worker (Later Phase)

**Scope:** Move all email sending off the request path. After each event we **publish** to a topic/queue with a **full payload**; a **single worker** consumes and sends every email (partner, borrower, or both). This is one cohesive phase (no 7–8 sub-steps).

**Event payload (everything the worker needs):**  
Each published message includes enough data so the worker does not have to look up deal/partner/borrower for every send. Example shape:

- `eventType` (e.g. `deal.submitted`, `deal.stage_changed`, `deal.lender_assigned`, `deal.closed`, `commission.paid`, `note.added`)
- `dealId`, `referenceNumber`, `stage`, `visibility`, `note`
- **Recipients and copy:** `partnerEmail`, `partnerName`; `borrowerEmail`, `borrowerName`; `statusLink`; `commissionAmount`, `lenderName`, `declineReason`, etc.

The worker decides from this one payload which emails to send (partner, borrower, or both) and renders the right template. Everyone (partner, borrower) gets what they need from the same event.

**Implementation outline:**

| Task | Detail |
|------|--------|
| Pub/sub setup | One topic/queue (e.g. Redis/RabbitMQ/SQS/Inngest/Trigger.dev). Single topic for all notification events. |
| Publish on state change | After writing DealEvent, publish one message with the full payload. Request returns immediately; no email in request path. |
| Single notification worker | One worker subscribes to the topic. For each message: map `eventType` + `visibility` to recipient(s) and template; send email(s) via Resend. Retries and dead-letter on failure. |

**Exit criterion:** All notifications (partner and borrower) are sent by the worker after consuming pub/sub messages. API only writes to DB and publishes; no synchronous email sending. System scales by adding workers or scaling the queue.

---

## 8. Risks & Assumptions

### 8.1 Assumptions (Made Explicit)

| # | Assumption | Impact If Wrong | Mitigation |
|---|-----------|----------------|------------|
| A1 | Partners submit lead-level info at intake; deep financial docs are collected separately by another team. | If we need to handle doc upload, the deal form and storage needs change significantly. | Confirmed out of scope in challenge brief. |
| A2 | The lender spreadsheet has reasonably consistent columns (name, states, loan ranges, specialties). | If it's extremely messy (free-text paragraphs, inconsistent structure), import takes longer. | Preserve raw data, normalize conservatively, flag uncertain fields for admin review. |
| A3 | Commission model is a simple percentage split: broker earns gross commission, partner gets X% of that. | If commission structures are tiered, per-product, or negotiated per-deal, the model needs to be more flexible. | V1 supports per-partner default + per-deal override. Covers 90% of cases. |
| A4 | Each deal has one primary borrower. No co-borrowers or guarantors in V1. | If deals commonly have multiple borrowers, the data model needs a many-to-many. | The Borrower model is simple; upgrading to a junction table is a non-breaking change. |
| A5 | Partners are individual users, not teams. One user per partner in V1. | If a brokerage firm has 5 agents who all need access to their shared pipeline, we need team/org support. | The Partner ↔ User relationship already supports multiple users per partner. |
| A6 | The broker (admin) is the primary operator but may have 1-2 assistants. | N/A — the multi-admin model handles this. | Deal.assignedAdminId + activity log supports multiple admins from day one. |
| A7 | Deal stages are linear (with some branches: decline, lost). Deals don't loop back to earlier stages. | If deals commonly bounce between stages, the stage transition logic needs to be more flexible. | V1 enforces forward-only transitions with specific allowed exceptions. |

### 8.2 Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | **Lender CSV data quality is worse than expected.** Inconsistent formatting, missing fields, duplicate entries, free-text specialties that don't map to enums. | High | Medium | Conservative normalization + preserve raw data + admin review UI for flagged records. Budget extra time in M3. |
| R2 | **Stage definitions don't match broker's real workflow.** We define 9 stages; he uses 5 in practice, or he has stages we didn't anticipate. | Medium | Medium | Keep stages as a database enum that's easy to modify. Ship with current stages, get feedback, adjust. |
| R3 | **Partners won't adopt if onboarding is too complex.** Signup or login is confusing, form is too long, they can't find the dashboard. | Medium | High | Simple email + password signup and login. Minimal form (3 short steps for deal submission). Clear "Sign up" and "Log in" on partner portal. Test with a non-technical person before delivery. |
| R4 | **Commission calculation edge cases.** Broker's actual commission structure may have nuances (tiered rates, minimum fees, different rates by product type). | Medium | Low | V1 uses simple percentage + manual override. Admin can always manually set the partner_amount. Covers all edge cases at the cost of a manual step. |
| R5 | **Email deliverability.** Status and commission notification emails ending up in spam. | Low | High | Use a dedicated transactional email service (Resend) with proper SPF/DKIM. Include clear subject lines. Provide admin ability to resend borrower status links. |
| R6 | **48-hour build time is tight for full scope.** Feature creep or unexpected complexity eats into polish time. | Medium | Medium | Milestones are ordered by priority. If time runs short, M4 (Borrower Portal) and M5 (Commissions) can be simplified. M6 (Polish) should not be skipped. |
| R7 | **Borrower access token security.** If tokens are guessable or leaked, unauthorized access to deal information. | Low | Medium | Tokens are 25+ character CUIDs (effectively unguessable). No sensitive financial details on the borrower page. Rate limiting on the status endpoint. |
| R8 | **Multi-admin conflicts.** Two admins update the same deal simultaneously. | Low (V1) | Low | Activity log shows who changed what and when. Optimistic concurrency (updatedAt check) prevents silent overwrites. Full locking is V2. |

### 8.3 Questions I Would Ask Before Building (But Can Proceed Without)

1. **"What fields do you absolutely need on intake vs. what can wait?"** I've designed a minimal form, but the broker may have must-haves I don't know about (e.g., borrower credit score, property value, existing debt).

2. **"How do you calculate commissions today?"** I'm assuming simple percentage splits. If there are tiers, minimums, or product-specific rates, I need to know.

3. **"Do your referral partners work solo or in teams?"** The data model supports both (multiple Users per Partner), but the UI flow changes if we need team dashboards.

4. **"What does the lender spreadsheet actually look like?"** I'd want to see 10 rows to calibrate the normalization logic. Column headers, data formats, and messiness level.

5. **"Are there stages in your deal lifecycle I'm missing?"** For example: "Sent to Multiple Lenders," "Counter-Offer," "Appraisal Ordered," etc.

6. **"Do borrowers ever have multiple active deals?"** This affects how the borrower status link works (one link per deal vs. a borrower dashboard).

7. **"Who else might need access? Assistants? Accountant? Attorney?"** This determines how much we invest in role granularity in V1.

---

## 9. Appendix: API Surface & Route Map

### 9.1 Server Actions (Primary Mutation Layer)

| Action | Access | Description |
|--------|--------|-------------|
| `createDeal` | PARTNER | Submit new deal + create borrower |
| `updateDealStage` | ADMIN | Transition deal to next stage |
| `addDealNote` | ADMIN, PARTNER | Add note with visibility level |
| `assignLender` | ADMIN | Assign lender to deal |
| `removeLender` | ADMIN | Remove lender assignment |
| `closeDeal` | ADMIN | Mark deal closed + trigger commission |
| `createPartner` | ADMIN | Create new partner record (optional; partners can also self-signup) |
| `importLenders` | ADMIN | Process CSV import |
| `updateLender` | ADMIN | Edit lender record |
| `updateCommission` | ADMIN | Adjust or mark commission as paid |

### 9.2 API Routes (For Client-Side Fetching)

| Route | Method | Access | Description |
|-------|--------|--------|-------------|
| `/api/lenders/search` | GET | ADMIN | Search lenders with filters (used in assign panel) |
| `/api/deals/[id]/events` | GET | ADMIN, PARTNER | Fetch timeline events (filtered by visibility) |
| `/api/auth/[...nextauth]` | * | Public | NextAuth endpoints |

### 9.3 Notification Triggers

| Event | Email To | Content |
|-------|----------|---------|
| Deal submitted | Partner | "Your deal DL-2026-00142 has been received. We'll review it within 24 hours." |
| Deal submitted | Borrower | "Your financing request is being reviewed. Track status here: [link]" |
| Deal accepted | Partner | "Great news — your deal DL-2026-00142 has been accepted. We're matching a lender." |
| Deal declined | Partner | "Your deal DL-2026-00142 was not accepted. Reason: [reason]. Questions? Call us." |
| Lender assigned | Partner | "A lender has been matched to deal DL-2026-00142. We're in active discussions." |
| Stage advanced | Partner | "Update on deal DL-2026-00142: [new stage description]." |
| Deal closed | Partner | "Congratulations! Deal DL-2026-00142 has closed. Your commission: $X,XXX." |
| Commission paid | Partner | "Your commission of $X,XXX for deal DL-2026-00142 has been paid." |
| Admin note (partner-visible) | Partner | "New update on deal DL-2026-00142: [note content]." |

---

## Summary

This is a platform that turns an unscalable, phone-dependent brokerage operation into a structured pipeline. It doesn't try to replace the broker's expertise — it eliminates everything *around* that expertise that currently breaks when he's unavailable.

V1 delivers the three core capabilities that unlock the most value:

1. **Partner self-service** (stops the phone from ringing)
2. **Admin pipeline management** (turns tribal knowledge into process)
3. **Commission transparency** (keeps partners loyal and reduces disputes)

The tech stack is production-grade but buildable in 48 hours. The data model captures the real complexity of the domain (deals, lenders, commissions, events) without over-engineering. The build is **three steps at most:** Step 1 (foundation + core product), Step 2 (lenders, borrower portal, commissions, polish), and Step 3 (later phase: pub/sub + single notification worker for scalability). Step 3 moves all email sending off the request path so the system scales without adding synchronous notification work to the API.
