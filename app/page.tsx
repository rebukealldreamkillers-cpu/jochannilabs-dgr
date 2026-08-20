import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";

const VERDICTS = [
  {
    label: "KEEP",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    description: "Documented evidence supports the current cost. Continue investing.",
  },
  {
    label: "DOWNSIZE",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    description: "The requirement is real — the mechanism is overbuilt. Lower-cost path identified.",
  },
  {
    label: "REPLACE",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
    description: "Insufficient evidence for the current cost. A viable alternative exists.",
  },
  {
    label: "KILL",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    description: "No evidence of value. No viable alternative. Reallocate the budget.",
  },
];

const QUESTIONS = [
  { num: "Q1", text: "Named executive sponsor and authorized business requirement" },
  { num: "Q2", text: "Evidence that the workflow satisfies the requirement" },
  { num: "Q3", text: "Current mechanism cost baseline — per call and at volume" },
  { num: "Q4", text: "A specific, logically viable lower-cost alternative" },
  { num: "Q5", text: "Operational and regulatory risk register with named owners" },
  { num: "Q6", text: "Verdict: KEEP, DOWNSIZE, REPLACE, or KILL" },
];

const STAGES = [
  { week: "Week 1", title: "Pipeline Census", description: "Document every AI workflow in scope, its business purpose, and its current monthly cost." },
  { week: "Week 2", title: "Investigation", description: "Answer six governing questions for each workflow. Evidence determines the verdict — not assumption." },
  { week: "Week 3", title: "Decision Registry", description: "Lock each verdict with a reason, an evidence summary, and a condition for change." },
  { week: "Week 4", title: "Defense Files", description: "Deliver a signed Defense File per workflow. The sponsor either accepts the verdict or records a stated departure." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Jochanni Labs</p>
          <p className="text-sm font-semibold leading-tight">Decision Governance Review</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
            Sign in
          </Link>
          <Link
            href="/inquiry"
            className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Start an inquiry →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-4">
          Fixed-scope · Four weeks · Verdict-first
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
          Does this AI workflow still deserve its budget?
        </h1>
        <p className="mt-6 text-lg text-zinc-500 leading-relaxed max-w-2xl mx-auto">
          The Decision Governance Review is a structured, four-week diagnostic that produces a
          verdict on every AI workflow in scope — KEEP, DOWNSIZE, REPLACE, or KILL — backed
          by documented evidence and signed by the named executive sponsor.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/inquiry"
            className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Start an inquiry
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 border border-zinc-200 px-6 py-3 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            How it works
          </a>
        </div>
      </section>

      {/* Problem statement */}
      <section className="bg-zinc-50 border-y">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-6">
            The problem
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <p className="font-semibold">AI spend is growing — governance is not.</p>
              <p className="text-zinc-500 leading-relaxed">
                Most organizations add AI workflows faster than they can assess them. Budget
                accumulates. Accountability does not.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Internal review is not independent.</p>
              <p className="text-zinc-500 leading-relaxed">
                Teams that built the workflow are rarely positioned to evaluate whether it
                still earns its cost. Sunken cost reasoning dominates.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Verdicts require evidence, not opinion.</p>
              <p className="text-zinc-500 leading-relaxed">
                A defensible verdict names the evidence, the risk, and the condition under
                which it should be revisited. Most current reviews do none of this.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-2">
          How it works
        </p>
        <h2 className="text-2xl font-semibold mb-10">Four weeks. One verdict per workflow.</h2>
        <div className="space-y-6">
          {STAGES.map((s, i) => (
            <div key={i} className="flex gap-5">
              <div className="flex-shrink-0 w-16 pt-0.5">
                <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">{s.week}</p>
                <p className="text-xs font-semibold mt-0.5">{s.title}</p>
              </div>
              <div className="flex-1 border-l pl-5 pb-6">
                <p className="text-sm text-zinc-600 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Six questions */}
      <section className="bg-zinc-50 border-y">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-2">
            The investigation
          </p>
          <h2 className="text-2xl font-semibold mb-8">Six governing questions — no shortcuts.</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {QUESTIONS.map((q) => (
              <div key={q.num} className="flex gap-3 items-start border rounded-lg bg-white px-4 py-3">
                <span className="text-xs font-mono text-zinc-400 mt-0.5 flex-shrink-0">{q.num}</span>
                <p className="text-sm text-zinc-700">{q.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-zinc-500 leading-relaxed">
            The verdict follows the first five answers. It is not asserted independently of
            them. Every verdict carries an exact reason, the evidence behind it, and the
            condition that would change it.
          </p>
        </div>
      </section>

      {/* Four verdicts */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-2">
          The outcomes
        </p>
        <h2 className="text-2xl font-semibold mb-8">Four possible verdicts.</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {VERDICTS.map((v) => (
            <div key={v.label} className={`border rounded-lg px-5 py-4 ${v.bg}`}>
              <p className={`text-sm font-bold tracking-wider ${v.color}`}>{v.label}</p>
              <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you receive */}
      <section className="bg-zinc-50 border-y">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-2">
            Deliverables
          </p>
          <h2 className="text-2xl font-semibold mb-8">What you receive.</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              "Pipeline Census — every AI workflow documented with cost and evidence status",
              "Investigation records — six-question answers per workflow, on record",
              "Decision Registry — locked verdict per workflow with reason and condition for change",
              "Defense Files — one signed document per workflow, executed by the named executive sponsor",
              "Governance Manifest — machine-readable JSON export for your governance system",
              "60-day checkpoint — follow-up on whether recommended actions were carried out",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-zinc-600 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold">Ready to audit your AI spend?</h2>
        <p className="mt-3 text-zinc-500 text-sm leading-relaxed">
          Fixed price. Four weeks. Conducted under mutual NDA. Response within one business day.
        </p>
        <Link
          href="/inquiry"
          className="inline-flex items-center gap-2 mt-6 bg-zinc-900 text-white px-7 py-3 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          Start an inquiry
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-4 text-xs text-zinc-400">
          <div>
            <p className="font-medium text-zinc-600">Jochanni Labs</p>
            <p className="mt-0.5">Decision Governance Practice</p>
          </div>
          <div className="flex gap-6">
            <Link href="/inquiry" className="hover:text-zinc-600 transition-colors">Start a review</Link>
            <Link href="/sign-in" className="hover:text-zinc-600 transition-colors">Analyst sign in</Link>
            <Link href="/portal" className="hover:text-zinc-600 transition-colors">Client portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
