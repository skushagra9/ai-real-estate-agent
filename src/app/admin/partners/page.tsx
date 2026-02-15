import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";

export default async function AdminPartners() {
  const partners = await prisma.partner.findMany({
    include: {
      _count: { select: { deals: true } },
      commissions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
        <p className="text-gray-500">{partners.length} referral partners</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Commission %</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Active Deals</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {partners.map((partner) => {
                  const totalEarned = partner.commissions
                    .filter((c) => c.status === "PAID")
                    .reduce((s, c) => s + (c.partnerAmount || 0), 0);

                  return (
                    <tr key={partner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{partner.companyName}</td>
                      <td className="px-6 py-4 text-sm">{partner.contactName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{partner.email}</td>
                      <td className="px-6 py-4 text-sm">{(partner.defaultCommissionPct * 100).toFixed(0)}%</td>
                      <td className="px-6 py-4 text-sm">{partner._count.deals}</td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(totalEarned)}</td>
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
