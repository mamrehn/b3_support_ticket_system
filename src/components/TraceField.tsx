import { useRef, useState } from 'react';
import { fileToCompressedDataUrl } from '../lib/image';

// Wireshark-Trace als Screenshot (Bild), nicht als Text/pcap. Der Screenshot
// wird komprimiert und als Data-URL im Feld gespeichert.
export function TraceField({
  value,
  editable,
  onChange,
}: {
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasImage = !!value;

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErr('Bitte einen Screenshot als Bilddatei auswählen.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      onChange(await fileToCompressedDataUrl(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Bild konnte nicht verarbeitet werden.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Wireshark-Trace <span className="font-normal text-gray-400">(optional, Screenshot)</span>
      </label>

      {editable && (
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          So geht&apos;s: In der Simulation oben auf das{' '}
          <span className="rounded border border-gray-300 bg-gray-50 px-1">🔍</span> („Datenverkehr")
          klicken – der Trace öffnet sich. Davon einen ganz normalen Screenshot machen und hier
          hochladen.
        </p>
      )}

      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      )}

      {hasImage ? (
        <div className="mt-2">
          <a href={value} target="_blank" rel="noopener noreferrer" title="In voller Größe öffnen">
            <img
              src={value}
              alt="Wireshark-Trace Screenshot"
              className="max-h-[40rem] w-full rounded-md border border-gray-200 object-contain shadow-sm"
            />
          </a>
          {editable && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                {busy ? 'Wird verarbeitet …' : 'Anderen Screenshot wählen'}
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                disabled={busy}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                Screenshot entfernen
              </button>
            </div>
          )}
        </div>
      ) : editable ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm font-medium text-gray-600 transition hover:border-accent-400 hover:bg-accent-50/40 disabled:opacity-50"
        >
          {busy ? 'Bild wird verarbeitet …' : '📷 Screenshot hochladen'}
        </button>
      ) : (
        <p className="mt-2 text-sm text-gray-400">Kein Trace hinterlegt.</p>
      )}

      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}
