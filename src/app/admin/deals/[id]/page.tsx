import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  formatCurrency,
  formatDateTime,
  formatDate,
  getStageInfo,
  PROPERTY_TYPES,
  LOAN_TYPES,
  TRANSACTION_TYPES,
  LOAN_POSITIONS,
  OCCUPANCY_TYPES,
  STAGE_TRANSITIONS,
} from "@/lib/constants";
import { StageActions } from "@/components/admin/stage-actions";
import { AddNoteForm } from "@/components/admin/add-note-form";
import { AssignLenderPanel } from "@/components/admin/assign-lender-panel";

export default async function AdminDealDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      borrower: true,
      partner: true,
      commission: true,
      assignedLender: true,
      events: {
        orderBy: { createdAt: "desc" },
        include: { actor: true },
      },
    },
  });

  if (!deal) notFound();

  const stage = getStageInfo(deal.stage);
  const propertyLabel = PROPERTY_TYPES.find((t) => t.value === deal.propertyType)?.label ?? deal.propertyType;
  const loanTypeLabel = LOAN_TYPES.find((t) => t.value === deal.loanType)?.label ?? deal.loanType;
  const transactionLabel = TRANSACTION_TYPES.find((t) => t.value === deal.transactionType)?.label ?? deal.transactionType;
  const loanPositionLabel = LOAN_POSITIONS.find((t) => t.value === deal.loanPosition)?.label ?? deal.loanPosition;
  const occupancyLabel = OCCUPANCY_TYPES.find((t) => t.value === deal.occupancy)?.label ?? deal.occupancy;
  const allowedTransitions = STAGE_TRANSITIONS[deal.stage] || [];

  const trackingUrl = deal.enableClientTracking
    ? `/status/${deal.borrowerAccessToken}`
    : null;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Back */}
      <Link href="/admin/deals" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Pipeline
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-lg font-bold text-slate-900">Deal #{deal.referenceNumber}</h1>
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${stage.color}`}>
                {stage.label}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {deal.borrower.firstName} {deal.borrower.lastName}
              {deal.propertyAddress && <span className="text-slate-400"> — {deal.propertyAddress}</span>}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Referred by <span className="text-slate-500 font-medium">{deal.partner.companyName}</span> ({deal.partner.contactName})
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(deal.loanAmountRequested)}</p>
            {deal.loanAmountClosed && (
              <p className="text-sm text-emerald-600 font-medium mt-0.5">
                Closed: {formatCurrency(deal.loanAmountClosed)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stage actions */}
      {allowedTransitions.length > 0 && (
        <StageActions
          dealId={deal.id}
          currentStage={deal.stage}
          transitions={allowedTransitions}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Deal details */}
          <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">Deal Details</h2>
            </div>
            <div className="p-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="Loan Type" value={loanTypeLabel} />
                <Field label="Transaction" value={transactionLabel} />
                <Field label="Loan Position" value={loanPositionLabel} />
                <Field label="Property Type" value={propertyLabel} />
                <Field label="Occupancy" value={occupancyLabel} />
                <Field label="Loan Amount" value={formatCurrency(deal.loanAmountRequested)} bold />
                {deal.purchasePrice != null && <Field label="Purchase Price" value={formatCurrency(deal.purchasePrice)} />}
                {deal.noi != null && <Field label="NOI" value={formatCurrency(deal.noi)} />}
                {deal.targetLtv != null && <Field label="Target LTV" value={`${deal.targetLtv.toFixed(2)}%`} />}
                {deal.estimatedCloseDate && <Field label="Est. Close" value={formatDate(deal.estimatedCloseDate)} />}
                <Field label="Recourse" value={deal.recourseAcceptance ? "Yes" : "No"} />
                {deal.partnerCompensation != null && <Field label="Partner Comp" value={`${deal.partnerCompensation}%`} />}
                {deal.propertyAddress && (
                  <div className="col-span-2">
                    <Field label="Address" value={deal.propertyAddress} />
                  </div>
                )}
              </dl>
              {deal.partnerNotes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">Partner Notes</p>
                  <p className="text-sm text-slate-700">{deal.partnerNotes}</p>
                </div>
              )}
            </div>
          </section>

          {/* Borrower */}
          <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">Borrower</h2>
            </div>
            <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-slate-500">
                    {deal.borrower.firstName[0]}{deal.borrower.lastName?.[0] || ""}
                  </span>
                </div>
                <div className="text-sm min-w-0">
                  <p className="font-medium text-slate-900">{deal.borrower.firstName} {deal.borrower.lastName}</p>
                  <p className="text-slate-500 truncate">{deal.borrower.email}</p>
                  {deal.borrower.phone && <p className="text-slate-400">{deal.borrower.phone}</p>}
                </div>
              </div>
              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  className="shrink-0 text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                >
                  View tracking page
                </a>
              )}
            </div>
          </section>

          {/* Lender Assignment */}
          <AssignLenderPanel
            dealId={deal.id}
            currentLenderId={deal.assignedLenderId}
            dealState={deal.propertyState || ""}
            dealAmount={deal.loanAmountRequested}
            dealPropertyType={deal.propertyType}
          />

          {deal.assignedLender && (
            <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-700">Assigned Lender</h2>
              </div>
              <div className="p-5 text-sm space-y-1.5">
                <p className="font-medium text-slate-900">{deal.assignedLender.name}</p>
                {deal.assignedLender.contactName && <p className="text-slate-500">{deal.assignedLender.contactName}</p>}
                {deal.assignedLender.contactEmail && (
                  <p className="text-slate-500">
                    <a href={`mailto:${deal.assignedLender.contactEmail}`} className="text-indigo-600 hover:underline">
                      {deal.assignedLender.contactEmail}
                    </a>
                  </p>
                )}
                {deal.assignedLender.contactPhone && <p className="text-slate-400">{deal.assignedLender.contactPhone}</p>}
              </div>
            </section>
          )}

          <AddNoteForm dealId={deal.id} />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Commission */}
          <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">Commission</h2>
            </div>
            <div className="p-5 text-sm">
              {deal.commission ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Status</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      deal.commission.status === "PAID"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : deal.commission.status === "CONFIRMED"
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          : "bg-slate-50 text-slate-600 ring-1 ring-slate-200"
                    }`}>
                      {deal.commission.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Partner %</span>
                    <span className="font-medium">{(deal.commission.partnerPct * 100).toFixed(1)}%</span>
                  </div>
                  {deal.commission.grossCommission != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gross</span>
                      <span className="font-medium">{formatCurrency(deal.commission.grossCommission)}</span>
                    </div>
                  )}
                  {deal.commission.partnerAmount != null && (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-slate-500">Partner Payout</span>
                      <span className="font-bold text-lg text-emerald-600">{formatCurrency(deal.commission.partnerAmount)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">No commission record yet.</p>
              )}
            </div>
          </section>

          {/* Timeline */}
          <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">Timeline</h2>
            </div>
            <div className="p-5">
              {deal.events.length === 0 ? (
                <p className="text-slate-400 text-sm">No events yet</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {deal.events.map((event, idx) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                          idx === 0 ? "bg-indigo-500" : "bg-slate-300"
                        }`} />
                        {idx < deal.events.length - 1 && (
                          <div className="w-px flex-1 bg-slate-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-3">
                        <p className="text-sm text-slate-800">{event.note}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-slate-400">{formatDateTime(event.createdAt)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            event.visibility === "INTERNAL"
                              ? "bg-red-50 text-red-500"
                              : event.visibility === "PARTNER"
                                ? "bg-blue-50 text-blue-500"
                                : "bg-slate-50 text-slate-500"
                          }`}>
                            {event.visibility}
                          </span>
                        </div>
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

function Field({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className={`mt-0.5 text-slate-800 ${bold ? "font-semibold" : ""}`}>{value}</dd>
    </div>
  );
}
