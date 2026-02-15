import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate, getStageInfo } from "@/lib/constants";
import { Commission, Deal } from "@prisma/client";

export default async function AdminDashboard() {
  const [deals, commissions, partnerCount, lenderCount] = await Promise.all([
    prisma.deal.findMany({
      include: { borrower: true, partner: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.commission.findMany(),
    prisma.partner.count(),
    prisma.lender.count({ where: { isActive: true } }),
  ]);

  const activeDeals = deals.filter(
    (d: Deal) => !["CLOSED", "DECLINED", "LOST"].includes(d.stage)
  );
  const needsAttention = deals.filter(
    (d: Deal) => d.stage === "SUBMITTED" || d.stage === "UNDER_REVIEW"
  );
  const pipelineValue = activeDeals.reduce((s: number, d: Deal) => s + d.loanAmountRequested, 0);

  const grossRevenue = commissions
    .filter((c: Commission) => c.status === "CONFIRMED" || c.status === "PAID")
    .reduce((s: number, c: Commission) => s + (c.grossCommission || 0), 0);

  const pendingPayables = commissions
    .filter((c: Commission) => c.status === "CONFIRMED")
    .reduce((s: number, c: Commission) => s + (c.partnerAmount || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Active Deals" value={String(activeDeals.length)} />
        <MetricCard label="Needs Attention" value={String(needsAttention.length)} accent="red" />
        <MetricCard label="Pipeline Value" value={formatCurrency(pipelineValue)} />
        <MetricCard label="Gross Revenue" value={formatCurrency(grossRevenue)} accent="emerald" />
        <MetricCard label="Partner Payables" value={formatCurrency(pendingPayables)} accent="amber" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Partners" value={String(partnerCount)} />
        <MetricCard label="Active Lenders" value={String(lenderCount)} />
      </div>

      {/* Needs Attention */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Needs Attention</h2>
        {needsAttention.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Borrower</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Partner</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {needsAttention.map((deal: Deal) => {
                    const stageInfo = getStageInfo(deal.stage);
                    return (
                      <tr key={deal.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link href={`/admin/deals/${deal.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                            {deal.referenceNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-700">{deal.borrower.firstName} {deal.borrower.lastName}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{deal.partner.companyName}</td>
                        <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{formatCurrency(deal.loanAmountRequested)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${stageInfo.color}`}>{stageInfo.label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(deal.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm py-12 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">All clear. New partner submissions will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const textColor = accent === "red" ? "text-red-600"
    : accent === "emerald" ? "text-emerald-600"
    : accent === "amber" ? "text-amber-600"
    : "text-slate-900";

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${textColor}`}>{value}</p>
    </div>
  );
}
