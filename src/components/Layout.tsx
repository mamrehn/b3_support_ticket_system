import type { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { Banner } from './Banner';
import { isSupabaseConfigured } from '../lib/supabase';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {!isSupabaseConfigured && (
          <div className="mb-5">
            <Banner tone="warning">
              <span className="font-medium">Supabase ist nicht konfiguriert.</span>{' '}
              Es werden keine Tickets geladen. Bitte <code>VITE_SUPABASE_URL</code> und{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> hinterlegen (lokal in <code>.env</code>,
              im Produktivbuild als GitHub-Secrets).
            </Banner>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
