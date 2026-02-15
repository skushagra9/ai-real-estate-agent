"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addDealNote } from "@/lib/actions/deals";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AddNoteForm({ dealId }: { dealId: string }) {
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<"INTERNAL" | "PARTNER" | "BORROWER">("INTERNAL");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;

    setLoading(true);
    try {
      await addDealNote(dealId, note, visibility);
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Note</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write a note..."
            rows={3}
          />
          <div className="flex items-center gap-4">
            <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERNAL">Internal Only</SelectItem>
                <SelectItem value="PARTNER">Visible to Partner</SelectItem>
                <SelectItem value="BORROWER">Visible to Borrower</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={loading || !note.trim()}>
              {loading ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
