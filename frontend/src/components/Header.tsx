import { ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-ink-950/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-lime-500/20 blur-md rounded-lg" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-lime-500/30 bg-ink-900">
                <ShieldCheck className="h-5 w-5 text-lime-400" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-sm font-semibold tracking-wider text-white">
                AI PITCH AUDITOR
              </span>
              <span className="font-mono text-[10px] tracking-widest text-ink-300">
                FORENSIC CLAIM VERIFICATION
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <span className="font-mono text-xs text-ink-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime-400 mr-2 align-middle" />
              SYSTEM ONLINE
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
