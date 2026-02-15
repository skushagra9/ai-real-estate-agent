import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import { LenderImport } from "@/components/admin/lender-import";

export default async function PartnerLenders() {
  const lenders = await prisma.lender.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { assignedDeals: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lender Database</h1>
          <p className="text-gray-500">{lenders.length} active lenders</p>
        </div>
        <LenderImport />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Loan Range</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">States</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Specialties</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Deals</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lenders.map((lender) => (
                  <tr key={lender.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{lender.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lender.contactName || "—"}
                      {lender.contactEmail && <div className="text-xs text-gray-400">{lender.contactEmail}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {lender.minLoanAmount && lender.maxLoanAmount
                        ? `${formatCurrency(lender.minLoanAmount)} — ${formatCurrency(lender.maxLoanAmount)}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {lender.coverageStates.slice(0, 4).map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                        {lender.coverageStates.length > 4 && (
                          <span className="text-xs text-gray-400">+{lender.coverageStates.length - 4}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {lender.propertyTypes.slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs">
                            {t.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{lender.lenderType || "—"}</td>
                    <td className="px-6 py-4 text-sm">{lender._count.assignedDeals}</td>
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
