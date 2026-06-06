"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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

const STATUS: Record<Status, { label: string; icon: string; pill: string; next: Status }> = {
  pending:     { label: "Pending",     icon: "○", pill: "bg-slate-700/60 text-slate-400 border-slate-600/40",          next: "in_progress" },
  in_progress: { label: "In Progress", icon: "◑", pill: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",       next: "done" },
  done:        { label: "Done",        icon: "✓", pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",    next: "error" },
  error:       { label: "Error",       icon: "✕", pill: "bg-red-500/20 text-red-300 border-red-500/30",               next: "pending" },
};

const PHASE_COLORS = [
  "from-orange-500/20 to-orange-600/5 border-orange-500/20",
  "from-violet-500/20 to-violet-600/5 border-violet-500/20",
  "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
  "from-blue-500/20 to-blue-600/5 border-blue-500/20",
  "from-pink-500/20 to-pink-600/5 border-pink-500/20",
];

const PHASE_BAR = [
  "bg-orange-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-pink-500",
];

function phaseIndex(phase: number | null) {
  return Math.max(0, (phase ?? 1) - 1);
}

function PhaseProgress({ done, total, phase }: { done: number; total: number; phase: number | null }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const bar = PHASE_BAR[phaseIndex(phase)];
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 shrink-0">{done}/{total}</span>
    </div>
  );
}

function ErrorNoteModal({
  task, onSave, onClose,
}: {
  task: Task; onSave: (note: string) => void; onClose: () => void;
}) {
  const [note, setNote] = useState(task.error_note ?? "");
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-1">Error note</h3>
        <p className="text-slate-500 text-sm mb-4 truncate">{task.title}</p>
        <textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe what went wrong…"
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm p-3 placeholder-slate-600 outline-none resize-none focus:border-red-500/40"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onSave(note)}
            className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
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

function TaskRow({
  task, depth, onStatusChange, onErrorNote,
}: {
  task: Task; depth: number; onStatusChange: (id: number, status: Status, note?: string) => void;
  onErrorNote: (task: Task) => void;
}) {
  const cfg = STATUS[task.status];

  function cycleStatus() {
    const next = cfg.next;
    if (next === "error") {
      onErrorNote(task);
    } else {
      onStatusChange(task.id, next);
    }
  }

  return (
    <div>
      <div
        className={`flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/3 group
          ${task.status === "error" ? "bg-red-500/5 border border-red-500/10" : ""}
          ${task.status === "done" ? "opacity-60" : ""}`}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        {/* Status toggle */}
        <button
          onClick={cycleStatus}
          title={`Click to set: ${STATUS[cfg.next].label}`}
          className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center transition-all
            ${cfg.pill} hover:scale-110`}
        >
          {cfg.icon}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${task.status === "done" ? "line-through text-slate-500" : "text-white"}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-slate-600 mt-0.5">{task.description}</p>
          )}
          {task.error_note && (
            <p className="text-xs text-red-400 mt-1 bg-red-500/10 rounded-lg px-2 py-1">
              ⚠ {task.error_note}
            </p>
          )}
        </div>

        {/* Status pill + error note edit */}
        <div className="flex items-center gap-1.5 shrink-0">
          {task.status === "error" && (
            <button
              onClick={() => onErrorNote(task)}
              className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit error note"
            >
              edit
            </button>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.pill} hidden sm:inline`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {task.children.map((child) => (
        <TaskRow key={child.id} task={child} depth={depth + 1} onStatusChange={onStatusChange} onErrorNote={onErrorNote} />
      ))}
    </div>
  );
}

function PhaseCard({
  phase, colorCls, onStatusChange, onErrorNote,
}: {
  phase: Task; colorCls: string; onStatusChange: (id: number, status: Status, note?: string) => void;
  onErrorNote: (task: Task) => void;
}) {
  const [open, setOpen] = useState(true);
  const tasks = phase.children;
  const done = tasks.filter((t) => t.status === "done").length;
  const errors = tasks.filter((t) => t.status === "error").length;
  const inProg = tasks.filter((t) => t.status === "in_progress").length;

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${colorCls} p-0 overflow-hidden`}>
      {/* Phase header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left p-5 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="text-white font-bold text-base leading-snug">{phase.title}</h3>
            {errors > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                {errors} error{errors > 1 ? "s" : ""}
              </span>
            )}
            {inProg > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                {inProg} active
              </span>
            )}
          </div>
          {phase.description && (
            <p className="text-slate-500 text-xs mb-3">{phase.description}</p>
          )}
          <PhaseProgress done={done} total={tasks.length} phase={phase.phase} />
        </div>
        <span className="text-slate-500 text-lg mt-0.5 shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {/* Task list */}
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

export default function ProgressPage() {
  const [phases, setPhases] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [errorModal, setErrorModal] = useState<Task | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/version1");
      if (res.ok) {
        const data = await res.json();
        setPhases(data.tasks ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(id: number, status: Status, note?: string) {
    // optimistic update
    setPhases((prev) => updateNodeStatus(prev, id, status, note ?? null));
    await fetch(`/api/version1/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, error_note: note ?? null }),
    });
  }

  function handleErrorNote(task: Task) {
    setErrorModal(task);
  }

  function saveErrorNote(note: string) {
    if (!errorModal) return;
    handleStatusChange(errorModal.id, "error", note);
    setErrorModal(null);
  }

  // flatten all tasks for stats
  const allTasks = phases.flatMap((p) => p.children);
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((t) => t.status === "done").length;
  const errorTasks = allTasks.filter((t) => t.status === "error").length;
  const activeTasks = allTasks.filter((t) => t.status === "in_progress").length;
  const overallPct = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const errorList = allTasks.filter((t) => t.status === "error");

  const visiblePhases = filter === "all"
    ? phases
    : phases.filter((p) => p.children.some((t) => t.status === filter));

  return (
    <main className="relative min-h-screen bg-[#07070f] overflow-x-hidden">
      {/* Orbs */}
      <div className="orb w-[500px] h-[500px] bg-violet-600/10 -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-orange-600/10 bottom-20 -left-20" />

      {errorModal && (
        <ErrorNoteModal task={errorModal} onSave={saveErrorNote} onClose={() => setErrorModal(null)} />
      )}

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-12 pb-24">

        {/* Nav */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">
            ← 3C Foods
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 fade-up">
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
            <div className="grid grid-cols-4 gap-3 mb-6 fade-up" style={{ animationDelay: "0.05s" }}>
              {[
                { label: "Done",      value: doneTasks,  cls: "text-emerald-400" },
                { label: "Active",    value: activeTasks, cls: "text-yellow-400" },
                { label: "Errors",    value: errorTasks,  cls: "text-red-400" },
                { label: "Total",     value: totalTasks,  cls: "text-slate-300" },
              ].map((s) => (
                <div key={s.label} className="glass rounded-2xl p-4 text-center">
                  <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
                  <p className="text-slate-600 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Overall progress bar */}
            <div className="glass rounded-2xl p-5 mb-6 fade-up" style={{ animationDelay: "0.08s" }}>
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

            {/* Filter tabs */}
            <div className="flex gap-2 mb-5 flex-wrap fade-up" style={{ animationDelay: "0.1s" }}>
              {(["all", "pending", "in_progress", "done", "error"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                    ${filter === f
                      ? "bg-white/10 text-white border-white/20"
                      : "text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300"}`}
                >
                  {f === "all" ? "All Phases" : STATUS[f].label}
                </button>
              ))}
            </div>

            {/* Phase cards */}
            <div className="space-y-4">
              {visiblePhases.map((phase, i) => (
                <div key={phase.id} className="fade-up" style={{ animationDelay: `${0.12 + i * 0.05}s` }}>
                  <PhaseCard
                    phase={phase}
                    colorCls={PHASE_COLORS[phaseIndex(phase.phase)]}
                    onStatusChange={handleStatusChange}
                    onErrorNote={handleErrorNote}
                  />
                </div>
              ))}
            </div>

            {/* Error log */}
            {errorList.length > 0 && filter === "all" && (
              <div className="mt-8 fade-up">
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
                          {t.error_note && (
                            <p className="text-red-400 text-xs mt-1">{t.error_note}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleStatusChange(t.id, "pending")}
                          className="text-xs text-slate-600 hover:text-slate-400 shrink-0 transition-colors"
                          title="Clear error"
                        >
                          clear
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty filter state */}
            {visiblePhases.length === 0 && (
              <div className="text-center py-16 glass rounded-2xl">
                <span className="text-3xl block mb-3">🎯</span>
                <p className="text-slate-400 text-sm">No tasks with status &quot;{filter}&quot;</p>
              </div>
            )}
          </>
        )}

        <p className="text-center text-slate-700 text-xs mt-16">3C Foods · Build Tracker · v1</p>
      </div>
    </main>
  );
}

// immutable tree update
function updateNodeStatus(nodes: Task[], id: number, status: Status, note: string | null): Task[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, status, error_note: note };
    if (n.children.length > 0) return { ...n, children: updateNodeStatus(n.children, id, status, note) };
    return n;
  });
}
