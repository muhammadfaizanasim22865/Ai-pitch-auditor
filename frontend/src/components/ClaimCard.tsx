import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MessageSquare,
  Quote,
  ExternalLink,
} from 'lucide-react';
import type { Claim, Verdict } from '@/types';

const verdictConfig: Record<
  Verdict,
  {
    label: string;
    icon: typeof CheckCircle2;
    color: string;
    bg: string;
    border: string;
    text: string;
    dot: string;
  }
> = {
  TRUE: {
    label: 'SUPPORTED',
    icon: CheckCircle2,
    color: 'lime',
    bg: 'bg-lime-500/[0.06]',
    border: 'border-lime-500/20',
    text: 'text-lime-400',
    dot: 'bg-lime-400',
  },
  FALSE: {
    label: 'CONTRADICTED',
    icon: XCircle,
    color: 'red',
    bg: 'bg-red-500/[0.06]',
    border: 'border-red-500/20',
    text: 'text-red-400',
    dot: 'bg-red-400',
  },
  UNVERIFIED: {
    label: 'UNVERIFIED',
    icon: HelpCircle,
    color: 'amber',
    bg: 'bg-amber-500/[0.06]',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  MIXED: {
    label: 'MIXED',
    icon: HelpCircle,
    color: 'cyan',
    bg: 'bg-cyan-500/[0.06]',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    dot: 'bg-cyan-400',
  },
  OPINION: {
    label: 'OPINION',
    icon: MessageSquare,
    color: 'slate',
    bg: 'bg-ink-600/[0.06]',
    border: 'border-white/[0.08]',
    text: 'text-ink-300',
    dot: 'bg-ink-400',
  },
};

interface ClaimCardProps {
  claim: Claim;
  defaultExpanded?: boolean;
}

export function ClaimCard({ claim, defaultExpanded = false }: ClaimCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const config = verdictConfig[claim.verdict] || verdictConfig.UNVERIFIED;
  const Icon = config.icon;

  const confidencePercent = Math.round(claim.confidence * 100);

  return (
    <div
      className={`card card-hover overflow-hidden border ${config.border} ${config.bg} animate-fade-in-up`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-4 p-5 text-left"
        aria-expanded={expanded}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${config.border} ${config.bg}`}
        >
          <Icon className={`h-5 w-5 ${config.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`font-mono text-[11px] font-semibold tracking-wider ${config.text}`}
            >
              {config.label}
            </span>
            <span className="font-mono text-[11px] text-ink-500">·</span>
            <span className="font-mono text-[11px] tracking-wider text-ink-400">
              {claim.category.toUpperCase()}
            </span>
            <span className="font-mono text-[11px] text-ink-500">·</span>
            <span className="font-mono text-[11px] text-ink-400">
              {confidencePercent}% confidence
            </span>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-50">
            {claim.claim}
          </p>
        </div>
        <div className="shrink-0 pt-1">
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-ink-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-ink-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.04] px-5 pb-5 pt-4 animate-fade-in">
          {claim.explanation && (
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2">
                <Quote className="h-3.5 w-3.5 text-ink-400" />
                <span className="font-mono text-[11px] tracking-wider text-ink-400">
                  VERIFICATION ANALYSIS
                </span>
              </div>
              <p className="text-sm leading-relaxed text-ink-200">
                {claim.explanation}
              </p>
            </div>
          )}

          {claim.evidence.length > 0 && (
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-[11px] tracking-wider text-ink-400">
                  EVIDENCE
                </span>
                <span className="font-mono text-[11px] text-ink-500">
                  ({claim.evidence.length})
                </span>
              </div>
              <div className="space-y-2">
                {claim.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-white/[0.04] bg-ink-900/50 p-3"
                  >
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2"
                    >
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500 transition-colors group-hover:text-cyan-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-100 transition-colors group-hover:text-cyan-400">
                          {ev.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-300 line-clamp-3">
                          {ev.snippet}
                        </p>
                        <p className="mt-1 truncate font-mono text-[10px] text-ink-500">
                          {new URL(ev.url).hostname}
                        </p>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {claim.sources.length > 0 && (
            <div>
              <div className="mb-2 font-mono text-[11px] tracking-wider text-ink-400">
                SOURCES
              </div>
              <div className="flex flex-wrap gap-2">
                {claim.sources.map((src, i) => {
                  let hostname = src;
                  try {
                    hostname = new URL(src).hostname;
                  } catch {
                    // keep original
                  }
                  return (
                    <a
                      key={i}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-ink-800 px-2.5 py-1 font-mono text-[11px] text-ink-300 transition-all hover:border-cyan-500/20 hover:text-cyan-400"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {hostname}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {claim.verdict === 'UNVERIFIED' && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/[0.04] p-3">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/80" />
              <p className="text-xs leading-relaxed text-amber-300/80">
                Absence of evidence does not mean the claim is false. This claim
                could not be verified with available sources.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
