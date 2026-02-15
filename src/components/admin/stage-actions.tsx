"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateDealStage } from "@/lib/actions/deals";
import { getStageInfo } from "@/lib/constants";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
      toast.error(error instanceof Error ? error.message : "Failed to update stage");
    } finally {
      setLoading("");
    }
  }

  const needsReason = (stage: string) => stage === "DECLINED" || stage === "LOST";
  const needsAmount = (stage: string) => stage === "CLOSED";

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-white rounded-lg border">
      <span className="text-sm text-gray-500 mr-2 self-center">Move to:</span>
      {transitions.map((nextStage) => {
        const stageInfo = getStageInfo(nextStage);

        if (needsReason(nextStage) || needsAmount(nextStage)) {
          return (
            <Dialog key={nextStage} open={dialogOpen === nextStage} onOpenChange={(open) => setDialogOpen(open ? nextStage : null)}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={stageInfo.color}>
                  {stageInfo.label}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Move to {stageInfo.label}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {needsReason(nextStage) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reason *</label>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={`Why is this deal being ${nextStage.toLowerCase()}?`}
                        rows={3}
                      />
                    </div>
                  )}
                  {needsAmount(nextStage) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Closed Loan Amount *</label>
                      <Input
                        type="number"
                        value={closedAmount}
                        onChange={(e) => setClosedAmount(e.target.value)}
                        placeholder="1500000"
                        min={0}
                      />
                    </div>
                  )}
                  <Button
                    onClick={() => handleTransition(nextStage)}
                    disabled={
                      loading === nextStage ||
                      (needsReason(nextStage) && !reason) ||
                      (needsAmount(nextStage) && !closedAmount)
                    }
                    className="w-full"
                  >
                    {loading === nextStage ? "Updating..." : `Confirm: ${stageInfo.label}`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          );
        }

        return (
          <Button
            key={nextStage}
            variant="outline"
            size="sm"
            className={stageInfo.color}
            onClick={() => handleTransition(nextStage)}
            disabled={!!loading}
          >
            {loading === nextStage ? "..." : stageInfo.label}
          </Button>
        );
      })}
    </div>
  );
}
