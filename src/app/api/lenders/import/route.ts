import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";

function normalizeStates(raw: string): string[] {
  if (!raw) return [];

  const stateMap: Record<string, string> = {
    alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
    colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
    hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
    kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
    massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
    missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
    oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
    vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV",
    wisconsin: "WI", wyoming: "WY",
  };

  const lower = raw.toLowerCase().trim();
  if (lower === "nationwide" || lower === "all states" || lower === "all") {
    return ["NATIONWIDE"];
  }

  return raw
    .split(/[,;|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const upper = s.toUpperCase();
      if (upper.length === 2) return upper;
      return stateMap[s.toLowerCase()] || upper;
    });
}

function normalizePropertyTypes(raw: string): string[] {
  if (!raw) return [];

  const typeMap: Record<string, string> = {
    "multi family": "MULTIFAMILY", multifamily: "MULTIFAMILY", "multi-family": "MULTIFAMILY", mf: "MULTIFAMILY",
    retail: "RETAIL", office: "OFFICE", industrial: "INDUSTRIAL",
    "mixed use": "MIXED_USE", "mixed-use": "MIXED_USE",
    hospitality: "HOSPITALITY", hotel: "HOSPITALITY",
    land: "LAND", "self storage": "SELF_STORAGE", "self-storage": "SELF_STORAGE",
    healthcare: "HEALTHCARE", medical: "HEALTHCARE",
  };

  return raw
    .split(/[,;|]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((s) => typeMap[s] || s.toUpperCase().replace(/\s+/g, "_"))
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

function parseLoanAmount(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\s]/g, "").toLowerCase();
  const mmMatch = cleaned.match(/([\d.]+)\s*mm/);
  if (mmMatch) return parseFloat(mmMatch[1]) * 1_000_000;
  const mMatch = cleaned.match(/([\d.]+)\s*m$/);
  if (mMatch) return parseFloat(mMatch[1]) * 1_000_000;
  const kMatch = cleaned.match(/([\d.]+)\s*k/);
  if (kMatch) return parseFloat(kMatch[1]) * 1_000;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    let imported = 0;
    let errors = 0;

    for (const record of records as Record<string, string>[]) {
      try {
        const name = record.lender_name || record.name || record.Name || record["Lender Name"];
        if (!name) {
          errors++;
          continue;
        }

        await prisma.lender.create({
          data: {
            name,
            contactName: record.contact_name || record["Contact Name"] || null,
            contactEmail: record.contact_email || record["Contact Email"] || record.email || null,
            contactPhone: record.contact_phone || record["Contact Phone"] || record.phone || null,
            website: record.website || null,
            coverageStates: normalizeStates(
              record.geographic_coverage || record["Geographic Coverage"] || record.states || ""
            ),
            propertyTypes: normalizePropertyTypes(
              record.specialties || record["Specialties"] || record.property_types || ""
            ),
            transactionTypes: [],
            minLoanAmount: parseLoanAmount(
              record.min_loan_size || record["Min Loan Size"] || record.min_loan || ""
            ),
            maxLoanAmount: parseLoanAmount(
              record.max_loan_size || record["Max Loan Size"] || record.max_loan || ""
            ),
            lenderType: record.lender_type || record["Lender Type"] || record.type || null,
            rawImportData: record,
          },
        });
        imported++;
      } catch (e) {
        console.error("Failed to import row:", e);
        errors++;
      }
    }

    return NextResponse.json({ imported, errors, total: records.length });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Failed to parse CSV" }, { status: 500 });
  }
}
