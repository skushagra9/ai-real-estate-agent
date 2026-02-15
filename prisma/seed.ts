import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Wipe existing data
  await prisma.dealEvent.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.dealLender.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.borrower.deleteMany();
  await prisma.lender.deleteMany();
  await prisma.user.deleteMany();
  await prisma.partner.deleteMany();

  const hash = await bcrypt.hash("password123", 10);

  // ─── Admin ────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: "admin@loanflow.com",
      passwordHash: hash,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  });

  // ─── Partners + Users (5 demo partners) ─────────────────
  const partnersData = [
    {
      companyName: "Keller Williams",
      contactName: "Jane Smith",
      email: "jane@kw.com",
      phone: "(555) 100-2000",
      defaultCommissionPct: 0.25,
      user: { firstName: "Jane", lastName: "Smith", email: "jane@kw.com" },
    },
    {
      companyName: "RE/MAX Premier",
      contactName: "Tom Wilson",
      email: "tom@remax.com",
      phone: "(555) 101-2001",
      defaultCommissionPct: 0.25,
      user: { firstName: "Tom", lastName: "Wilson", email: "tom@remax.com" },
    },
    {
      companyName: "Coldwell Banker",
      contactName: "Sara Chen",
      email: "sara@cb.com",
      phone: "(555) 102-2002",
      defaultCommissionPct: 0.2,
      user: { firstName: "Sara", lastName: "Chen", email: "sara@cb.com" },
    },
    {
      companyName: "eXp Realty",
      contactName: "Mike Davis",
      email: "mike@exp.com",
      phone: "(555) 103-2003",
      defaultCommissionPct: 0.25,
      user: { firstName: "Mike", lastName: "Davis", email: "mike@exp.com" },
    },
    {
      companyName: "Century 21",
      contactName: "Lisa Park",
      email: "lisa@century21.com",
      phone: "(555) 104-2004",
      defaultCommissionPct: 0.22,
      user: { firstName: "Lisa", lastName: "Park", email: "lisa@century21.com" },
    },
  ];

  for (const p of partnersData) {
    const partner = await prisma.partner.create({
      data: {
        companyName: p.companyName,
        contactName: p.contactName,
        email: p.email,
        phone: p.phone,
        defaultCommissionPct: p.defaultCommissionPct,
      },
    });
    await prisma.user.create({
      data: {
        email: p.user.email,
        passwordHash: hash,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        role: "PARTNER",
        partnerId: partner.id,
      },
    });
  }

  // ─── Lenders ──────────────────────────────────────────
  const lenders = await Promise.all([
    prisma.lender.create({
      data: {
        name: "First National Bank",
        contactName: "Sarah Johnson",
        contactEmail: "sarah@firstnational.com",
        contactPhone: "(555) 200-3000",
        minLoanAmount: 500000,
        maxLoanAmount: 25000000,
        coverageStates: ["TX", "CA", "NY", "FL", "IL"],
        propertyTypes: ["MULTIFAMILY", "RETAIL", "OFFICE"],
        transactionTypes: ["ACQUISITION", "REFINANCE"],
        lenderType: "Bank",
      },
    }),
    prisma.lender.create({
      data: {
        name: "Pacific Capital Group",
        contactName: "Michael Chen",
        contactEmail: "mchen@pacificcapital.com",
        contactPhone: "(555) 300-4000",
        minLoanAmount: 1000000,
        maxLoanAmount: 50000000,
        coverageStates: ["CA", "WA", "OR", "AZ", "NV"],
        propertyTypes: ["MULTIFAMILY", "MIXED_USE", "HOSPITALITY"],
        transactionTypes: ["ACQUISITION", "REFINANCE"],
        lenderType: "Private Lender",
      },
    }),
    prisma.lender.create({
      data: {
        name: "Cornerstone Funding",
        contactName: "Lisa Martinez",
        contactEmail: "lisa@cornerstonefunding.com",
        contactPhone: "(555) 400-5000",
        minLoanAmount: 250000,
        maxLoanAmount: 10000000,
        coverageStates: ["TX", "FL", "GA", "NC", "SC"],
        propertyTypes: ["LAND", "CONSTRUCTION", "SELF_STORAGE"],
        transactionTypes: ["ACQUISITION"],
        lenderType: "CDFI",
      },
    }),
  ]);

  // No demo deals, borrowers, or commissions — admin dashboard starts empty

  console.log("Seed complete!");
  console.log("─────────────────────────────────────");
  console.log("Admin:   admin@loanflow.com / password123");
  console.log("Partners: jane@kw.com, tom@remax.com, sara@cb.com, mike@exp.com, lisa@century21.com / password123");
  console.log("─────────────────────────────────────");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
