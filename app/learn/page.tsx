"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// ── Types (mirror lib/db.ts course_lessons) ──────────────────────────────────

type Status = "pending" | "in_progress" | "done" | "error";

interface Lesson {
  id: number;
  parent_id: number | null;
  title: string;
  phase: number | null;
  status: Status;
  slug: string | null;
  docs_url: string | null;
  code_url: string | null;
  hours: number;
  children: Lesson[];
}

interface Stats {
  total: number;
  done: number;
  inProgress: number;
  pct: number;
  hoursTotal: number;
  hoursDone: number;
  hoursRemaining: number;
  perPhase: { phase: number; title: string; total: number; done: number; pct: number }[];
}

interface NextLesson {
  id: number;
  title: string;
  phase: number | null;
  phaseTitle: string;
  docsUrl: string | null;
  codeUrl: string | null;
}

// ── Status config (3-state cycle for lessons) ─────────────────────────────────

const STATUS: Record<Status, { label: string; icon: string; pill: string; next: Status; color: string }> = {
  pending:     { label: "To do",       icon: "○", pill: "bg-slate-700/60 text-slate-400 border-slate-600/40",       next: "in_progress", color: "#334155" },
  in_progress: { label: "In Progress", icon: "◑", pill: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",    next: "done",        color: "#facc15" },
  done:        { label: "Done",        icon: "✓", pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", next: "pending",     color: "#34d399" },
  error:       { label: "Stuck",       icon: "✕", pill: "bg-red-500/20 text-red-300 border-red-500/30",             next: "pending",     color: "#f87171" },
};

// 20 distinct phase colors via an evenly spaced hue ramp.
const PHASE_COLORS = Array.from({ length: 20 }, (_, i) => `hsl(${Math.round((i * 360) / 20)}, 70%, 62%)`);

// ── Charts ────────────────────────────────────────────────────────────────────

function OverallDonut({ stats }: { stats: Stats }) {
  const data = [
    { name: "done", value: stats.done, color: STATUS.done.color },
    { name: "in_progress", value: stats.inProgress, color: STATUS.in_progress.color },
    { name: "pending", value: stats.total - stats.done - stats.inProgress, color: STATUS.pending.color },
  ].filter((d) => d.value > 0);

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Overall</p>
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-white">{stats.pct}%</span>
          <span className="text-slate-500 text-xs">{stats.done}/{stats.total} lessons</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div><p className="text-emerald-400 font-bold text-sm">{stats.hoursDone}h</p><p className="text-slate-600 text-[11px]">done</p></div>
        <div><p className="text-slate-300 font-bold text-sm">{stats.hoursRemaining}h</p><p className="text-slate-600 text-[11px]">left</p></div>
        <div><p className="text-slate-300 font-bold text-sm">{stats.hoursTotal}h</p><p className="text-slate-600 text-[11px]">total</p></div>
      </div>
    </div>
  );
}

function PhaseBars({ stats }: { stats: Stats }) {
  const data = stats.perPhase.map((p) => ({ name: `P${String(p.phase).padStart(2, "0")}`, pct: p.pct }));
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Completion by Phase</p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={9} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 8 }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="bg-[#0f0f1a] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
                    <span className="text-slate-400">{label} — </span>
                    <span className="text-white font-bold">{payload[0].value}%</span>
                  </div>
                ) : null
              }
            />
            <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={PHASE_COLORS[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Coach banner ──────────────────────────────────────────────────────────────

function CoachBanner({ next, stats, perWeek, setPerWeek }: {
  next: NextLesson | null; stats: Stats; perWeek: number; setPerWeek: (n: number) => void;
}) {
  const remaining = stats.total - stats.done;
  const weeks = perWeek > 0 ? Math.ceil(remaining / perWeek) : 0;
  const finish = new Date();
  finish.setDate(finish.getDate() + weeks * 7);
  const finishStr = weeks > 0
    ? finish.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-600/15 to-pink-600/5 p-5 mb-5 fade-up">
      <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-2">Your coach</p>
      {next ? (
        <>
          <p className="text-slate-400 text-xs mb-1">▶ Up next · {next.phaseTitle}</p>
          <h2 className="text-white font-bold text-lg leading-snug mb-3">{next.title}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {next.docsUrl && (
              <a href={next.docsUrl} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors">
                📖 Read lesson
              </a>
            )}
            {next.codeUrl && (
              <a href={next.codeUrl} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors">
                {"</>"} Code
              </a>
            )}
          </div>
        </>
      ) : (
        <h2 className="text-white font-bold text-lg mb-3">🎉 All 503 lessons complete — you finished the curriculum!</h2>
      )}
      <div className="flex items-center gap-3 flex-wrap text-sm border-t border-white/10 pt-3">
        <span className="text-slate-400">Pace:</span>
        <input
          type="number" min={1} max={50} value={perWeek}
          onChange={(e) => setPerWeek(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
          className="w-16 bg-white/5 border border-white/10 rounded-lg text-white text-center py-1 outline-none focus:border-violet-500/40"
        />
        <span className="text-slate-400">lessons/week</span>
        <span className="text-slate-500 ml-auto">
          {remaining} left → finish <span className="text-white font-semibold">{finishStr}</span> · ~{weeks}w
        </span>
      </div>
    </div>
  );
}

// ── Lesson row + phase card ───────────────────────────────────────────────────

function LessonRow({ lesson, onCycle }: { lesson: Lesson; onCycle: (l: Lesson) => void }) {
  const cfg = STATUS[lesson.status];
  return (
    <div className={`flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors ${lesson.status === "done" ? "opacity-60" : ""}`}>
      <button
        onClick={() => onCycle(lesson)}
        title={`Set: ${STATUS[cfg.next].label}`}
        className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center transition-all ${cfg.pill} hover:scale-110`}
      >
        {cfg.icon}
      </button>
      <p className={`flex-1 min-w-0 text-sm leading-snug ${lesson.status === "done" ? "line-through text-slate-500" : "text-white"}`}>
        {lesson.title}
      </p>
      <div className="flex items-center gap-2 shrink-0">
        {lesson.docs_url && (
          <a href={lesson.docs_url} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-violet-300 transition-colors" title="Open lesson docs">↗</a>
        )}
      </div>
    </div>
  );
}

function PhaseCard({ phase, color, onCycle, onMarkPhase }: {
  phase: Lesson; color: string; onCycle: (l: Lesson) => void; onMarkPhase: (phaseNum: number, status: Status) => void;
}) {
  const [open, setOpen] = useState(false);
  const lessons = phase.children;
  const done = lessons.filter((l) => l.status === "done").length;
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
  const allDone = done === lessons.length && lessons.length > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left p-4 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm leading-snug mb-2 truncate">{phase.title}</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs text-slate-500 shrink-0 w-12 text-right">{done}/{lessons.length}</span>
          </div>
        </div>
        <span className="text-slate-500 text-sm shrink-0">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-white/5 px-3 py-2">
          <div className="flex gap-2 mb-2 px-1">
            <button
              onClick={() => onMarkPhase(phase.phase!, "done")}
              disabled={allDone}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-40"
            >
              ✓ Mark all done
            </button>
            <button
              onClick={() => onMarkPhase(phase.phase!, "pending")}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-colors"
            >
              Reset phase
            </button>
          </div>
          <div className="space-y-0.5">
            {lessons.map((l) => <LessonRow key={l.id} lesson={l} onCycle={onCycle} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const [phases, setPhases] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [next, setNext] = useState<NextLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [perWeek, setPerWeek] = useState(7);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/course");
      if (res.ok) {
        const data = await res.json();
        setPhases(data.tasks ?? []);
        setStats(data.stats ?? null);
        setNext(data.next ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function cycle(lesson: Lesson) {
    const status = STATUS[lesson.status].next;
    setPhases((prev) =>
      prev.map((p) => ({ ...p, children: p.children.map((l) => (l.id === lesson.id ? { ...l, status } : l)) }))
    );
    await fetch(`/api/course/${lesson.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load(); // refresh stats + next-lesson
  }

  async function markPhase(phaseNum: number, status: Status) {
    setPhases((prev) =>
      prev.map((p) => (p.phase === phaseNum ? { ...p, children: p.children.map((l) => ({ ...l, status })) } : p))
    );
    await fetch("/api/course", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: phaseNum, status }),
    });
    load();
  }

  return (
    <main className="relative min-h-screen bg-[#07070f] overflow-x-hidden">
      <div className="orb w-[500px] h-[500px] bg-violet-600/10 -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-emerald-600/10 bottom-20 -left-20" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-12 pb-24">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">← 3C Foods</Link>
          <Link href="/progress" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">Build Tracker</Link>
        </div>

        <div className="mb-6 fade-up">
          <h1 className="text-4xl font-black tracking-tight gradient-text mb-1">AI Engineering · Learning Path</h1>
          <p className="text-slate-500 text-sm">
            20 phases · 503 lessons · ~320h ·{" "}
            <a href="https://github.com/rohitg00/ai-engineering-from-scratch" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-violet-300 underline">rohitg00/ai-engineering-from-scratch</a>
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 glass rounded-3xl">
            <div className="text-4xl mb-4 animate-pulse">🧭</div>
            <p className="text-white font-semibold">Loading your path…</p>
            <p className="text-slate-500 text-sm mt-1">Seeding 503 lessons on first load (requires Postgres)</p>
          </div>
        ) : phases.length === 0 || !stats ? (
          <div className="text-center py-20 glass rounded-3xl">
            <span className="text-4xl block mb-4">🗄️</span>
            <p className="text-white font-semibold text-lg mb-1">Database not connected</p>
            <p className="text-slate-500 text-sm">Add POSTGRES_URL in your env, then reload to seed the curriculum.</p>
          </div>
        ) : (
          <>
            <CoachBanner next={next} stats={stats} perWeek={perWeek} setPerWeek={setPerWeek} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 fade-up" style={{ animationDelay: "0.06s" }}>
              <OverallDonut stats={stats} />
              <PhaseBars stats={stats} />
            </div>

            <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3 mt-8">All Phases</h2>
            <div className="space-y-3">
              {phases.map((phase, i) => (
                <PhaseCard key={phase.id} phase={phase} color={PHASE_COLORS[i % PHASE_COLORS.length]} onCycle={cycle} onMarkPhase={markPhase} />
              ))}
            </div>
          </>
        )}

        <p className="text-center text-slate-700 text-xs mt-16">AI Engineering From Scratch · Learning Tracker</p>
      </div>
    </main>
  );
}
