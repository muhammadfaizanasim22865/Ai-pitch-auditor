import { UploadArea } from './UploadArea';
import { ShieldCheck, Search, FileSearch, Gavel, BarChart3 } from 'lucide-react';

interface LandingPageProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
  onAnalyze: () => void;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

export function LandingPage({
  onFileSelect,
  selectedFile,
  onClearFile,
  onAnalyze,
  isUploading,
  uploadProgress,
  error,
}: LandingPageProps) {
  return (
    <div className="relative">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950" />

      <div className="relative mx-auto max-w-4xl px-4 pt-32 pb-20 sm:px-6 sm:pt-40 lg:px-8">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-ink-850/60 px-4 py-1.5">
            <span className="flex h-1.5 w-1.5">
              <span className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-lime-400 opacity-60" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-lime-400" />
            </span>
            <span className="font-mono text-[11px] tracking-widest text-ink-300">
              INVESTOR INTELLIGENCE · CLAIM VERIFICATION
            </span>
          </div>

          <h1 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            AI PITCH{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-lime-400 to-cyan-400 bg-clip-text text-transparent">
                AUDITOR
              </span>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-200 sm:text-xl">
            Don't just hear the pitch.{' '}
            <span className="font-semibold text-white">Verify it.</span>
          </p>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-300">
            AI-powered verification of founder claims, evidence, and investor
            risk. Upload a pitch recording and receive a forensic analysis with
            credibility scoring, evidence-backed verdicts, and cross-examination
            questions.
          </p>
        </div>

        {/* Upload */}
        <div className="mx-auto mt-12 max-w-2xl">
          <UploadArea
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
            onClearFile={onClearFile}
            onAnalyze={onAnalyze}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            error={error}
          />
        </div>

        {/* Pipeline */}
        <div className="mx-auto mt-20 max-w-3xl">
          <div className="mb-6 text-center">
            <span className="font-mono text-[11px] tracking-widest text-ink-400">
              VERIFICATION PIPELINE
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PipelineStep
              icon={ShieldCheck}
              label="Transcribe"
              description="Speech to text"
            />
            <PipelineStep
              icon={Search}
              label="Extract Claims"
              description="Identify facts"
            />
            <PipelineStep
              icon={FileSearch}
              label="Search Evidence"
              description="External sources"
            />
            <PipelineStep
              icon={Gavel}
              label="Cross-Examine"
              description="Investor questions"
            />
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={FileSearch}
            title="Evidence-Backed"
            description="Every factual claim is checked against external sources with transparent evidence."
          />
          <FeatureCard
            icon={BarChart3}
            title="Credibility Scoring"
            description="A weighted score reflects how well the pitch holds up under verification."
          />
          <FeatureCard
            icon={Gavel}
            title="Cross-Examiner"
            description="Generated questions an investor should ask to probe remaining gaps."
          />
        </div>
      </div>
    </div>
  );
}

function PipelineStep({
  icon: Icon,
  label,
  description,
}: {
  icon: typeof ShieldCheck;
  label: string;
  description: string;
}) {
  return (
    <div className="card card-hover flex flex-col items-center p-4 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-ink-800">
        <Icon className="h-5 w-5 text-cyan-400" />
      </div>
      <p className="font-display text-sm font-medium text-white">{label}</p>
      <p className="mt-0.5 text-xs text-ink-400">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="card card-hover p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-lime-500/15 bg-lime-500/[0.06]">
        <Icon className="h-4.5 w-4.5 text-lime-400" />
      </div>
      <h4 className="font-display text-sm font-semibold text-white">{title}</h4>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-300">
        {description}
      </p>
    </div>
  );
}
