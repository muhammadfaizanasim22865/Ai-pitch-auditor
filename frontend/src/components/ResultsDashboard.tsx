import { useState, useMemo } from 'react';
import {
  FileText,
  Layers,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MessageSquare,
  ExternalLink,
  Clock,
  Cpu,
  AudioLines,
  RotateCcw,
  Download,
} from 'lucide-react';
import type { AnalyzeResponse, Verdict } from '@/types';
import { CredibilityScore } from './CredibilityScore';
import { ClaimCard } from './ClaimCard';
import { CrossExaminer } from './CrossExaminer';
import { InvestorTakeaway } from './InvestorTakeaway';

interface ResultsDashboardProps {
  data: AnalyzeResponse;
  onReset: () => void;
}

type FilterKey = 'ALL' | Verdict;

const filterConfig: { key: FilterKey; label: string; icon: typeof CheckCircle2; color: string }[] = [
  { key: 'ALL', label: 'All', icon: Layers, color: 'text-white' },
  { key: 'TRUE', label: 'Supported', icon: CheckCircle2, color: 'text-lime-400' },
  { key: 'FALSE', label: 'Contradicted', icon: XCircle, color: 'text-red-400' },
  { key: 'UNVERIFIED', label: 'Unverified', icon: HelpCircle, color: 'text-amber-400' },
  { key: 'OPINION', label: 'Opinion', icon: MessageSquare, color: 'text-ink-300' },
];

export function ResultsDashboard({ data, onReset }: ResultsDashboardProps) {
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [showTranscript, setShowTranscript] = useState(false);

  const allQuestions = useMemo(
    () => data.claims.flatMap((c) => c.cross_examiner_questions),
    [data],
  );

  const allEvidence = useMemo(
    () =>
      data.claims.flatMap((c) =>
        c.evidence.map((e) => ({ ...e, claimId: c.id, claimText: c.claim })),
      ),
    [data],
  );

  const allSources = useMemo(() => {
    const seen = new Set<string>();
    const result: { url: string; domain: string; claims: number[] }[] = [];
    for (const c of data.claims) {
      for (const src of c.sources) {
        if (!seen.has(src)) {
          seen.add(src);
          let domain = src;
          try {
            domain = new URL(src).hostname;
          } catch {
            // keep original
          }
          result.push({ url: src, domain, claims: [c.id] });
        } else {
          const existing = result.find((r) => r.url === src);
          if (existing && !existing.claims.includes(c.id)) {
            existing.claims.push(c.id);
          }
        }
      }
    }
    return result;
  }, [data]);

  const filteredClaims = useMemo(() => {
    if (filter === 'ALL') return data.claims;
    return data.claims.filter((c) => c.verdict === filter);
  }, [data, filter]);

  const counts = data.credibility_score.counts;

  const formatTime = (s: number) => {
    if (s < 60) return `${s.toFixed(1)}s`;
    return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  };

  const handleDownloadReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      ...data,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitch-audit-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Top bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="font-mono text-[11px] tracking-widest text-lime-400">
              ANALYSIS COMPLETE
            </span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-semibold text-white">
            Investor Report
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-ink-800 px-4 py-2.5 text-sm font-medium text-ink-200 transition-all hover:border-white/[0.15] hover:bg-ink-750"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download Report</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-ink-800 px-4 py-2.5 text-sm font-medium text-ink-200 transition-all hover:border-lime-500/20 hover:bg-lime-500/[0.06] hover:text-lime-400"
          >
            <RotateCcw className="h-4 w-4" />
            New Analysis
          </button>
        </div>
      </div>

      {/* Metadata bar */}
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-white/[0.04] bg-ink-850/50 px-4 py-3">
        <MetaItem icon={Clock} label="Processing time" value={formatTime(data.metadata.processing_time_seconds)} />
        <MetaItem icon={AudioLines} label="STT model" value={data.metadata.stt_model} />
        <MetaItem icon={Cpu} label="LLM model" value={data.metadata.llm_model} />
        <MetaItem icon={FileText} label="Claims found" value={String(data.claim_count)} />
      </div>

      {/* Credibility Score */}
      <div className="mb-6">
        <CredibilityScore data={data.credibility_score} />
      </div>

      {/* Summary / Transcript */}
      <div className="mb-6">
        <div className="card overflow-hidden">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex w-full items-center gap-3 p-5 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-ink-800">
              <FileText className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold text-white">
                Transcript
              </h3>
              <p className="mt-0.5 text-sm text-ink-400">
                {showTranscript ? 'Click to hide' : 'Click to view full transcript'}
              </p>
            </div>
          </button>
          {showTranscript && (
            <div className="border-t border-white/[0.04] p-5 animate-fade-in">
              <p className="text-[15px] leading-relaxed text-ink-200 whitespace-pre-wrap">
                {data.transcript}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Claim Statistics */}
      <div className="mb-6">
        <SectionHeader
          title="Claim Statistics"
          subtitle={`${data.claim_count} claims extracted from the pitch`}
        />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Supported"
            value={counts.TRUE}
            icon={CheckCircle2}
            color="lime"
          />
          <StatCard
            label="Contradicted"
            value={counts.FALSE}
            icon={XCircle}
            color="red"
          />
          <StatCard
            label="Unverified"
            value={counts.UNVERIFIED}
            icon={HelpCircle}
            color="amber"
          />
          <StatCard
            label="Mixed"
            value={counts.MIXED}
            icon={Layers}
            color="cyan"
          />
        </div>
      </div>

      {/* Claims */}
      <div className="mb-8">
        <SectionHeader
          title="Claim Analysis"
          subtitle="Each claim verified against external evidence"
        />

        {/* Filter tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {filterConfig.map((f) => {
            const count =
              f.key === 'ALL'
                ? data.claim_count
                : data.claims.filter((c) => c.verdict === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  filter === f.key
                    ? 'border-white/[0.12] bg-ink-800 text-white'
                    : 'border-white/[0.04] bg-ink-900/40 text-ink-400 hover:bg-ink-850'
                }`}
              >
                <f.icon className={`h-4 w-4 ${filter === f.key ? f.color : ''}`} />
                {f.label}
                <span className="font-mono text-xs text-ink-500">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          {filteredClaims.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm text-ink-400">
                No claims with this verdict.
              </p>
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} />
            ))
          )}
        </div>
      </div>

      {/* Evidence & Sources */}
      {allEvidence.length > 0 && (
        <div className="mb-8">
          <SectionHeader
            title="Evidence & Sources"
            subtitle={`${allSources.length} sources · ${allEvidence.length} evidence items`}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {allEvidence.slice(0, 10).map((ev, i) => (
              <div
                key={i}
                className="card card-hover p-4"
              >
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="flex items-start gap-3">
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-ink-500 transition-colors group-hover:text-cyan-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-100 transition-colors group-hover:text-cyan-400">
                        {ev.title}
                      </p>
                      <p className="mt-1 truncate font-mono text-[10px] text-ink-500">
                        {(() => {
                          try {
                            return new URL(ev.url).hostname;
                          } catch {
                            return ev.url;
                          }
                        })()}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-ink-300 line-clamp-3">
                        {ev.snippet}
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
          {allEvidence.length > 10 && (
            <p className="mt-3 text-center text-xs text-ink-400">
              Showing 10 of {allEvidence.length} evidence items. See individual claims for full evidence.
            </p>
          )}
        </div>
      )}

      {/* Cross-Examiner */}
      <div className="mb-8">
        <CrossExaminer questions={allQuestions} />
      </div>

      {/* Investor Takeaway */}
      <div className="mb-8">
        <InvestorTakeaway data={data} />
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.04] pt-6 text-center">
        <p className="font-mono text-[11px] text-ink-500">
          AI Pitch Auditor · Analysis generated using {data.metadata.stt_model} and {data.metadata.llm_model}
        </p>
        <p className="mt-1 text-xs text-ink-600">
          This analysis is for informational purposes only and does not constitute investment advice.
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <p className="mt-0.5 text-sm text-ink-400">{subtitle}</p>
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-ink-500" />
      <span className="font-mono text-[11px] tracking-wider text-ink-500">
        {label.toUpperCase()}
      </span>
      <span className="font-mono text-[11px] text-ink-200">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof CheckCircle2;
  color: 'lime' | 'red' | 'amber' | 'cyan';
}) {
  const colorMap = {
    lime: 'text-lime-400 border-lime-500/15 bg-lime-500/[0.04]',
    red: 'text-red-400 border-red-500/15 bg-red-500/[0.04]',
    amber: 'text-amber-400 border-amber-500/15 bg-amber-500/[0.04]',
    cyan: 'text-cyan-400 border-cyan-500/15 bg-cyan-500/[0.04]',
  };

  return (
    <div className={`card border ${colorMap[color]} p-4`}>
      <div className="flex items-center justify-between">
        <Icon className={`h-5 w-5 ${colorMap[color].split(' ')[0]}`} />
        <span className="font-display text-2xl font-bold text-white">
          {value}
        </span>
      </div>
      <p className="mt-2 text-xs font-medium text-ink-300">{label}</p>
    </div>
  );
}
