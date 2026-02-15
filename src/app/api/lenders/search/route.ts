import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const amount = searchParams.get("amount");
  const propertyType = searchParams.get("propertyType");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const amountNum = amount ? parseFloat(amount) : null;

  // Build where clause
  const where: Record<string, unknown> = { isActive: true };

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  // Total count (unfiltered by search for the "N lenders in database" label)
  const totalCount = await prisma.lender.count({ where: { isActive: true } });

  const lenders = await prisma.lender.findMany({
    where: where as never,
    take: Math.min(limit, 200),
    orderBy: { name: "asc" },
  });

  // Score and sort in application code
  const scored = lenders.map((lender) => {
    let matchScore = 0;

    // State match
    if (state) {
      if (lender.coverageStates.includes(state)) matchScore += 2;
      else if (lender.coverageStates.includes("NATIONWIDE")) matchScore += 1;
    }

    // Amount match
    if (amountNum) {
      const minOk = !lender.minLoanAmount || lender.minLoanAmount <= amountNum;
      const maxOk = !lender.maxLoanAmount || lender.maxLoanAmount >= amountNum;
      if (minOk && maxOk) matchScore += 2;
    }

    // Property type match
    if (propertyType && lender.propertyTypes.includes(propertyType)) {
      matchScore += 2;
    }

    return { ...lender, matchScore };
  });

  // Sort by match score descending, then name
  scored.sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name));

  return NextResponse.json({
    lenders: scored.slice(0, limit),
    totalCount,
  });
}
