import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { ClassSet } from '../lib/api';

// Druckbare Zugangszettel eines Klassen-Sets: 4 Zettel je DIN-A4-Seite,
// jeder mit großer farbiger Teamnummer, QR-Code, (Kurz-)Link, Benutzername
// und Passwort. Der Kopfbereich (Klassen-Code, Login-Link, Kurzlink-Feld)
// ist nur am Bildschirm sichtbar – gedruckt werden ausschließlich die Zettel.
// Wird nach dem Erstellen (Register) und für die Lehrkraft erneut
// (/credentials) gezeigt.

// Login-Link mit vorausgefülltem Klassen-Code – funktioniert unter dem
// GitHub-Pages-Basispfad, weil pathname erhalten bleibt (HashRouter).
export function loginUrlFor(classCode: string): string {
  return `${window.location.origin}${window.location.pathname}#/login?class=${classCode}`;
}

// Signalfarbe je Teamnummer – als TEXTfarbe, weil viele Browser
// Hintergrundfarben standardmäßig nicht mitdrucken.
const TEAM_COLORS: Record<number, string> = {
  1: 'text-red-600',
  2: 'text-blue-600',
  3: 'text-green-600',
  4: 'text-orange-600',
  5: 'text-purple-600',
  6: 'text-teal-600',
  7: 'text-pink-600',
};

// Kurzlink pro Klasse merken (localStorage), damit er beim erneuten
// Aufruf/Drucken über /credentials nicht neu eingetippt werden muss.
function shortLinkStorageKey(classCode: string): string {
  return `datasol-shortlink-${classCode}`;
}

function loadShortLink(classCode: string): string {
  try {
    return localStorage.getItem(shortLinkStorageKey(classCode)) ?? '';
  } catch {
    return '';
  }
}

function useQrDataUrl(text: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(text, { margin: 1, width: 384, errorCorrectionLevel: 'M' })
      .then((dataUrl) => {
        if (!cancelled) setUrl(dataUrl);
      })
      .catch((e) => console.error('QR-Code konnte nicht erzeugt werden:', e));
    return () => {
      cancelled = true;
    };
  }, [text]);
  return url;
}

export function CredentialSheet({ classSet }: { classSet: ClassSet }) {
  const loginUrl = loginUrlFor(classSet.classCode);
  // Der QR-Code führt IMMER direkt zum Login (voller Link) – unabhängig vom
  // Kurzlink, damit die Zettel auch funktionieren, falls der Kürzer ausfällt.
  const qr = useQrDataUrl(loginUrl);
  const [copied, setCopied] = useState(false);
  const [shortLink, setShortLink] = useState(() => loadShortLink(classSet.classCode));

  const updateShortLink = (value: string) => {
    setShortLink(value);
    try {
      localStorage.setItem(shortLinkStorageKey(classSet.classCode), value.trim());
    } catch {
      // Speichern ist nur Komfort – Eingabe funktioniert trotzdem.
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(loginUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Kopieren fehlgeschlagen:', e);
    }
  };

  // Auf den Zetteln steht der Kurzlink (falls angegeben), sonst der volle Link.
  const slipLink = shortLink.trim() || loginUrl;

  return (
    <div>
      {/* Kopf: Klassen-Code + Link + Kurzlink-Feld – NUR Bildschirm */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Klassen-Code
            </p>
            <p className="mt-1 font-mono text-4xl font-bold tracking-[0.3em] text-gray-900">
              {classSet.classCode}
            </p>
            {classSet.classLabel && (
              <p className="mt-1 text-sm text-gray-600">{classSet.classLabel}</p>
            )}
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Login-Link (Code bereits ausgefüllt)
            </p>
            <p className="mt-1 break-all font-mono text-xs text-gray-700">{loginUrl}</p>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="mt-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {copied ? 'Kopiert ✓' : 'Link kopieren'}
            </button>
          </div>
          {qr && (
            <figure className="shrink-0 text-center">
              <img
                src={qr}
                alt={`QR-Code zum Login mit Klassen-Code ${classSet.classCode}`}
                className="h-36 w-36 rounded-md border border-gray-200"
              />
              <figcaption className="mt-1 text-xs text-gray-500">Scannen → Anmeldung</figcaption>
            </figure>
          )}
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <label htmlFor="short-link" className="block text-sm font-medium text-gray-700">
            Kurzlink für die Zettel <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="short-link"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={shortLink}
            onChange={(e) => updateShortLink(e.target.value)}
            placeholder="z. B. t1p.de/8b-netz"
            className="mt-1 w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600"
          />
          <p className="mt-1 text-xs leading-relaxed text-gray-400">
            Vor dem Druck eintragen: einen eigenen Kurzlink (z. B. über t1p.de oder
            kurzelinks.de) auf den obigen Login-Link zeigen lassen – auf den Zetteln erscheint
            dann der Kurzlink statt der langen Adresse. Der QR-Code führt immer direkt zum Login.
          </p>
        </div>
      </div>

      {/* Zettel: 4 je DIN-A4-Seite (2 × 2), gestrichelte Ränder = Schnittlinien */}
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500 print:hidden">
        Zugangszettel – 4 je A4-Seite, ausschneiden und an die Teams verteilen
      </p>
      <ul className="mt-2 grid gap-3 sm:grid-cols-2 print:mt-0 print:grid-cols-2 print:gap-x-4 print:gap-y-3">
        {classSet.credentials.map((c) => {
          const isTeacher = c.role === 'teacher';
          const color = isTeacher
            ? 'text-gray-800'
            : (TEAM_COLORS[c.ticketId ?? 0] ?? 'text-gray-800');
          return (
            <li
              key={c.username}
              className="flex break-inside-avoid flex-col rounded-lg border-2 border-dashed border-gray-400 bg-white p-4 print:h-[12.4cm] print:rounded-none print:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`block text-8xl font-black leading-none ${color}`}
                    aria-hidden
                  >
                    {isTeacher ? 'L' : c.ticketId}
                  </span>
                  <span className="mt-2 block text-base font-bold text-gray-900">
                    {isTeacher ? 'Lehrkraft' : `Team ${c.ticketId}`}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {isTeacher ? 'DataSol IT-Support' : `DataSol IT-Support · Ticket #${c.ticketId}`}
                  </span>
                </div>
                {qr && (
                  <img
                    src={qr}
                    alt=""
                    aria-hidden
                    className="h-28 w-28 shrink-0 rounded border border-gray-200 print:h-[3.6cm] print:w-[3.6cm]"
                  />
                )}
              </div>

              <dl className="mt-4 space-y-1.5 text-sm print:mt-6 print:text-base">
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-gray-500">Link:</dt>
                  <dd className="break-all font-mono font-semibold text-gray-900">{slipLink}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-gray-500">Benutzername:</dt>
                  <dd className="font-mono text-lg font-bold text-gray-900">{c.username}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-gray-500">Passwort:</dt>
                  <dd className="font-mono text-lg font-bold tracking-[0.3em] text-gray-900">
                    {c.password}
                  </dd>
                </div>
              </dl>

              {/* Sicherheitsnetz, falls Link/QR nicht genutzt werden können:
                  der Klassen-Code lässt sich auch von Hand eintippen. */}
              <p className="mt-auto pt-3 text-[10px] text-gray-400">
                Falls der Link nicht klappt: Seite öffnen und Klassen-Code{' '}
                <span className="font-mono font-semibold">{classSet.classCode}</span> eingeben.
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
