import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Ob echte Zugangsdaten vorliegen. Ist false, zeigt die App einen Hinweis
// statt zu crashen (z. B. lokal ohne .env).
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // Hilfreich beim lokalen Start; im Produktivbuild kommen die Werte aus den Secrets.
  console.warn(
    'Supabase ist nicht konfiguriert. Bitte VITE_SUPABASE_URL und ' +
      'VITE_SUPABASE_ANON_KEY setzen (.env lokal bzw. GitHub-Secrets im Build).',
  );
}

// Platzhalter verhindern einen harten Crash, falls die Env fehlt.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
);
