import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield } from "lucide-react";

const POSTURES = [
  {
    label: "KEEP",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    description: "Documented evidence supports the current cost. DAL-X authorizes execution and monitors cost bounds.",
  },
  {
    label: "DOWNSIZE",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    description: "The requirement is real — the mechanism is overbuilt. DAL-X enforces the lower-cost constraint.",
  },
  {
    label: "REPLACE",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
    description: "Insufficient evidence for the current cost. DAL-X blocks execution until the alternative is validated.",
  },
  {
    label: "KILL",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    description: "No evidence of value. No viable alternative. DAL-X intercepts and escalates all execution attempts.",
  },
];

const QUESTIONS = [
  { num: "Q1", text: "Named executive sponsor, authority chain, and permitted purpose" },
  { num: "Q2", text: "Evidence standard and the conditions that activate or expand scope" },
  { num: "Q3", text: "Cost baseline, DAL-X interception threshold, and escalation threshold" },
  { num: "Q4", text: "A specific, logically viable lower-cost alternative mechanism" },
  { num: "Q5", text: "Risk conditions with named reviewers and DAL-X escalation triggers" },
  { num: "Q6", text: "Governance posture: KEEP, DOWNSIZE, REPLACE, or KILL" },
];

const STAGES = [
  {
    week: "Week 1",
    title: "Agent Census",
    description: "Document every AI agent in scope — its business purpose, permitted authority, and current monthly cost.",
  },
  {
    week: "Week 2",
    title: "Investigation",
    description: "Answer six governing questions per agent. Evidence determines the governance posture — not assumption.",
  },
  {
    week: "Week 3",
    title: "Governance Registry",
    description: "Lock each posture with a reason, an evidence summary, and the condition under which DAL-X enforcement changes.",
  },
  {
    week: "Week 4",
    title: "Defense Files",
    description: "Each executive sponsor accepts or records a departure. Their decision authorizes DAL-X runtime enforcement.",
  },
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
          Fixed-scope · Four weeks · DAL-X enforced
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
          Do your AI agents operate under governance authority?
        </h1>
        <p className="mt-6 text-lg text-zinc-500 leading-relaxed max-w-2xl mx-auto">
          The Decision Governance Review is a structured, four-week assessment that produces a
          signed governance posture for every AI agent in scope — and a machine-readable policy
          configuration that DAL-X enforces at runtime.
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

      {/* Three-act principle */}
      <section className="border-y bg-zinc-950 text-zinc-100">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-6">
            Three-act governance
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500">ACT 1</span>
              </div>
              <p className="font-semibold text-zinc-100">Jochanni Labs assesses</p>
              <p className="text-zinc-400 leading-relaxed">
                Six governing questions per agent. Evidence determines the proposed governance posture.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500">ACT 2</span>
              </div>
              <p className="font-semibold text-zinc-100">Sponsor authorizes</p>
              <p className="text-zinc-400 leading-relaxed">
                The named executive sponsor accepts the posture or records a stated departure.
                No authority, no enforcement.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500">ACT 3</span>
              </div>
              <p className="font-semibold text-zinc-100">DAL-X enforces</p>
              <p className="text-zinc-400 leading-relaxed">
                The signed Governance Manifest becomes the runtime policy. DAL-X intercepts,
                escalates, and audits against it.
              </p>
            </div>
          </div>
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
                Most organizations add AI agents faster than they can assess them. Budget
                accumulates. Accountability does not.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Internal review is not independent.</p>
              <p className="text-zinc-500 leading-relaxed">
                Teams that built the agent are rarely positioned to evaluate whether it
                still earns its cost. Sunken cost reasoning dominates.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Enforcement requires authority.</p>
              <p className="text-zinc-500 leading-relaxed">
                A governance posture without a signed authority chain cannot be enforced.
                DAL-X requires one to activate runtime interception.
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
        <h2 className="text-2xl font-semibold mb-10">Four weeks. One posture per agent.</h2>
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
            The governance posture follows the first five answers. It is not asserted independently.
            Every posture carries an exact reason, the evidence behind it, and the condition under
            which DAL-X enforcement changes.
          </p>
        </div>
      </section>

      {/* Four postures */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            The outcomes
          </p>
        </div>
        <div className="flex items-center gap-2 mb-8">
          <h2 className="text-2xl font-semibold">Four governance postures.</h2>
          <Shield className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {POSTURES.map((p) => (
            <div key={p.label} className={`border rounded-lg px-5 py-4 ${p.bg}`}>
              <p className={`text-sm font-bold tracking-wider ${p.color}`}>{p.label}</p>
              <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{p.description}</p>
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
              "Agent Census — every AI agent documented with permitted purpose and monthly cost",
              "Investigation records — six-question answers per agent, on record",
              "Governance Registry — locked posture per agent with reason and condition for change",
              "Defense Files — one signed document per agent, executed by the named executive sponsor",
              "Governance Manifest — machine-readable DAL-X policy configuration (JSON)",
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
        <h2 className="text-2xl font-semibold">Ready to govern your AI agents?</h2>
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
