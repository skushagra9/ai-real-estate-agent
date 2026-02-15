import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARTNER") redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/partner/dashboard" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">LF</span>
                </div>
                <span className="text-base font-semibold text-slate-900 tracking-tight">LoanFlow</span>
              </Link>
              <div className="hidden sm:flex items-center gap-1">
                <NavLink href="/partner/dashboard" label="Deals" />
                <NavLink href="/partner/deals/new" label="Submit Deal" />
                <NavLink href="/partner/commissions" label="Commissions" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 text-[10px] font-bold">
                    {session.user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <span className="text-sm text-slate-600 hidden md:block">{session.user.name}</span>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
    >
      {label}
    </Link>
  );
}
