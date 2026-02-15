"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { markCommissionPaid } from "@/lib/actions/deals";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function MarkPaidButton({ commissionId }: { commissionId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      await markCommissionPaid(commissionId);
      toast.success("Commission marked as paid");
      router.refresh();
    } catch {
      toast.error("Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? "..." : "Mark Paid"}
    </Button>
  );
}
