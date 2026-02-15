import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, getStageInfo, estimatedPartnerCommission } from "@/lib/constants";

export default async function PartnerDashboard() {
  const session = await auth();
  if (!session?.user?.partnerId) redirect("/login");

  const [deals, commissions] = await Promise.all([
    prisma.deal.findMany({
      where: { partnerId: session.user.partnerId },
      include: { borrower: true, commission: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.commission.findMany({
      where: { partnerId: session.user.partnerId },
      include: { deal: true },
    }),
  ]);

  const totalEarned = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + (c.partnerAmount || 0), 0);
  const totalPending = commissions
    .filter((c) => c.status === "CONFIRMED")
    .reduce((sum, c) => sum + (c.partnerAmount || 0), 0);
  const totalProjected = commissions
    .filter((c) => c.status === "ESTIMATED")
    .reduce((sum, c) => sum + estimatedPartnerCommission(c.deal.loanAmountRequested, c.partnerPct), 0);
  const activeDeals = deals.filter(
    (d) => !["CLOSED", "DECLINED", "LOST"].includes(d.stage)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Your Deals</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track your referral deals and commissions</p>
        </div>
        <Link
          href="/partner/deals/new"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Submit New Deal
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Active Deals" value={String(activeDeals)} />
        <SummaryCard label="Earned" value={formatCurrency(totalEarned)} color="emerald" />
        <SummaryCard label="Pending" value={formatCurrency(totalPending)} color="amber" />
        <SummaryCard label="Projected" value={formatCurrency(totalProjected)} color="indigo" />
      </div>

      {/* Deal list */}
      {deals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm py-16 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm mb-3">No deals yet</p>
          <Link
            href="/partner/deals/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Submit your first deal
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Borrower</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Commission</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deals.map((deal) => {
                  const stage = getStageInfo(deal.stage);
                  return (
                    <tr key={deal.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/partner/deals/${deal.id}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {deal.referenceNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">
                        {deal.borrower.firstName} {deal.borrower.lastName}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">
                        {formatCurrency(deal.loanAmountRequested)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${stage.color}`}>
                          {stage.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">
                        {deal.commission?.partnerAmount
                          ? formatCurrency(deal.commission.partnerAmount)
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">
                        {formatDate(deal.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const textColor = color === "emerald" ? "text-emerald-600"
    : color === "amber" ? "text-amber-600"
    : color === "indigo" ? "text-indigo-600"
    : "text-slate-900";

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${textColor}`}>{value}</p>
    </div>
  );
}
