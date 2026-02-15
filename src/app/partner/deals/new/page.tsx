"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LOAN_TYPES,
  TRANSACTION_TYPES,
  LOAN_POSITIONS,
  PROPERTY_TYPES,
  OCCUPANCY_TYPES,
  formatCurrency,
} from "@/lib/constants";
import { toast } from "sonner";
import { createDeal } from "@/lib/actions/deals";
import { sendTrackingEmail } from "@/lib/actions/deals";
// ─── Option Card (click-to-select) ──────────────────────────────────
function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
        selected
          ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Toggle Switch ──────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
        checked ? "bg-indigo-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Types ──────────────────────────────────────────────────────────
interface DealResult {
  dealId: string;
  referenceNumber: string;
  borrowerAccessToken: string;
  enableClientTracking: boolean;
}

// ─── Main Component ─────────────────────────────────────────────────
export default function NewDealPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DealResult | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalSteps = 5;

  // Form state
  const [form, setForm] = useState({
    // Step 1
    loanType: "",
    transactionType: "",
    loanPosition: "",
    propertyType: "",
    // Step 2
    occupancy: "",
    propertyAddress: "",
    // Step 3
    purchasePrice: "",
    noi: "",
    noiNotAvailable: false,
    signedPurchaseAgreement: false,
    inPlaceOccupancy: "",
    // Step 4
    loanAmountRequested: "",
    targetLtv: "",
    estimatedCloseDate: "",
    recourseAcceptance: true,
    partnerCompensation: "",
    // Step 5
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    enableClientTracking: true,
  });

  function updateField(field: string, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Computed LTV
  const computedLtv =
    form.purchasePrice && form.loanAmountRequested
      ? ((parseFloat(form.loanAmountRequested) / parseFloat(form.purchasePrice)) * 100).toFixed(2)
      : "0.00";

  // Step validations
  function canProceed(s: number): boolean {
    switch (s) {
      case 1:
        return !!(form.loanType && form.transactionType && form.loanPosition && form.propertyType);
      case 2:
        return !!(form.occupancy);
      case 3:
        return true; // All optional
      case 4:
        return !!form.loanAmountRequested;
      case 5:
        return !!form.clientName;
      default:
        return true;
    }
  }

  function goNext() {
    if (step < totalSteps && canProceed(step)) setStep(step + 1);
  }

  function goBack() {
    if (step > 1) setStep(step - 1);
  }

  async function handleSubmit() {
    if (!canProceed(5)) return;
    setLoading(true);
    try {
      const res = await createDeal({
        loanType: form.loanType,
        transactionType: form.transactionType,
        loanPosition: form.loanPosition,
        propertyType: form.propertyType,
        occupancy: form.occupancy,
        propertyAddress: form.propertyAddress,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
        noi: form.noi ? parseFloat(form.noi) : null,
        noiNotAvailable: form.noiNotAvailable,
        signedPurchaseAgreement: form.signedPurchaseAgreement,
        inPlaceOccupancy: form.inPlaceOccupancy ? parseFloat(form.inPlaceOccupancy) : null,
        loanAmountRequested: parseFloat(form.loanAmountRequested),
        targetLtv: computedLtv ? parseFloat(computedLtv) : null,
        estimatedCloseDate: form.estimatedCloseDate || null,
        recourseAcceptance: form.recourseAcceptance,
        partnerCompensation: form.partnerCompensation ? parseFloat(form.partnerCompensation) : null,
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientPhone: form.clientPhone,
        enableClientTracking: form.enableClientTracking,
      });
      setResult(res);
      setStep(totalSteps + 1); // Move to success screen
      toast.success("Deal submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit deal. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function getTrackingUrl() {
    if (!result) return "";
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/status/${result.borrowerAccessToken}`;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(getTrackingUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendEmail() {
    if (!result || !form.clientEmail) {
      toast.error("No client email provided");
      return;
    }
    setEmailSending(true);
    try {
      const res = await sendTrackingEmail(result.dealId, form.clientEmail, form.clientName);
      if (res.success) {
        setEmailSent(true);
        toast.success("Tracking link sent via email!");
      } else {
        toast.error(res.error || "Failed to send email. You can still copy the link.");
      }
    } catch {
      toast.error("Failed to send email. You can still copy the link.");
    } finally {
      setEmailSending(false);
    }
  }

  const progress = step <= totalSteps ? (step / totalSteps) * 100 : 100;

  // ─── SUCCESS SCREEN ───────────────────────────────────────────────
  if (step > totalSteps && result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-6">
            <div className="text-6xl mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Deal Submitted!</h2>
            <p className="text-slate-500 mt-2 text-sm">
              Your deal is now in the pipeline. You&apos;ll receive updates as it progresses.
            </p>
          </div>

          {result.enableClientTracking && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Share tracking link with your client:
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border rounded-lg px-3 py-2 text-sm text-slate-700 truncate font-mono">
                  {getTrackingUrl()}
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg border hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Copy link"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              {form.clientEmail && (
                <button
                  onClick={handleSendEmail}
                  disabled={emailSending || emailSent}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {emailSent ? "Email Sent!" : emailSending ? "Sending..." : "Send via Email"}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => router.push("/partner/dashboard")}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Pipeline
            </button>
            <button
              onClick={() => {
                setResult(null);
                setStep(1);
                setForm({
                  loanType: "", transactionType: "", loanPosition: "", propertyType: "",
                  occupancy: "", propertyAddress: "",
                  purchasePrice: "", noi: "", noiNotAvailable: false, signedPurchaseAgreement: false, inPlaceOccupancy: "",
                  loanAmountRequested: "", targetLtv: "", estimatedCloseDate: "", recourseAcceptance: true, partnerCompensation: "",
                  clientName: "", clientEmail: "", clientPhone: "", enableClientTracking: true,
                });
              }}
              className="flex items-center justify-center gap-2 border px-6 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Deal
            </button>
            <button
              onClick={() => router.push("/partner/dashboard")}
              className="text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── WIZARD ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Submit New Deal</h2>
          <button
            onClick={() => router.push("/partner/dashboard")}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* ─── STEP 1: Loan Info ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Loan Type</label>
                <div className="flex flex-wrap gap-2">
                  {LOAN_TYPES.map((t) => (
                    <OptionCard
                      key={t.value}
                      label={t.label}
                      selected={form.loanType === t.value}
                      onClick={() => updateField("loanType", t.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Transaction Type</label>
                <div className="flex flex-wrap gap-2">
                  {TRANSACTION_TYPES.map((t) => (
                    <OptionCard
                      key={t.value}
                      label={t.label}
                      selected={form.transactionType === t.value}
                      onClick={() => updateField("transactionType", t.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Loan Position</label>
                <div className="flex flex-wrap gap-2">
                  {LOAN_POSITIONS.map((t) => (
                    <OptionCard
                      key={t.value}
                      label={t.label}
                      selected={form.loanPosition === t.value}
                      onClick={() => updateField("loanPosition", t.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Property Scope</label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((t) => (
                    <OptionCard
                      key={t.value}
                      label={t.label}
                      selected={form.propertyType === t.value}
                      onClick={() => updateField("propertyType", t.value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Property Details ─── */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-slate-700">Property Details</h3>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Occupancy</label>
                <div className="flex flex-wrap gap-2">
                  {OCCUPANCY_TYPES.map((t) => (
                    <OptionCard
                      key={t.value}
                      label={t.label}
                      selected={form.occupancy === t.value}
                      onClick={() => updateField("occupancy", t.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Property Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={form.propertyAddress}
                    onChange={(e) => updateField("propertyAddress", e.target.value)}
                    placeholder="123 Main St, City, State"
                    className="w-full pl-10 pr-10 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {form.propertyAddress && (
                    <button
                      type="button"
                      onClick={() => updateField("propertyAddress", "")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Financial Details ─── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Purchase Price / Estimated Property Value
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                  <input
                    type="number"
                    value={form.purchasePrice}
                    onChange={(e) => updateField("purchasePrice", e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="noiNotAvailable"
                  checked={form.noiNotAvailable}
                  onChange={(e) => updateField("noiNotAvailable", e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="noiNotAvailable" className="text-sm text-slate-600">
                  NOI Not Available
                </label>
              </div>

              {!form.noiNotAvailable && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">
                    Net Operating Income (NOI)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                    <input
                      type="number"
                      value={form.noi}
                      onChange={(e) => updateField("noi", e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      min={0}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="signedPA"
                  checked={form.signedPurchaseAgreement}
                  onChange={(e) => updateField("signedPurchaseAgreement", e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="signedPA" className="text-sm text-slate-600">
                  Signed Purchase Agreement
                </label>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  In Place Occupancy
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.inPlaceOccupancy}
                    onChange={(e) => updateField("inPlaceOccupancy", e.target.value)}
                    placeholder="0"
                    className="w-full pl-4 pr-8 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    min={0}
                    max={100}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">%</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Enter percentage (0-100)</p>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Loan Details ─── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Loan Amount Requested *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                  <input
                    type="number"
                    value={form.loanAmountRequested}
                    onChange={(e) => updateField("loanAmountRequested", e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    min={0}
                  />
                </div>
                {form.loanAmountRequested && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(parseFloat(form.loanAmountRequested))}
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-700">Target LTV</label>
                  <span className="text-sm font-medium text-gray-900">{computedLtv}%</span>
                </div>
                <p className="text-xs text-slate-400">Auto-calculated from purchase price and loan amount</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Estimated Close Date
                </label>
                <input
                  type="date"
                  value={form.estimatedCloseDate}
                  onChange={(e) => updateField("estimatedCloseDate", e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Recourse Acceptance</label>
                <div className="flex flex-wrap gap-2">
                  <OptionCard
                    label="Yes"
                    selected={form.recourseAcceptance === true}
                    onClick={() => updateField("recourseAcceptance", true)}
                  />
                  <OptionCard
                    label="No"
                    selected={form.recourseAcceptance === false}
                    onClick={() => updateField("recourseAcceptance", false)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Partner Compensation
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.partnerCompensation}
                    onChange={(e) => updateField("partnerCompensation", e.target.value)}
                    placeholder="0"
                    className="w-full pl-4 pr-8 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">%</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 5: Client Details ─── */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Client Name *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) => updateField("clientName", e.target.value)}
                    placeholder="John Smith"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Client Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => updateField("clientEmail", e.target.value)}
                    placeholder="client@example.com"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Client Phone</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </span>
                  <input
                    type="tel"
                    value={form.clientPhone}
                    onChange={(e) => updateField("clientPhone", e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Enable Client Tracking Link</p>
                    <p className="text-xs text-slate-400">Generate a shareable link so your client can track loan progress</p>
                  </div>
                </div>
                <Toggle
                  checked={form.enableClientTracking}
                  onChange={(val) => updateField("enableClientTracking", val)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              onClick={goNext}
              disabled={!canProceed(step)}
              className="flex items-center gap-1 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed(step)}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? "Submitting..." : "Submit Deal"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
