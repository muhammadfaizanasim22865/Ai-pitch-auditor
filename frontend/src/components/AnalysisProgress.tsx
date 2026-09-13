import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const STAGES = [
  { label: 'TRANSCRIBING', description: 'Converting speech to text' },
  { label: 'EXTRACTING CLAIMS', description: 'Identifying factual statements' },
  { label: 'SEARCHING EVIDENCE', description: 'Gathering external sources' },
  { label: 'VERIFYING CLAIMS', description: 'Cross-referencing with evidence' },
  { label: 'BUILDING INVESTOR REPORT', description: 'Generating analysis & questions' },
];

interface AnalysisProgressProps {
  fileName: string;
}

export function AnalysisProgress({ fileName }: AnalysisProgressProps) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:py-32">
      <div className="text-center">
        <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-lime-500/10 blur-2xl animate-pulse-glow" />
          <div className="absolute inset-0 rounded-full border-2 border-lime-500/20" />
          <div className="absolute inset-2 rounded-full border-2 border-lime-500/30 border-t-lime-400 animate-spin" style={{ animationDuration: '1.5s' }} />
          <Loader2 className="relative h-7 w-7 animate-spin text-lime-400" style={{ animationDuration: '2s' }} />
        </div>

        <h2 className="font-display text-2xl font-semibold text-white">
          Analyzing Pitch
        </h2>
        <p className="mt-2 font-mono text-sm text-ink-300">
          {fileName}
        </p>
      </div>

      <div className="mt-12 space-y-2">
        {STAGES.map((stage, i) => {
          const isComplete = i < currentStage;
          const isActive = i === currentStage;
          const isPending = i > currentStage;

          return (
            <div
              key={stage.label}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-500 ${
                isActive
                  ? 'border-lime-500/20 bg-lime-500/[0.04]'
                  : isComplete
                    ? 'border-white/[0.04] bg-ink-850/40'
                    : 'border-white/[0.02] bg-ink-900/30'
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                {isComplete ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-500/15">
                    <svg className="h-4 w-4 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin text-lime-400" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-ink-600" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-mono text-sm tracking-wide transition-colors duration-300 ${
                    isActive
                      ? 'text-lime-400'
                      : isComplete
                        ? 'text-ink-200'
                        : 'text-ink-500'
                  }`}
                >
                  {stage.label}
                </p>
                <p
                  className={`mt-0.5 text-xs transition-colors duration-300 ${
                    isActive ? 'text-ink-300' : 'text-ink-500'
                  }`}
                >
                  {stage.description}
                </p>
              </div>
              {isActive && (
                <div className="flex gap-1">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-1.5 w-1.5 rounded-full bg-lime-400"
                      style={{
                        animation: `pulseGlow 1s ease-in-out ${dot * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-ink-400">
        This may take up to a minute while the system transcribes, searches evidence, and verifies each claim.
      </p>
    </div>
  );
}
