import type { ReactNode } from 'react';

type Tone = 'warning' | 'error' | 'info';

const TONES: Record<Tone, string> = {
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  error: 'border-red-300 bg-red-50 text-red-900',
  info: 'border-accent-200 bg-accent-50 text-accent-800',
};

export function Banner({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${TONES[tone]} print:hidden`}>
      {children}
    </div>
  );
}
