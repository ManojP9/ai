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
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";

type Status = "pending" | "in_progress" | "done" | "error";

interface Task {
  id: number;
  parent_id: number | null;
  title: string;
  description: string | null;
  phase: number | null;
  status: Status;
  error_note: string | null;
  children: Task[];
}

const STATUS: Record<Status, { label: string; icon: string; pill: string; next: Status; color: string }> = {
  pending:     { label: "Pending",     icon: "○", pill: "bg-slate-700/60 text-slate-400 border-slate-600/40",       next: "in_progress", color: "#334155" },
  in_progress: { label: "In Progress", icon: "◑", pill: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",    next: "done",        color: "#facc15" },
  done:        { label: "Done",        icon: "✓", pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", next: "error",       color: "#34d399" },
  error:       { label: "Error",       icon: "✕", pill: "bg-red-500/20 text-red-300 border-red-500/30",            next: "pending",     color: "#f87171" },
};

const PHASE_COLORS = [
  "from-orange-500/20 to-orange-600/5 border-orange-500/20",
  "from-violet-500/20 to-violet-600/5 border-violet-500/20",
  "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
  "from-blue-500/20 to-blue-600/5 border-blue-500/20",
  "from-pink-500/20 to-pink-600/5 border-pink-500/20",
];

const PHASE_BAR_COLORS = ["#f97316", "#a78bfa", "#34d399", "#60a5fa", "#f472b6"];

function phaseIndex(phase: number | null) {
  return Math.max(0, (phase ?? 1) - 1);
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl">
      {label && <p className="text-slate-400 font-semibold mb-2">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill }} />
          <span className="text-slate-400 capitalize">{p.name.replace("_", " ")}</span>
          <span className="text-white font-bold ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: {
  active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: p.payload.color }} />
        <span className="text-slate-400 capitalize">{p.name.replace("_", " ")}</span>
        <span className="text-white font-bold ml-auto pl-4">{p.value}</span>
      </div>
    </div>
  );
}

// ── Chart Components ──────────────────────────────────────────────────────────

function StatusDonut({ tasks }: { tasks: Task[] }) {
  const data = (["done", "in_progress", "error", "pending"] as Status[])
    .map((s) => ({ name: s, value: tasks.filter((t) => t.status === s).length, color: STATUS[s].color }))
    .filter((d) => d.value > 0);

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Status Split</p>
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-white">{pct}%</span>
          <span className="text-slate-500 text-xs">complete</span>
        </div>
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
        {(["done", "in_progress", "error", "pending"] as Status[]).map((s) => {
          const count = tasks.filter((t) => t.status === s).length;
          return (
            <div key={s} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS[s].color }} />
              <span className="text-slate-500 text-xs capitalize">{s.replace("_", " ")}</span>
              <span className="text-white text-xs font-bold ml-auto">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseBar({ phases }: { phases: Task[] }) {
  const data = phases.map((p) => {
    const tasks = p.children;
    return {
      name: `P${p.phase}`,
      done:        tasks.filter((t) => t.status === "done").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      error:       tasks.filter((t) => t.status === "error").length,
      pending:     tasks.filter((t) => t.status === "pending").length,
    };
  });

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Tasks per Phase</p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={28} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="done"        stackId="a" fill="#34d399" radius={[0,0,0,0]} />
            <Bar dataKey="in_progress" stackId="a" fill="#facc15" />
            <Bar dataKey="error"       stackId="a" fill="#f87171" />
            <Bar dataKey="pending"     stackId="a" fill="#1e293b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RadialProgress({ phases }: { phases: Task[] }) {
  const data = phases.map((p, i) => {
    const tasks = p.children;
    const done = tasks.filter((t) => t.status === "done").length;
    const pct = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);
    return {
      name: `Phase ${p.phase}`,
      value: pct,
      fill: PHASE_BAR_COLORS[i] ?? "#94a3b8",
    };
  }).reverse(); // recharts draws bottom-up

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Phase Completion %</p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius={18}
            outerRadius={80}
            barSize={10}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              background={{ fill: "rgba(255,255,255,0.04)" }}
              dataKey="value"
              cornerRadius={6}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0];
                return (
                  <div className="bg-[#0f0f1a] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
                    <span className="text-slate-400">{p.payload.name} — </span>
                    <span className="text-white font-bold">{p.value}%</span>
                  </div>
                );
              }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      {/* Phase legend */}
      <div className="space-y-1.5 mt-2">
        {phases.map((p, i) => {
          const tasks = p.children;
          const done = tasks.filter((t) => t.status === "done").length;
          const pct = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);
          return (
            <div key={p.id} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PHASE_BAR_COLORS[i] }} />
              <span className="text-slate-500 text-xs truncate flex-1">Phase {p.phase}</span>
              <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: PHASE_BAR_COLORS[i] }} />
              </div>
              <span className="text-slate-400 text-xs w-8 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Task UI ───────────────────────────────────────────────────────────────────

function ErrorNoteModal({ task, onSave, onClose }: {
  task: Task; onSave: (note: string) => void; onClose: () => void;
}) {
  const [note, setNote] = useState(task.error_note ?? "");
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-1">Error note</h3>
        <p className="text-slate-500 text-sm mb-4 truncate">{task.title}</p>
        <textarea
          autoFocus value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Describe what went wrong…" rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm p-3 placeholder-slate-600 outline-none resize-none focus:border-red-500/40"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={() => onSave(note)} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold py-2.5 rounded-xl text-sm transition-colors">
            Save Error
          </button>
          <button onClick={onClose} className="flex-1 chip text-slate-400 py-2.5 rounded-xl text-sm font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, depth, onStatusChange, onErrorNote }: {
  task: Task; depth: number;
  onStatusChange: (id: number, status: Status, note?: string) => void;
  onErrorNote: (task: Task) => void;
}) {
  const cfg = STATUS[task.status];
  function cycleStatus() {
    const next = cfg.next;
    if (next === "error") onErrorNote(task);
    else onStatusChange(task.id, next);
  }
  return (
    <div>
      <div
        className={`flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/3 group
          ${task.status === "error" ? "bg-red-500/5 border border-red-500/10" : ""}
          ${task.status === "done" ? "opacity-60" : ""}`}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <button
          onClick={cycleStatus}
          title={`Set: ${STATUS[cfg.next].label}`}
          className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center transition-all ${cfg.pill} hover:scale-110`}
        >
          {cfg.icon}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${task.status === "done" ? "line-through text-slate-500" : "text-white"}`}>
            {task.title}
          </p>
          {task.description && <p className="text-xs text-slate-600 mt-0.5">{task.description}</p>}
          {task.error_note && (
            <p className="text-xs text-red-400 mt-1 bg-red-500/10 rounded-lg px-2 py-1">⚠ {task.error_note}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {task.status === "error" && (
            <button onClick={() => onErrorNote(task)} className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
              edit
            </button>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.pill} hidden sm:inline`}>{cfg.label}</span>
        </div>
      </div>
      {task.children.map((child) => (
        <TaskRow key={child.id} task={child} depth={depth + 1} onStatusChange={onStatusChange} onErrorNote={onErrorNote} />
      ))}
    </div>
  );
}

function PhaseCard({ phase, colorCls, onStatusChange, onErrorNote, onMarkPhaseDone }: {
  phase: Task; colorCls: string;
  onStatusChange: (id: number, status: Status, note?: string) => void;
  onErrorNote: (task: Task) => void;
  onMarkPhaseDone: (phaseNum: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const [marking, setMarking] = useState(false);
  const tasks = phase.children;
  const done = tasks.filter((t) => t.status === "done").length;
  const errors = tasks.filter((t) => t.status === "error").length;
  const inProg = tasks.filter((t) => t.status === "in_progress").length;
  const pIdx = phaseIndex(phase.phase);
  const barColor = PHASE_BAR_COLORS[pIdx];
  const pct = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);
  const allDone = done === tasks.length && tasks.length > 0;

  async function handleMarkDone(e: React.MouseEvent) {
    e.stopPropagation();
    setMarking(true);
    await onMarkPhaseDone(phase.phase!);
    setMarking(false);
  }

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${colorCls} overflow-hidden`}>
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left p-5 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="text-white font-bold text-base leading-snug">{phase.title}</h3>
            {errors > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">{errors} error{errors > 1 ? "s" : ""}</span>}
            {inProg > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">{inProg} active</span>}
          </div>
          {phase.description && <p className="text-slate-500 text-xs mb-3">{phase.description}</p>}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <span className="text-xs text-slate-500 shrink-0">{done}/{tasks.length}</span>
          </div>
          {!allDone && (
            <button
              onClick={handleMarkDone}
              disabled={marking}
              className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
            >
              {marking ? "Marking…" : "✓ Mark phase done"}
            </button>
          )}
        </div>
        <span className="text-slate-500 text-lg mt-0.5 shrink-0">{open ? "▲" : "▼"}</span>
      </button>
      {open && tasks.length > 0 && (
        <div className="border-t border-white/5 px-4 py-3 space-y-1">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} depth={0} onStatusChange={onStatusChange} onErrorNote={onErrorNote} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function updateNodeStatus(nodes: Task[], id: number, status: Status, note: string | null): Task[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, status, error_note: note };
    if (n.children.length) return { ...n, children: updateNodeStatus(n.children, id, status, note) };
    return n;
  });
}

export default function ProgressPage() {
  const [phases, setPhases] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [errorModal, setErrorModal] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<"charts" | "tasks">("charts");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/version1");
      if (res.ok) setPhases((await res.json()).tasks ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(id: number, status: Status, note?: string) {
    setPhases((prev) => updateNodeStatus(prev, id, status, note ?? null));
    await fetch(`/api/version1/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, error_note: note ?? null }),
    });
  }

  async function handleMarkPhaseDone(phaseNum: number) {
    // Optimistic update
    setPhases((prev) =>
      prev.map((p) =>
        p.phase === phaseNum
          ? { ...p, children: p.children.map((t) => ({ ...t, status: "done" as Status })) }
          : p
      )
    );
    await fetch("/api/version1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: phaseNum, status: "done" }),
    });
  }

  const allTasks    = phases.flatMap((p) => p.children);
  const doneTasks   = allTasks.filter((t) => t.status === "done").length;
  const errorTasks  = allTasks.filter((t) => t.status === "error").length;
  const activeTasks = allTasks.filter((t) => t.status === "in_progress").length;
  const totalTasks  = allTasks.length;
  const overallPct  = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
  const errorList   = allTasks.filter((t) => t.status === "error");

  const visiblePhases = filter === "all"
    ? phases
    : phases.filter((p) => p.children.some((t) => t.status === filter));

  return (
    <main className="relative min-h-screen bg-[#07070f] overflow-x-hidden">
      <div className="orb w-[500px] h-[500px] bg-violet-600/10 -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-orange-600/10 bottom-20 -left-20" />

      {errorModal && (
        <ErrorNoteModal
          task={errorModal}
          onSave={(note) => { handleStatusChange(errorModal.id, "error", note); setErrorModal(null); }}
          onClose={() => setErrorModal(null)}
        />
      )}

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-12 pb-24">

        {/* Nav */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">
            ← 3C Foods
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6 fade-up">
          <h1 className="text-4xl font-black tracking-tight gradient-text mb-1">Build Progress</h1>
          <p className="text-slate-500 text-sm">YC Roadmap · version 1</p>
        </div>

        {loading ? (
          <div className="text-center py-20 glass rounded-3xl">
            <div className="text-4xl mb-4 animate-pulse">📊</div>
            <p className="text-white font-semibold">Loading roadmap…</p>
            <p className="text-slate-500 text-sm mt-1">Requires Postgres to be connected</p>
          </div>
        ) : phases.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl">
            <span className="text-4xl block mb-4">🗄️</span>
            <p className="text-white font-semibold text-lg mb-1">Database not connected</p>
            <p className="text-slate-500 text-sm">Add POSTGRES_URL in Vercel → Settings → Environment Variables</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-5 fade-up" style={{ animationDelay: "0.05s" }}>
              {[
                { label: "Done",    value: doneTasks,   color: "#34d399" },
                { label: "Active",  value: activeTasks, color: "#facc15" },
                { label: "Errors",  value: errorTasks,  color: "#f87171" },
                { label: "Total",   value: totalTasks,  color: "#94a3b8" },
              ].map((s) => (
                <div key={s.label} className="glass rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-slate-600 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Overall progress bar */}
            <div className="glass rounded-2xl p-5 mb-5 fade-up" style={{ animationDelay: "0.08s" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold text-sm">Overall Progress</span>
                <span className="text-slate-400 text-sm font-bold">{overallPct}%</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-700"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <p className="text-slate-600 text-xs mt-2">{doneTasks} of {totalTasks} tasks complete</p>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2 mb-5 fade-up" style={{ animationDelay: "0.10s" }}>
              {(["charts", "tasks"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`text-sm font-semibold px-5 py-2 rounded-xl border transition-all capitalize
                    ${activeTab === t ? "bg-white/10 text-white border-white/20" : "text-slate-500 border-white/5 hover:text-slate-300"}`}
                >
                  {t === "charts" ? "📊 Charts" : "✅ Tasks"}
                </button>
              ))}
            </div>

            {/* Charts tab */}
            {activeTab === "charts" && (
              <div className="space-y-4 fade-up" style={{ animationDelay: "0.12s" }}>
                {/* Top row: donut + stacked bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StatusDonut tasks={allTasks} />
                  <PhaseBar phases={phases} />
                </div>
                {/* Radial progress per phase */}
                <RadialProgress phases={phases} />
              </div>
            )}

            {/* Tasks tab */}
            {activeTab === "tasks" && (
              <div className="fade-up" style={{ animationDelay: "0.12s" }}>
                {/* Filter tabs */}
                <div className="flex gap-2 mb-5 flex-wrap">
                  {(["all", "pending", "in_progress", "done", "error"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                        ${filter === f ? "bg-white/10 text-white border-white/20" : "text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300"}`}
                    >
                      {f === "all" ? "All Phases" : STATUS[f].label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {visiblePhases.map((phase, i) => (
                    <PhaseCard
                      key={phase.id}
                      phase={phase}
                      colorCls={PHASE_COLORS[phaseIndex(phase.phase)]}
                      onStatusChange={handleStatusChange}
                      onErrorNote={(task) => setErrorModal(task)}
                      onMarkPhaseDone={handleMarkPhaseDone}
                    />
                  ))}
                </div>

                {/* Error log */}
                {errorList.length > 0 && filter === "all" && (
                  <div className="mt-8">
                    <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">
                      🔴 Error Log ({errorList.length})
                    </h2>
                    <div className="space-y-2">
                      {errorList.map((t) => (
                        <div key={t.id} className="glass rounded-xl p-4 border border-red-500/15">
                          <div className="flex items-start gap-3">
                            <span className="text-red-400 text-lg shrink-0">✕</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium">{t.title}</p>
                              {t.error_note && <p className="text-red-400 text-xs mt-1">{t.error_note}</p>}
                            </div>
                            <button onClick={() => handleStatusChange(t.id, "pending")} className="text-xs text-slate-600 hover:text-slate-400 shrink-0 transition-colors">
                              clear
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {visiblePhases.length === 0 && (
                  <div className="text-center py-16 glass rounded-2xl">
                    <span className="text-3xl block mb-3">🎯</span>
                    <p className="text-slate-400 text-sm">No tasks with status &quot;{filter}&quot;</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <p className="text-center text-slate-700 text-xs mt-16">3C Foods · Build Tracker · v1</p>
      </div>
    </main>
  );
}
