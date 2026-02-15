"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { addDealNote } from "@/lib/actions/deals";
export function PartnerNoteForm({ dealId }: { dealId: string }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;

    setLoading(true);
    try {
      // Partner notes are always PARTNER visibility
      await addDealNote(dealId, note, "PARTNER");
      toast.success("Note added");
      setNote("");
      router.refresh();
    } catch (error) {
      toast.error("Failed to add note");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
      <div className="px-5 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700">Add a Note</h2>
      </div>
      <div className="p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add context or a follow-up note for the broker..."
            rows={3}
            className="text-sm"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={loading || !note.trim()}>
              {loading ? "Sending..." : "Add Note"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
