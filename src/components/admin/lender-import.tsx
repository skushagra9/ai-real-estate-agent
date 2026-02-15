"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function LenderImport() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/lenders/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Import failed");
        setLoading(false);
        return;
      }

      setResult(data);
      toast.success(`Imported ${data.imported} lenders`);
      router.refresh();
    } catch {
      toast.error("Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Import CSV</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Lenders from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-gray-500">
            Upload a CSV with columns: lender_name, contact_name, contact_email, contact_phone,
            specialties, geographic_coverage, min_loan_size, max_loan_size, lender_type
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {result && (
            <div className="bg-green-50 p-3 rounded text-sm">
              Imported: {result.imported} | Errors: {result.errors}
            </div>
          )}
          <Button onClick={handleUpload} disabled={loading} className="w-full">
            {loading ? "Importing..." : "Upload & Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
