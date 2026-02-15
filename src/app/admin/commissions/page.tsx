import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/constants";
import { MarkPaidButton } from "@/components/admin/mark-paid-button";
import { Commission } from "@prisma/client";

export default async function AdminCommissions() {
  const commissions = await prisma.commission.findMany({
    include: {
      deal: { include: { borrower: true } },
      partner: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const grossRevenue = commissions
    .filter((c: Commission) => c.status === "CONFIRMED" || c.status === "PAID")
    .reduce((s: number, c: Commission) => s + (c.grossCommission || 0), 0);
  const totalPaid = commissions
    .filter((c: Commission) => c.status === "PAID")
    .reduce((s: number, c: Commission) => s + (c.partnerAmount || 0), 0);
  const totalPending = commissions
    .filter((c: Commission) => c.status === "CONFIRMED")
    .reduce((s: number, c: Commission) => s + (c.partnerAmount || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Gross Revenue</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(grossRevenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Partner Payables (Pending)</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Paid to Partners</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Deal</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Partner</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Loan Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Gross</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Partner %</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Partner Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{c.deal.referenceNumber}</td>
                    <td className="px-6 py-4 text-sm">{c.partner.companyName}</td>
                    <td className="px-6 py-4 text-sm">
                      {c.closedLoanAmount ? formatCurrency(c.closedLoanAmount) : formatCurrency(c.deal.loanAmountRequested)}
                    </td>
                    <td className="px-6 py-4 text-sm">{c.grossCommission ? formatCurrency(c.grossCommission) : "—"}</td>
                    <td className="px-6 py-4 text-sm">{(c.partnerPct * 100).toFixed(0)}%</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {c.partnerAmount ? formatCurrency(c.partnerAmount) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={
                          c.status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : c.status === "CONFIRMED"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {c.status === "CONFIRMED" && <MarkPaidButton commissionId={c.id} />}
                      {c.status === "PAID" && (
                        <span className="text-xs text-gray-400">
                          Paid {c.paidAt ? formatDate(c.paidAt) : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
