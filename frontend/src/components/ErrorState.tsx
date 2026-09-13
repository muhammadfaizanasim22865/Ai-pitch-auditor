import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { ApiError } from '@/types';

interface ErrorStateProps {
  error: ApiError;
  onRetry: () => void;
  onReset: () => void;
}

export function ErrorState({ error, onRetry, onReset }: ErrorStateProps) {
  const isNetwork = error.type === 'network';

  return (
    <div className="mx-auto max-w-xl px-4 py-20 sm:py-32">
      <div className="card border-red-400/15 bg-red-400/[0.03] p-8 text-center animate-fade-in-up">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="font-display text-xl font-semibold text-white">
          {isNetwork ? 'Connection Error' : 'Analysis Failed'}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-300">
          {error.message}
        </p>
        <div className="mt-3">
          <span className="font-mono text-[11px] tracking-wider text-ink-500">
            ERROR TYPE: {error.type.toUpperCase()}
          </span>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-500 to-lime-600 px-6 py-3 font-display text-sm font-semibold text-ink-950 transition-all hover:from-lime-400 hover:to-lime-500"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
          <button
            onClick={onReset}
            className="rounded-xl border border-white/[0.08] bg-ink-800 px-6 py-3 font-display text-sm font-medium text-ink-200 transition-all hover:border-white/[0.15] hover:bg-ink-750"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
