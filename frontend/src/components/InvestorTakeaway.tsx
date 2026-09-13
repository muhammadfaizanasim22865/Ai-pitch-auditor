import { TrendingUp, AlertTriangle, Info } from 'lucide-react';
import type { AnalyzeResponse } from '@/types';

interface InvestorTakeawayProps {
  data: AnalyzeResponse;
}

export function InvestorTakeaway({ data }: InvestorTakeawayProps) {
  const { credibility_score, claims, claim_count } = data;
  const score = credibility_score.score;

  const supported = claims.filter((c) => c.verdict === 'TRUE');
  const contradicted = claims.filter((c) => c.verdict === 'FALSE');
  const unverified = claims.filter((c) => c.verdict === 'UNVERIFIED');
  const opinions = claims.filter((c) => c.verdict === 'OPINION');

  let tone: 'positive' | 'caution' | 'neutral' = 'neutral';
  let icon = Info;
  let colorClass = 'text-cyan-400';
  let bgClass = 'border-cyan-500/20 bg-cyan-500/[0.04]';

  if (score !== null) {
    if (score >= 60) {
      tone = 'positive';
      icon = TrendingUp;
      colorClass = 'text-lime-400';
      bgClass = 'border-lime-500/20 bg-lime-500/[0.04]';
    } else if (score < 40) {
      tone = 'caution';
      icon = AlertTriangle;
      colorClass = 'text-red-400';
      bgClass = 'border-red-500/20 bg-red-500/[0.04]';
    }
  }

  const Icon = icon;

  const buildTakeaway = () => {
    const parts: string[] = [];

    if (claim_count === 0) {
      return 'No verifiable claims were extracted from this pitch. Consider asking the founder for more specific, quantifiable statements.';
    }

    if (score !== null) {
      parts.push(
        `The pitch earned a credibility score of ${score} out of 100.`,
      );
    } else {
      parts.push(
        'A credibility score could not be calculated because no claims had evidence-backed verdicts.',
      );
    }

    if (supported.length > 0) {
      parts.push(
        `${supported.length} of ${claim_count} claim${supported.length > 1 ? 's' : ''} were supported by external evidence.`,
      );
    }

    if (contradicted.length > 0) {
      parts.push(
        `${contradicted.length} claim${contradicted.length > 1 ? 's were' : ' was'} contradicted by available evidence — a significant red flag.`,
      );
    }

    if (unverified.length > 0) {
      parts.push(
        `${unverified.length} claim${unverified.length > 1 ? 's remain' : ' remains'} unverified. Absence of evidence does not confirm falsehood, but these warrant direct follow-up.`,
      );
    }

    if (opinions.length > 0) {
      parts.push(
        `${opinions.length} statement${opinions.length > 1 ? 's were' : ' was'} classified as opinion rather than factual claim.`,
      );
    }

    if (tone === 'caution') {
      parts.push(
        'Investors should request supporting documentation for contradicted and unverified claims before proceeding.',
      );
    } else if (tone === 'positive') {
      parts.push(
        'The pitch demonstrates strong factual grounding. Standard due diligence is still recommended.',
      );
    } else {
      parts.push(
        'Review the Cross-Examiner questions to guide due diligence conversations.',
      );
    }

    return parts.join(' ');
  };

  return (
    <div className={`card border ${bgClass} p-6 sm:p-8 animate-fade-in-up`}>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg border ${bgClass}`}
        >
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-white">
            Investor Takeaway
          </h3>
          <p className="text-sm text-ink-300">
            Bottom-line assessment for due diligence
          </p>
        </div>
      </div>
      <p className="mt-5 text-[15px] leading-relaxed text-ink-100">
        {buildTakeaway()}
      </p>
    </div>
  );
}
