import Link from "next/link";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />
      {/* Gradient orbs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white font-bold text-sm">LF</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">LoanFlow</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg px-4 py-2.5 transition-colors shadow-lg shadow-indigo-500/20"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="max-w-3xl">
            <p className="text-indigo-400 font-medium text-sm uppercase tracking-widest mb-4">
              Commercial loan referral platform
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6">
              Close more commercial loans,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                together
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-10 max-w-xl">
              Referral partners submit deals and track commissions. Brokers run the pipeline and assign lenders.
              Borrowers get a simple link to follow their application—no login required.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3.5 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/30"
              >
                Get started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-300 font-medium px-6 py-3.5 transition-all"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>

        {/* Three audiences */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-8">Who it&apos;s for</p>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Referral partners */}
            <div className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 lg:p-8 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-5 text-indigo-400 group-hover:bg-indigo-500/30 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Referral partners</h2>
              <p className="text-slate-400 text-sm mb-5">
                Send deals to your broker and get paid when they close.
              </p>
              <ul className="space-y-2.5 text-slate-400 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Submit deals with a simple multi-step form
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Share a tracking link with your client (or email it)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  See pipeline status and timeline for every deal
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Track earned, pending, and projected commissions
                </li>
              </ul>
            </div>

            {/* Brokers */}
            <div className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 lg:p-8 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-5 text-violet-400 group-hover:bg-violet-500/30 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Brokers (admin)</h2>
              <p className="text-slate-400 text-sm mb-5">
                Run your pipeline, assign lenders, and keep partners in the loop.
              </p>
              <ul className="space-y-2.5 text-slate-400 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  Move deals through stages (Under Review → Closing → Closed)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  Assign lenders from your database with smart matching
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  Add internal, partner-, or borrower-visible notes
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  Confirm commissions at close and mark payouts when paid
                </li>
              </ul>
            </div>

            {/* Borrowers */}
            <div className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 lg:p-8 hover:border-amber-500/30 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-5 text-amber-400 group-hover:bg-amber-500/30 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Borrowers (clients)</h2>
              <p className="text-slate-400 text-sm mb-5">
                One link to see where your loan application stands.
              </p>
              <ul className="space-y-2.5 text-slate-400 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  No account or password—just open the link
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Clear progress from Submitted to Closed
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  See your agent&apos;s contact info to reach out anytime
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-6 pb-28">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-8">How it works</p>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="inline-flex w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-lg items-center justify-center mb-4">1</div>
              <h3 className="text-white font-semibold mb-2">Partner submits a deal</h3>
              <p className="text-slate-400 text-sm">
                Loan type, property, amount, and client details. Optional: send the borrower a tracking link by email.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 font-bold text-lg items-center justify-center mb-4">2</div>
              <h3 className="text-white font-semibold mb-2">Broker works the pipeline</h3>
              <p className="text-slate-400 text-sm">
                Move stages, assign lenders, add notes. Partner gets email updates. At close, commission is confirmed.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 font-bold text-lg items-center justify-center mb-4">3</div>
              <h3 className="text-white font-semibold mb-2">Borrower tracks progress</h3>
              <p className="text-slate-400 text-sm">
                One link shows status and contact. When you mark commission paid, the partner sees it in their dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-10 md:p-14 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ready to streamline your referral process?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Join as a referral partner to submit deals and track commissions, or log in as a broker to manage your pipeline.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-white text-indigo-700 font-semibold px-6 py-3.5 hover:bg-slate-100 transition-colors"
              >
                Sign up as partner
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 text-white font-medium px-6 py-3.5 hover:bg-white/10 transition-colors"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">LF</span>
            </div>
            <span className="text-sm text-slate-500">LoanFlow</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/login" className="hover:text-white transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
