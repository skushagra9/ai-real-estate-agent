import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatDateTime,
  formatDate,
  getStageInfo,
  PROPERTY_TYPES,
  LOAN_TYPES,
  TRANSACTION_TYPES,
  BORROWER_PROGRESS_STAGES,
} from "@/lib/constants";
import { PartnerNoteForm } from "@/components/partner/partner-note-form";

export default async function PartnerDealDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.partnerId) redirect("/login");

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      borrower: true,
      commission: true,
      events: {
        where: { visibility: { in: ["PARTNER", "BORROWER"] } },
        orderBy: { createdAt: "desc" },
        include: { actor: true },
      },
    },
  });

  if (!deal || deal.partnerId !== session.user.partnerId) notFound();

  const stage = getStageInfo(deal.stage);
  const propertyLabel = PROPERTY_TYPES.find((t) => t.value === deal.propertyType)?.label ?? deal.propertyType;
  const loanTypeLabel = LOAN_TYPES.find((t) => t.value === deal.loanType)?.label ?? deal.loanType;
  const transactionLabel = TRANSACTION_TYPES.find((t) => t.value === deal.transactionType)?.label ?? deal.transactionType;

  const trackingUrl = deal.enableClientTracking
    ? `/status/${deal.borrowerAccessToken}`
    : null;

  // Progress computation
  const currentStageIndex = BORROWER_PROGRESS_STAGES.indexOf(
    deal.stage as (typeof BORROWER_PROGRESS_STAGES)[number]
  );
  const progressPct = currentStageIndex >= 0
    ? ((currentStageIndex + 1) / BORROWER_PROGRESS_STAGES.length) * 100
    : 0;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back */}
      <Link href="/partner/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Deals
      </Link>

      {/* Header card with progress */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-lg font-semibold text-slate-900">Deal #{deal.referenceNumber}</h1>
              <Badge className={`${stage.color} text-[11px]`}>{stage.label}</Badge>
            </div>
            <p className="text-sm text-slate-500">
              {deal.borrower.firstName} {deal.borrower.lastName}
              {deal.propertyAddress && ` — ${deal.propertyAddress}`}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{loanTypeLabel}</span>
              <span className="text-slate-300">·</span>
              <span>{transactionLabel}</span>
              <span className="text-slate-300">·</span>
              <span className="font-medium text-slate-700">{formatCurrency(deal.loanAmountRequested)}</span>
            </div>
          </div>
          {deal.commission && (
            <div className="text-right shrink-0 bg-emerald-50 rounded-lg px-4 py-2">
              <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold block">Commission</span>
              <span className="text-lg font-bold text-emerald-700">
                {deal.commission.partnerAmount
                  ? formatCurrency(deal.commission.partnerAmount)
                  : `${(deal.commission.partnerPct * 100).toFixed(1)}%`}
              </span>
            </div>
          )}
        </div>
        {/* Mini progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Tracking link */}
      {trackingUrl && (
        <div className="flex items-center gap-3 bg-indigo-50/60 border border-indigo-100 rounded-lg px-4 py-3">
          <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-sm text-indigo-700">Client tracking:</span>
          <a href={trackingUrl} target="_blank" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-mono truncate">
            {trackingUrl}
          </a>
        </div>
      )}

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left */}
        <div className="lg:col-span-3 space-y-5">
          {/* Deal details */}
          <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">Deal Information</h2>
            </div>
            <div className="p-5">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <DL label="Loan Type" value={loanTypeLabel} />
                <DL label="Transaction" value={transactionLabel} />
                <DL label="Property" value={propertyLabel} />
                <DL label="Loan Amount" value={formatCurrency(deal.loanAmountRequested)} bold />
                {deal.purchasePrice && <DL label="Purchase Price" value={formatCurrency(deal.purchasePrice)} />}
                {deal.targetLtv && <DL label="Target LTV" value={`${deal.targetLtv.toFixed(1)}%`} />}
                {deal.estimatedCloseDate && <DL label="Est. Close" value={formatDate(deal.estimatedCloseDate)} />}
                {deal.loanAmountClosed && <DL label="Closed Amount" value={formatCurrency(deal.loanAmountClosed)} bold green />}
              </dl>
              {deal.propertyAddress && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-sm">
                  <span className="text-slate-400">Address</span>
                  <p className="text-slate-700 mt-0.5">{deal.propertyAddress}</p>
                </div>
              )}
            </div>
          </section>

          {/* Borrower */}
          <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">Borrower</h2>
            </div>
            <div className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-slate-500">
                  {deal.borrower.firstName[0]}{deal.borrower.lastName?.[0] || ""}
                </span>
              </div>
              <div className="text-sm">
                <p className="font-medium text-slate-900">{deal.borrower.firstName} {deal.borrower.lastName}</p>
                <p className="text-slate-500">{deal.borrower.email}</p>
                {deal.borrower.phone && <p className="text-slate-400">{deal.borrower.phone}</p>}
              </div>
            </div>
          </section>

          {/* Partner can add a note (partner-visible only) */}
          <PartnerNoteForm dealId={deal.id} />
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-5">
          {/* Commission */}
          <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">Commission</h2>
            </div>
            <div className="p-5 text-sm">
              {deal.commission ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Status</span>
                    <Badge variant="secondary" className="text-[11px]">{deal.commission.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Your Share</span>
                    <span className="font-medium">{(deal.commission.partnerPct * 100).toFixed(1)}%</span>
                  </div>
                  {deal.commission.partnerAmount && (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-slate-500">Amount</span>
                      <span className="font-bold text-lg text-emerald-600">
                        {formatCurrency(deal.commission.partnerAmount)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Calculated when the deal closes</p>
              )}
            </div>
          </section>

          {/* Timeline */}
          <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">Timeline</h2>
            </div>
            <div className="p-5">
              {deal.events.length === 0 ? (
                <p className="text-slate-400 text-sm">No updates yet</p>
              ) : (
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {deal.events.map((event, idx) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          idx === 0 ? "bg-indigo-500" : "bg-slate-300"
                        }`} />
                        {idx < deal.events.length - 1 && (
                          <div className="w-px flex-1 bg-slate-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-3">
                        <p className="text-sm text-slate-800">{event.note}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateTime(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DL({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
  return (
    <div>
      <dt className="text-slate-400 text-xs">{label}</dt>
      <dd className={`mt-0.5 ${bold ? "font-semibold" : ""} ${green ? "text-emerald-600" : "text-slate-800"}`}>{value}</dd>
    </div>
  );
}
