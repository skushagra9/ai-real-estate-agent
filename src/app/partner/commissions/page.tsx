import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, estimatedPartnerCommission } from "@/lib/constants";

export default async function PartnerCommissions() {
  const session = await auth();
  if (!session?.user?.partnerId) redirect("/login");

  const commissions = await prisma.commission.findMany({
    where: { partnerId: session.user.partnerId },
    include: { deal: { include: { borrower: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalEarned = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + (c.partnerAmount || 0), 0);
  const totalPending = commissions
    .filter((c) => c.status === "CONFIRMED")
    .reduce((sum, c) => sum + (c.partnerAmount || 0), 0);
  const totalProjected = commissions
    .filter((c) => c.status === "ESTIMATED")
    .reduce((sum, c) => sum + estimatedPartnerCommission(c.deal.loanAmountRequested, c.partnerPct), 0);

  function statusBadge(status: string) {
    switch (status) {
      case "PAID":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
      case "CONFIRMED":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
      default:
        return "bg-slate-50 text-slate-600 ring-1 ring-slate-200";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Commissions</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track your earnings across all deals</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Earned</p>
          <p className="text-2xl font-semibold text-emerald-600 mt-1">{formatCurrency(totalEarned)}</p>
          <p className="text-xs text-slate-400 mt-1">Paid out to you</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-slate-400 mt-1">Confirmed, awaiting payout</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Projected</p>
          <p className="text-2xl font-semibold text-indigo-600 mt-1">{formatCurrency(totalProjected)}</p>
          <p className="text-xs text-slate-400 mt-1">Estimated from active deals</p>
        </div>
      </div>

      {/* Table */}
      {commissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm py-16 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm mb-2">No commissions yet</p>
          <p className="text-xs text-slate-400 mb-4">Commissions are created when you submit deals</p>
          <Link
            href="/partner/deals/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Submit a deal
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
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Deal</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Borrower</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Loan Amount</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Your %</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Commission</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/partner/deals/${c.dealId}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {c.deal.referenceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700">
                      {c.deal.borrower.firstName} {c.deal.borrower.lastName}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-800">
                      {c.closedLoanAmount ? formatCurrency(c.closedLoanAmount) : formatCurrency(c.deal.loanAmountRequested)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700">{(c.partnerPct * 100).toFixed(0)}%</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-900">
                      {c.partnerAmount
                        ? formatCurrency(c.partnerAmount)
                        : c.status === "ESTIMATED"
                        ? formatCurrency(estimatedPartnerCommission(c.deal.loanAmountRequested, c.partnerPct))
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium ${statusBadge(c.status)}`}>
                        {c.status === "ESTIMATED" ? "Projected" : c.status === "CONFIRMED" ? "Pending" : "Paid"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
