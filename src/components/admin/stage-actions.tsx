"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateDealStage } from "@/lib/actions/deals";
import { getStageInfo } from "@/lib/constants";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const DESTRUCTIVE_STAGES = new Set(["DECLINED", "LOST"]);

export function StageActions({
  dealId,
  currentStage,
  transitions,
}: {
  dealId: string;
  currentStage: string;
  transitions: string[];
}) {
  const [reason, setReason] = useState("");
  const [closedAmount, setClosedAmount] = useState("");
  const [loading, setLoading] = useState("");
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);
  const router = useRouter();

  const forwardTransitions = transitions.filter((t) => !DESTRUCTIVE_STAGES.has(t));
  const destructiveTransitions = transitions.filter((t) => DESTRUCTIVE_STAGES.has(t));

  const needsReason = (stage: string) => DESTRUCTIVE_STAGES.has(stage);
  const needsAmount = (stage: string) => stage === "CLOSED";

  async function handleTransition(newStage: string) {
    setLoading(newStage);
    try {
      await updateDealStage(
        dealId,
        newStage,
        reason || undefined,
        closedAmount ? parseFloat(closedAmount) : undefined
      );
      toast.success(`Deal moved to ${getStageInfo(newStage).label}`);
      setDialogOpen(null);
      setReason("");
      setClosedAmount("");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update stage"
      );
    } finally {
      setLoading("");
    }
  }

  const currentStageInfo = getStageInfo(currentStage);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            Update Deal Status
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Currently{" "}
            <span
              className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${currentStageInfo.color}`}
            >
              {currentStageInfo.label}
            </span>
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Forward / advance actions */}
        {forwardTransitions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Advance
            </p>
            <div className="flex flex-wrap gap-2">
              {forwardTransitions.map((nextStage) => {
                const stageInfo = getStageInfo(nextStage);

                if (needsAmount(nextStage)) {
                  return (
                    <Dialog
                      key={nextStage}
                      open={dialogOpen === nextStage}
                      onOpenChange={(open) =>
                        setDialogOpen(open ? nextStage : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <svg
                            className="w-3.5 h-3.5 mr-1.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                          Move to {stageInfo.label}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Close Deal
                          </DialogTitle>
                          <DialogDescription>
                            Mark this deal as closed. Enter the final loan amount below.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                              Closed Loan Amount{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              value={closedAmount}
                              onChange={(e) => setClosedAmount(e.target.value)}
                              placeholder="e.g. 1,500,000"
                              min={0}
                            />
                          </div>
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setDialogOpen(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleTransition(nextStage)}
                            disabled={
                              loading === nextStage || !closedAmount
                            }
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            {loading === nextStage
                              ? "Closing..."
                              : "Confirm Close"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  );
                }

                return (
                  <Button
                    key={nextStage}
                    variant="default"
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => handleTransition(nextStage)}
                    disabled={!!loading}
                  >
                    <svg
                      className="w-3.5 h-3.5 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    {loading === nextStage
                      ? "Moving..."
                      : `Move to ${stageInfo.label}`}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Divider between forward and destructive */}
        {forwardTransitions.length > 0 && destructiveTransitions.length > 0 && (
          <div className="border-t border-dashed border-slate-200" />
        )}

        {/* Destructive / reject actions */}
        {destructiveTransitions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-red-400 uppercase tracking-wider">
              Reject
            </p>
            <div className="flex flex-wrap gap-2">
              {destructiveTransitions.map((nextStage) => {
                const stageInfo = getStageInfo(nextStage);
                const isDecline = nextStage === "DECLINED";
                const label = isDecline ? "Decline Deal" : "Mark as Lost";

                return (
                  <Dialog
                    key={nextStage}
                    open={dialogOpen === nextStage}
                    onOpenChange={(open) => {
                      setDialogOpen(open ? nextStage : null);
                      if (!open) setReason("");
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                      >
                        <svg
                          className="w-3.5 h-3.5 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        {label}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-red-600">
                          {label}
                        </DialogTitle>
                        <DialogDescription>
                          {isDecline
                            ? "This deal will be marked as declined and the referring partner will be notified. This action cannot be undone."
                            : "This deal will be marked as lost. The referring partner will be notified. This action cannot be undone."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Reason{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={
                              isDecline
                                ? "e.g. Does not meet lending criteria for loan-to-value ratio"
                                : "e.g. Borrower chose another lender"
                            }
                            rows={3}
                            className="resize-none"
                          />
                          <p className="text-[11px] text-slate-400">
                            This reason will be shared with the partner.
                          </p>
                        </div>
                      </div>
                      <DialogFooter className="gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDialogOpen(null);
                            setReason("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleTransition(nextStage)}
                          disabled={loading === nextStage || !reason.trim()}
                        >
                          {loading === nextStage
                            ? "Processing..."
                            : `Confirm ${isDecline ? "Decline" : "Lost"}`}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
