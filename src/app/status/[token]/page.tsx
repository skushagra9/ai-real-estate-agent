import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  formatCurrency,
  formatDate,
  BORROWER_PROGRESS_STAGES,
  LOAN_TYPES,
  PROPERTY_TYPES,
  getStageInfo,
} from "@/lib/constants";

export default async function BorrowerStatus({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const deal = await prisma.deal.findUnique({
    where: { borrowerAccessToken: token },
    include: {
      borrower: true,
      partner: {
        include: { users: true },
      },
      events: {
        where: {
          visibility: { in: ["BORROWER", "PARTNER"] },
          eventType: "STAGE_CHANGE",
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!deal) notFound();

  const stage = getStageInfo(deal.stage);
  const loanTypeLabel = LOAN_TYPES.find((t) => t.value === deal.loanType)?.label ?? deal.loanType;
  const propertyLabel = PROPERTY_TYPES.find((t) => t.value === deal.propertyType)?.label ?? deal.propertyType;

  const agentUser = deal.partner.users[0];
  const agentName = agentUser
    ? `${agentUser.firstName} ${agentUser.lastName}`
    : deal.partner.contactName;
  const agentEmail = agentUser?.email || deal.partner.email;
  const agentInitials = (agentName || "A").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const currentStageIndex = BORROWER_PROGRESS_STAGES.indexOf(
    deal.stage as (typeof BORROWER_PROGRESS_STAGES)[number]
  );
  const isTerminal = deal.stage === "DECLINED" || deal.stage === "LOST";
  const progressPct = isTerminal
    ? 100
    : currentStageIndex >= 0
      ? ((currentStageIndex + 1) / BORROWER_PROGRESS_STAGES.length) * 100
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">LF</span>
          </div>
          <span className="text-sm font-semibold text-slate-700">Loan Application Status</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Greeting */}
        <div className="px-1">
          <h1 className="text-lg font-semibold text-slate-900">
            Hi {deal.borrower.firstName},
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Here&apos;s the latest on your loan application.
          </p>
        </div>

        {/* Deal summary card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-1">
                  <span className="text-[11px] px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium">{loanTypeLabel}</span>
                  <span className="text-[11px] px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium">{propertyLabel}</span>
                </div>
                {deal.propertyAddress && (
                  <p className="text-sm text-slate-500 truncate">{deal.propertyAddress}</p>
                )}
                <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(deal.loanAmountRequested)}</p>
              </div>
            </div>
          </div>
          {/* Status bar */}
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                isTerminal ? "bg-red-50 text-red-600 ring-1 ring-red-200" : stage.color
              }`}>
                {stage.label}
              </span>
              <span className="text-xs text-slate-400 font-medium">{Math.round(progressPct)}% complete</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isTerminal ? "bg-red-400" : "bg-indigo-500"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Progress steps */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Loan Progress</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-200" />

            <div className="space-y-0">
              {BORROWER_PROGRESS_STAGES.map((s, i) => {
                const isActive = i <= currentStageIndex && !isTerminal;
                const isCurrent = i === currentStageIndex && !isTerminal;
                const isPast = i < currentStageIndex && !isTerminal;
                const label = getStageInfo(s).label;

                return (
                  <div key={s} className="relative flex items-start gap-3.5 py-2">
                    <div className="relative z-10">
                      {isPast ? (
                        <div className="w-[22px] h-[22px] rounded-full bg-indigo-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : isCurrent ? (
                        <div className="w-[22px] h-[22px] rounded-full bg-indigo-600 ring-[3px] ring-indigo-100 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      ) : (
                        <div className="w-[22px] h-[22px] rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                          <span className="text-[9px] font-semibold text-slate-400">{i + 1}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-sm font-medium ${
                        isCurrent ? "text-indigo-700" : isActive ? "text-slate-700" : "text-slate-400"
                      }`}>
                        {label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-indigo-500 mt-0.5">Currently here</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timeline */}
        {deal.events.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Activity</h2>
            <div className="space-y-3">
              {deal.events.map((event, idx) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                    idx === deal.events.length - 1 ? "bg-indigo-500" : "bg-slate-300"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{event.note || getStageInfo(event.toStage || "SUBMITTED").label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(event.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent contact card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Your Agent</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
              <span className="text-indigo-600 font-bold text-sm">{agentInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{agentName}</p>
              {deal.partner.phone && (
                <p className="text-xs text-slate-500">{deal.partner.phone}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`mailto:${agentEmail}`}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
            {deal.partner.phone && (
              <a
                href={`tel:${deal.partner.phone}`}
                className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 py-4">
          Powered by LoanFlow
        </p>
      </main>
    </div>
  );
}
