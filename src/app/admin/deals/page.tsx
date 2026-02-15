import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getStageInfo, DEAL_STAGES } from "@/lib/constants";

export default async function AdminDeals() {
  const deals = await prisma.deal.findMany({
    include: { borrower: true, partner: true, assignedLender: true },
    orderBy: { createdAt: "desc" },
  });

  // Group by stage for summary
  const stageCounts = DEAL_STAGES.map((stage) => ({
    ...stage,
    count: deals.filter((d) => d.stage === stage.value).length,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Deal Pipeline</h1>

      {/* Stage Summary */}
      <div className="flex flex-wrap gap-2">
        {stageCounts.map((s) => (
          <Badge key={s.value} variant="secondary" className={`${s.color} px-3 py-1`}>
            {s.label}: {s.count}
          </Badge>
        ))}
      </div>

      {/* Deals Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Borrower</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Partner</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">State</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Lender</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deals.map((deal) => {
                  const stageInfo = getStageInfo(deal.stage);
                  return (
                    <tr key={deal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/admin/deals/${deal.id}`} className="text-blue-600 hover:underline font-medium">
                          {deal.referenceNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm">{deal.borrower.firstName} {deal.borrower.lastName}</td>
                      <td className="px-6 py-4 text-sm">{deal.partner.companyName}</td>
                      <td className="px-6 py-4 text-sm">{formatCurrency(deal.loanAmountRequested)}</td>
                      <td className="px-6 py-4 text-sm">{deal.propertyType.replace(/_/g, " ")}</td>
                      <td className="px-6 py-4 text-sm">{deal.propertyState}</td>
                      <td className="px-6 py-4 text-sm">{deal.assignedLender?.name ?? "—"}</td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className={stageInfo.color}>{stageInfo.label}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(deal.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
