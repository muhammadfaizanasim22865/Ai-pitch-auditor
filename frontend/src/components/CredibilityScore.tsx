import type { CredibilityScore as ScoreData } from '@/types';

interface CredibilityScoreProps {
  data: ScoreData;
}

export function CredibilityScore({ data }: CredibilityScoreProps) {
  const score = data.score;
  const hasScore = score !== null && score !== undefined;

  let color = 'text-ink-300';
  let ringColor = 'stroke-ink-600';
  let bgColor = 'bg-ink-600/10';
  let label = 'NO SCORE';

  if (hasScore) {
    if (score >= 70) {
      color = 'text-lime-400';
      ringColor = 'stroke-lime-500';
      bgColor = 'bg-lime-500/10';
      label = 'STRONG';
    } else if (score >= 50) {
      color = 'text-cyan-400';
      ringColor = 'stroke-cyan-500';
      bgColor = 'bg-cyan-500/10';
      label = 'MODERATE';
    } else if (score >= 30) {
      color = 'text-amber-400';
      ringColor = 'stroke-amber-500';
      bgColor = 'bg-amber-500/10';
      label = 'WEAK';
    } else {
      color = 'text-red-400';
      ringColor = 'stroke-red-500';
      bgColor = 'bg-red-500/10';
      label = 'HIGH RISK';
    }
  }

  const circumference = 2 * Math.PI * 52;
  const dashOffset = hasScore
    ? circumference - (score / 100) * circumference
    : circumference;

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="6"
              className="stroke-ink-700"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className={`${ringColor} transition-all duration-1000 ease-out`}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-display text-3xl font-bold ${color}`}>
              {hasScore ? score : '--'}
            </span>
            <span className="font-mono text-[10px] tracking-widest text-ink-400">
              {label}
            </span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-display text-lg font-semibold text-white">
            Credibility Score
          </h3>
          <p className="mt-1 text-sm text-ink-300">{data.basis}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatBadge label="Supported" value={data.counts.TRUE} color="lime" />
            <StatBadge label="Contradicted" value={data.counts.FALSE} color="red" />
            <StatBadge label="Mixed" value={data.counts.MIXED} color="cyan" />
            <StatBadge label="Unverified" value={data.counts.UNVERIFIED} color="amber" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'lime' | 'red' | 'cyan' | 'amber';
}) {
  const colorMap = {
    lime: 'border-lime-500/20 bg-lime-500/[0.06] text-lime-300',
    red: 'border-red-500/20 bg-red-500/[0.06] text-red-300',
    cyan: 'border-cyan-500/20 bg-cyan-500/[0.06] text-cyan-300',
    amber: 'border-amber-500/20 bg-amber-500/[0.06] text-amber-300',
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${colorMap[color]}`}
    >
      <span className="font-mono text-sm font-semibold">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}
