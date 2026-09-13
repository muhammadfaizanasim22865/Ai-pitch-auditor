import { Gavel, ChevronRight } from 'lucide-react';

interface CrossExaminerProps {
  questions: string[];
}

export function CrossExaminer({ questions }: CrossExaminerProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="card overflow-hidden border-lime-500/15 animate-fade-in-up">
      <div className="relative border-b border-white/[0.06] bg-gradient-to-r from-lime-500/[0.04] to-transparent px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-lime-500/25 bg-lime-500/[0.08]">
            <Gavel className="h-5 w-5 text-lime-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold tracking-wide text-white">
              CROSS-EXAMINER
            </h3>
            <p className="text-sm text-ink-300">
              Questions an investor should ask next.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {questions.map((q, i) => (
          <div
            key={i}
            className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-lime-500/[0.02]"
          >
            <span className="mt-0.5 font-mono text-xs font-semibold text-lime-400/60">
              Q{String(i + 1).padStart(2, '0')}
            </span>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-600 transition-colors group-hover:text-lime-400" />
            <p className="text-sm leading-relaxed text-ink-100">{q}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
