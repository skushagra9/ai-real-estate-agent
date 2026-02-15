export const LOAN_TYPES = [
  { value: "PERMANENT_MORTGAGE", label: "Permanent Mortgage" },
  { value: "BRIDGE", label: "Bridge" },
  { value: "LAND", label: "Land" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "SBA", label: "SBA" },
  { value: "OTHER", label: "Other" },
] as const;

export const TRANSACTION_TYPES = [
  { value: "ACQUISITION", label: "Acquisition" },
  { value: "REFINANCE", label: "Refinance" },
] as const;

export const LOAN_POSITIONS = [
  { value: "FIRST_MORTGAGE", label: "First Mortgage" },
  { value: "SUBORDINATE", label: "Subordinate" },
] as const;

export const PROPERTY_TYPES = [
  { value: "MULTIFAMILY", label: "Multifamily" },
  { value: "RETAIL", label: "Retail" },
  { value: "OFFICE", label: "Office" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "MIXED_USE", label: "Mixed-Use" },
  { value: "HOSPITALITY", label: "Hospitality" },
  { value: "LAND", label: "Land" },
  { value: "SELF_STORAGE", label: "Self-Storage" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "SHORT_TERM_RENTALS", label: "Short Term Rentals" },
  { value: "OTHER", label: "Other" },
] as const;

export const OCCUPANCY_TYPES = [
  { value: "OWNER_OCCUPIED", label: "Owner Occupied" },
  { value: "INVESTMENT", label: "Investment" },
] as const;

export const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
] as const;

export const DEAL_STAGES = [
  { value: "SUBMITTED", label: "Submitted", color: "bg-blue-100 text-blue-800" },
  { value: "UNDER_REVIEW", label: "Under Review", color: "bg-yellow-100 text-yellow-800" },
  { value: "PROCESSING", label: "Processing", color: "bg-amber-100 text-amber-800" },
  { value: "QUOTING", label: "Quoting", color: "bg-orange-100 text-orange-800" },
  { value: "QUOTED", label: "Quoted", color: "bg-purple-100 text-purple-800" },
  { value: "ACCEPTED", label: "Accepted", color: "bg-green-100 text-green-800" },
  { value: "UNDERWRITING", label: "Underwriting", color: "bg-indigo-100 text-indigo-800" },
  { value: "APPROVED", label: "Approved", color: "bg-teal-100 text-teal-800" },
  { value: "CLOSING", label: "Closing", color: "bg-cyan-100 text-cyan-800" },
  { value: "CLOSED", label: "Closed", color: "bg-emerald-100 text-emerald-800" },
  { value: "DECLINED", label: "Declined", color: "bg-red-100 text-red-800" },
  { value: "LOST", label: "Lost", color: "bg-gray-100 text-gray-800" },
] as const;

// Stages visible on the borrower progress stepper (excludes DECLINED/LOST)
export const BORROWER_PROGRESS_STAGES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "PROCESSING",
  "QUOTING",
  "QUOTED",
  "ACCEPTED",
  "UNDERWRITING",
  "APPROVED",
  "CLOSING",
  "CLOSED",
] as const;

export const STAGE_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "DECLINED"],
  UNDER_REVIEW: ["PROCESSING", "DECLINED"],
  PROCESSING: ["QUOTING", "LOST"],
  QUOTING: ["QUOTED", "LOST"],
  QUOTED: ["ACCEPTED", "LOST"],
  ACCEPTED: ["UNDERWRITING", "LOST"],
  UNDERWRITING: ["APPROVED", "LOST"],
  APPROVED: ["CLOSING", "LOST"],
  CLOSING: ["CLOSED", "LOST"],
  CLOSED: [],
  DECLINED: [],
  LOST: [],
};

// Broker gross commission rate (e.g. 2% of closed/requested amount). Used for both
// at-close calculation and projected (estimated) partner commission.
export const BROKER_GROSS_COMMISSION_RATE = 0.02;

/** Estimated partner commission: loanAmount × broker rate × partner share. Same formula as at close. */
export function estimatedPartnerCommission(
  loanAmount: number,
  partnerPct: number
): number {
  return loanAmount * BROKER_GROSS_COMMISSION_RATE * partnerPct;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getStageInfo(stage: string) {
  return DEAL_STAGES.find((s) => s.value === stage) ?? DEAL_STAGES[0];
}

export function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(1 + Math.random() * 99999);
  return `DL-${year}-${String(seq).padStart(5, "0")}`;
}
