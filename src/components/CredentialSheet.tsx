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

// Für den PDF-Dateinamen (Browser verwenden document.title beim „Als PDF
// speichern"): Umlaute umschreiben, alles andere auf A-Za-z0-9 und "-" eindampfen.
function sanitizeForFilename(s: string): string {
  return s
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
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
  // Spickschutz: Zettel ohne Link & QR-Code drucken – Teams/Passwörter lassen
  // sich so schon vorab austeilen, ohne die Adresse zu verraten.
  const [noLinks, setNoLinks] = useState(false);

  // PDF-Dateiname beim Drucken: "DataSol-Zugangszettel-<Code>[-<Name>][-ohne-Link]".
  useEffect(() => {
    const prev = document.title;
    const parts = ['DataSol-Zugangszettel', classSet.classCode];
    const label = sanitizeForFilename(classSet.classLabel ?? '');
    if (label) parts.push(label);
    if (noLinks) parts.push('ohne-Link');
    document.title = parts.join('-');
    return () => {
      document.title = prev;
    };
  }, [classSet.classCode, classSet.classLabel, noLinks]);

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
      {/* Beim Druck der Zettel: randlose Seite – die Schnittlinien (ein Kreuz
          je A4-Blatt) übernehmen die Aufteilung, maximale Breite für den Link.
          Gilt nur, solange diese Komponente gemountet ist (Register /
          Credentials); das Lernblatt (PrintView) behält seinen Seitenrand. */}
      <style>{'@media print { @page { margin: 0; } }'}</style>

      {/* Kopf: Klassen-Code + Link + Kurzlink-Feld – NUR Bildschirm */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Klassen-Code
            </p>
            <p className="mt-1 font-mono text-4xl font-bold tracking-widest text-gray-900">
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

          <label className="mt-4 flex items-start gap-2">
            <input
              type="checkbox"
              checked={noLinks}
              onChange={(e) => setNoLinks(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-600"
            />
            <span className="text-sm">
              <span className="font-medium text-gray-800">
                Version ohne Link &amp; QR-Code (Spickschutz)
              </span>
              <span className="block text-xs leading-relaxed text-gray-500">
                Zettel enthalten nur Teamnummer, Benutzername, Passwort und Klassen-Code –
                so lassen sich Einteilung und Passwörter schon vorab austeilen, ohne die
                Adresse zu verraten. Den Link zeigen Sie später (Tafel/Beamer) oder drucken
                die Voll-Version.
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Zettel: 4 je DIN-A4-Seite (2 × 2). Im Druck randlos und ohne
          Einzelrahmen – nur ein Schnittkreuz pro Blatt: die linke Spalte
          zeichnet die senkrechte, die obere Reihe die waagerechte Linie. */}
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500 print:hidden">
        Zugangszettel – 4 je A4-Seite, am Kreuz auseinanderschneiden
      </p>
      <ul className="mt-2 grid gap-3 sm:grid-cols-2 print:mt-0 print:grid-cols-2 print:gap-0">
        {classSet.credentials.map((c, i) => {
          const isTeacher = c.role === 'teacher';
          const color = isTeacher
            ? 'text-gray-800'
            : (TEAM_COLORS[c.ticketId ?? 0] ?? 'text-gray-800');
          const cutLines = `${i % 2 === 0 ? 'print:border-r ' : ''}${i % 4 < 2 ? 'print:border-b' : ''}`;
          return (
            <li
              key={c.username}
              className={`flex break-inside-avoid flex-col rounded-lg border-2 border-dashed border-gray-400 bg-white p-4 print:h-[14.7cm] print:rounded-none print:border-0 print:p-6 ${cutLines}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {/* Quer durchs Klassenzimmer erkennbar: 7 cm Schriftgrad,
                      als Inline-Stil in cm – wirkt identisch am Bildschirm
                      (≈ 264 px) und auf Papier. Die Ziffer IST die Team-
                      Kennung – keine redundanten "Team 7"-/"Ticket #7"-Zeilen. */}
                  <span
                    className={`block font-black leading-none ${color}`}
                    aria-label={isTeacher ? 'Lehrkraft' : `Team ${c.ticketId}`}
                    style={{ fontSize: '7cm' }}
                  >
                    {isTeacher ? 'L' : c.ticketId}
                  </span>
                  {isTeacher && (
                    <span className="mt-2 block text-base font-bold text-gray-900">
                      Lehrkraft
                    </span>
                  )}
                </div>
                {qr && !noLinks && (
                  <img
                    src={qr}
                    alt=""
                    aria-hidden
                    className="h-28 w-28 shrink-0 rounded border border-gray-200 print:h-[3.6cm] print:w-[3.6cm]"
                  />
                )}
              </div>

              <div className="mt-4 space-y-1.5 text-sm print:mt-6 print:text-base">
                {/* Link in voller Kartenbreite – so passt der Kurzlink in eine Zeile */}
                {!noLinks && (
                  <p className="break-all">
                    <span className="text-gray-500">Link: </span>
                    <span className="font-mono font-semibold text-gray-900">{slipLink}</span>
                  </p>
                )}
                <dl className="space-y-1.5">
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-gray-500">Benutzername:</dt>
                    <dd className="font-mono text-lg font-bold text-gray-900">{c.username}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-gray-500">Passwort:</dt>
                    {/* dezente Sperrung – 0.3em sah nach Leerzeichen aus */}
                    <dd className="font-mono text-lg font-bold tracking-wide text-gray-900">
                      {c.password}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Branding + Sicherheitsnetz bzw. (ohne Link) Klassen-Code-Hinweis. */}
              <p className="mt-auto pt-3 text-[10px] text-gray-400">
                {noLinks ? (
                  <>
                    DataSol IT-Support · Klassen-Code:{' '}
                    <span className="font-mono font-semibold">{classSet.classCode}</span> – die
                    Adresse gibt die Lehrkraft bekannt.
                  </>
                ) : (
                  <>
                    DataSol IT-Support · Falls der Link nicht klappt: Seite öffnen und
                    Klassen-Code{' '}
                    <span className="font-mono font-semibold">{classSet.classCode}</span>{' '}
                    eingeben.
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
