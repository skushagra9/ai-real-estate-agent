"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { assignLender } from "@/lib/actions/deals";
import { formatCurrency } from "@/lib/constants";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LenderResult {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  minLoanAmount: number | null;
  maxLoanAmount: number | null;
  coverageStates: string[];
  propertyTypes: string[];
  lenderType: string | null;
  matchScore: number;
}

export function AssignLenderPanel({
  dealId,
  currentLenderId,
  dealState,
  dealAmount,
  dealPropertyType,
}: {
  dealId: string;
  currentLenderId: string | null;
  dealState: string;
  dealAmount: number;
  dealPropertyType: string;
}) {
  const [topLenders, setTopLenders] = useState<LenderResult[]>([]);
  const [allLenders, setAllLenders] = useState<LenderResult[]>([]);
  const [search, setSearch] = useState("");
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [assigning, setAssigning] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch top 3 matched lenders on mount
  useEffect(() => {
    async function fetchTop() {
      setLoadingTop(true);
      try {
        const params = new URLSearchParams({
          state: dealState,
          amount: dealAmount.toString(),
          propertyType: dealPropertyType,
          limit: "3",
        });
        const res = await fetch(`/api/lenders/search?${params}`);
        const data = await res.json();
        setTopLenders(data.lenders || []);
        setTotalCount(data.totalCount || 0);
      } catch {
        console.error("Failed to fetch top lenders");
      } finally {
        setLoadingTop(false);
      }
    }
    fetchTop();
  }, [dealState, dealAmount, dealPropertyType]);

  // Fetch all lenders (with optional search) for the expanded view
  const fetchAll = useCallback(
    async (query: string) => {
      setLoadingAll(true);
      try {
        const params = new URLSearchParams({
          state: dealState,
          amount: dealAmount.toString(),
          propertyType: dealPropertyType,
          limit: "100",
          ...(query ? { search: query } : {}),
        });
        const res = await fetch(`/api/lenders/search?${params}`);
        const data = await res.json();
        setAllLenders(data.lenders || []);
      } catch {
        console.error("Failed to fetch lenders");
      } finally {
        setLoadingAll(false);
      }
    },
    [dealState, dealAmount, dealPropertyType]
  );

  // Expand: load all on first open
  function handleShowAll() {
    setShowAll(true);
    fetchAll("");
  }

  // Live search as you type (debounced 300ms)
  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchAll(value);
    }, 300);
  }

  async function handleAssign(lenderId: string, lenderName: string) {
    setAssigning(lenderId);
    try {
      await assignLender(dealId, lenderId);
      toast.success(`${lenderName} assigned to this deal`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to assign lender");
      console.error(error);
    } finally {
      setAssigning("");
    }
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Assign Lender</h2>
        {totalCount > 0 && !showAll && (
          <span className="text-[11px] text-slate-400">{totalCount} lenders in database</span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* ─── Top 3 matched ─── */}
        {!showAll && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Best matches for this deal</span>
            </div>

            {loadingTop ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : topLenders.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No matching lenders found. Try importing lenders first.</p>
            ) : (
              <div className="space-y-2">
                {topLenders.map((lender, idx) => (
                  <LenderCard
                    key={lender.id}
                    lender={lender}
                    rank={idx + 1}
                    isAssigned={lender.id === currentLenderId}
                    assigning={assigning}
                    onAssign={handleAssign}
                  />
                ))}
              </div>
            )}

            {/* Expand */}
            {totalCount > 3 && (
              <button
                onClick={handleShowAll}
                className="w-full text-center py-2.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 rounded-lg transition-colors cursor-pointer"
              >
                View all {totalCount} lenders
              </button>
            )}
            {totalCount <= 3 && totalCount > 0 && (
              <button
                onClick={handleShowAll}
                className="w-full text-center py-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Search full database
              </button>
            )}
          </>
        )}

        {/* ─── Full database view ─── */}
        {showAll && (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowAll(false);
                  setSearch("");
                }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to top picks
              </button>
              <div className="flex-1 relative">
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by name..."
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-300 transition-all"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      fetchAll("");
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {loadingAll ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-sm text-slate-400">Searching...</span>
              </div>
            ) : allLenders.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                {search ? `No lenders matching "${search}"` : "No lenders in database"}
              </p>
            ) : (
              <>
                <p className="text-xs text-slate-400">{allLenders.length} result{allLenders.length !== 1 ? "s" : ""}</p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {allLenders.map((lender) => (
                    <LenderCard
                      key={lender.id}
                      lender={lender}
                      isAssigned={lender.id === currentLenderId}
                      assigning={assigning}
                      onAssign={handleAssign}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ─── Lender Card ─────────────────────────────────────────────────────
function LenderCard({
  lender,
  rank,
  isAssigned,
  assigning,
  onAssign,
}: {
  lender: LenderResult;
  rank?: number;
  isAssigned: boolean;
  assigning: string;
  onAssign: (id: string, name: string) => void;
}) {
  return (
    <div
      className={`relative p-3.5 rounded-lg border transition-all ${
        isAssigned
          ? "border-indigo-300 bg-indigo-50/50 ring-1 ring-indigo-200"
          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {rank && (
              <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                {rank}
              </span>
            )}
            <p className="font-medium text-sm text-slate-900 truncate">{lender.name}</p>
            {lender.lenderType && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">
                {lender.lenderType}
              </span>
            )}
          </div>
          {lender.contactName && (
            <p className="text-xs text-slate-500 mt-0.5 ml-7">{lender.contactName}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-7">
            {lender.coverageStates.slice(0, 6).map((s) => (
              <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                {s}
              </span>
            ))}
            {lender.coverageStates.length > 6 && (
              <span className="text-[10px] text-slate-400">+{lender.coverageStates.length - 6}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 ml-7">
            {lender.minLoanAmount != null && lender.maxLoanAmount != null
              ? `${formatCurrency(lender.minLoanAmount)} – ${formatCurrency(lender.maxLoanAmount)}`
              : "Loan range not specified"}
          </p>
        </div>

        <button
          onClick={() => onAssign(lender.id, lender.name)}
          disabled={!!assigning || isAssigned}
          className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
            isAssigned
              ? "bg-indigo-100 text-indigo-600 cursor-default"
              : assigning === lender.id
                ? "bg-slate-100 text-slate-400"
                : "bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
          }`}
        >
          {isAssigned ? "Assigned" : assigning === lender.id ? "..." : "Assign"}
        </button>
      </div>
    </div>
  );
}
