"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="relative min-h-screen bg-[#07070f] flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-10 max-w-sm w-full text-center">
        <span className="text-5xl block mb-4">⚠️</span>
        <h2 className="text-white font-bold text-xl mb-2">Something went wrong</h2>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="btn-find text-white font-bold px-8 py-3 rounded-2xl w-full"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
