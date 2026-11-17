import { Code2, GraduationCap } from 'lucide-react';

interface HeroBannerProps {
  onOpenPythonModal: () => void;
}

export function HeroBanner({ onOpenPythonModal }: HeroBannerProps) {
  return (
    <header className="rounded-2xl border border-indigo-400/40 bg-gradient-to-br from-slate-800/75 via-indigo-950/70 to-slate-900/90 p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/45 bg-gradient-to-r from-indigo-500/25 to-violet-500/25 px-4 py-1 text-xs font-mono font-semibold tracking-wider text-indigo-100 shadow-sm shadow-indigo-500/25">
            <span>⚡ 2026 TURBO EXAM REVISION ENGINE</span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-400/40 bg-gradient-to-br from-indigo-500/25 to-violet-500/25 text-indigo-100">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-50 via-indigo-200 to-violet-300 bg-clip-text text-transparent [text-wrap:balance]">
              AI Study Buddy
            </h1>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Convert dense lecture notes or chapter PDFs into a crisp revision summary,
            glowing key-term bento cards, and an interactive 5-question practice quiz in seconds.
          </p>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onOpenPythonModal}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/35 bg-slate-900/75 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-100 hover:border-indigo-300/60 hover:bg-indigo-950/70 transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <Code2 className="h-4 w-4 text-indigo-300" aria-hidden="true" />
            <span>Streamlit Source (app.py)</span>
          </button>
        </div>
      </div>
    </header>
  );
}
