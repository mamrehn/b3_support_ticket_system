import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Ticket } from '../lib/types';

interface TicketsContextValue {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  /** true sobald die Realtime-Subscription aktiv ist (Live-Anzeige im Board). */
  live: boolean;
  refetch: () => Promise<void>;
  getTicket: (id: number) => Ticket | undefined;
}

const TicketsContext = createContext<TicketsContextValue | undefined>(undefined);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  // Alle Lese-/Realtime-Zugriffe sind auf die eigene Klasse beschränkt.
  const classId = session?.classId ?? null;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const mounted = useRef(true);

  const refetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError(
        'Supabase ist nicht konfiguriert. Bitte VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY hinterlegen.',
      );
      setLoading(false);
      return;
    }
    if (!classId) {
      setTickets([]);
      setError(null);
      setLoading(false);
      return;
    }
    const { data, error: err } = await supabase
      .from('tickets')
      .select('*')
      .eq('class_id', classId)
      .order('id', { ascending: true });

    if (!mounted.current) return;
    if (err) {
      setError(`Tickets konnten nicht geladen werden: ${err.message}`);
    } else {
      setError(null);
      setTickets((data ?? []) as Ticket[]);
    }
    setLoading(false);
  }, [classId]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    void refetch();

    if (!isSupabaseConfigured || !classId) return;

    // Realtime: das Board läuft live mit, wenn ein Team speichert (README §1, §4.4).
    // Das Event dient nur als Auslöser – die Zeilen werden per refetch() frisch
    // geladen. Grund: payload.new ist bei großen Zeilen unvollständig (TOAST-
    // Spalten wie der Screenshot in trace_note fehlen bei UPDATEs, Payload-
    // Limit ~1 MiB). Den unvollständigen Datensatz zu übernehmen würde den
    // Trace clientseitig "löschen" – und beim nächsten Speichern auch in der DB.
    const channel = supabase
      .channel(`tickets-realtime-${classId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `class_id=eq.${classId}`,
        },
        () => void refetch(),
      )
      .subscribe((status) => {
        if (mounted.current) setLive(status === 'SUBSCRIBED');
      });

    return () => {
      mounted.current = false;
      setLive(false);
      void supabase.removeChannel(channel);
    };
  }, [refetch, classId]);

  const getTicket = useCallback(
    (id: number) => tickets.find((t) => t.id === id),
    [tickets],
  );

  const value = useMemo<TicketsContextValue>(
    () => ({ tickets, loading, error, live, refetch, getTicket }),
    [tickets, loading, error, live, refetch, getTicket],
  );

  return <TicketsContext.Provider value={value}>{children}</TicketsContext.Provider>;
}

export function useTickets(): TicketsContextValue {
  const ctx = useContext(TicketsContext);
  if (!ctx) throw new Error('useTickets muss innerhalb von <TicketsProvider> verwendet werden');
  return ctx;
}
