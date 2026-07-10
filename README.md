# DataSol IT-Support

Ein kleines Klassenraum-Ticketsystem für eine Netzwerk-Unterrichtsstunde.
Schülerteams (1–7) diagnostizieren je eine Netzwerkstörung in einem **externen
Filius-Simulator** (per Deeplink) und tragen ihre Befunde hier ein. Ein
**Lehrer-Konto** sieht alle Tickets live, setzt das System zurück und
exportiert ein kombiniertes PDF-Lernblatt.

**Mehrklassen-Betrieb:** Jede Lehrkraft erstellt sich über die Seite
**„Klassen-Set erstellen"** (`#/register`) ihr eigenes unabhängiges Set.
Diese URL ist **bewusst nirgends in der App verlinkt** – sie wird nur als
Einladungslink unter Lehrkräften geteilt (z. B. im Lehrer-Chat), damit
Schüler:innen nicht auf die Idee kommen, sich selbst Klassen anzulegen.
Ein Set besteht aus einem **Klassen-Code**, einem
Lehrkraft-Konto und **user1 … user7** mit generierten Passwörtern (eindeutig
unterscheidbare Großbuchstaben ohne I/O; Teams: 4 Zeichen, Lehrkraft:
6 Zeichen) sowie einem frischen Satz der 7 Tickets. Beliebig viele Klassen laufen gleichzeitig und unabhängig; kein
manuelles SQL pro Lehrkraft. Die Zugangsdaten erscheinen als druckbare
Zugangszettel (4 je DIN-A4-Seite: große farbige Teamnummer, QR-Code,
Link/Kurzlink, Benutzername, Passwort; ein optionaler Kurzlink lässt sich vor
dem Druck eintragen) – und sind für die Lehrkraft jederzeit erneut abrufbar
(Board → „Zugangsdaten & QR-Code"). Klassen-Sets ohne Aktivität werden nach
**100 Tagen** automatisch gelöscht (pg_cron).

Stack: **Vite + React + TypeScript + Tailwind CSS**, Backend ausschließlich
**Supabase** (Postgres + Realtime), statisches Deployment auf **GitHub Pages**.

---

## Vor dem Build anzupassen („Fill-ins")

| Stelle | Datei | Was |
| --- | --- | --- |
| Supabase URL + anon-Key | `.env` (lokal) / GitHub-Secrets (Build) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Filius-Deeplink-Schema | `supabase/seed.sql` | `https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_<id>` (`<id>` = Ticket-ID) |
| Repo-Name (Pages-Basispfad) | `vite.config.ts` (`base`) | aktuell `/b3_support_ticket_system/` |
| Ticket-Texte 2/3/5/6 | `supabase/seed.sql` | bei Bedarf durch echte Paket-Texte ersetzen |

Passwörter werden **nicht mehr manuell gepflegt** – sie entstehen pro
Klassen-Set automatisch über die Seite „Klassen-Set erstellen".

---

## Lokale Entwicklung

```bash
cp .env.example .env      # Supabase-Werte eintragen
npm install
npm run dev
```

Ohne gültige `.env` startet die App, zeigt aber einen Hinweis statt Tickets.

Weitere Skripte: `npm run build` (Typecheck + Produktivbuild), `npm run preview`,
`npm run typecheck`.

---

## Supabase einrichten

1. Projekt auf [supabase.com](https://supabase.com) anlegen.
2. Im **SQL Editor** nacheinander ausführen:
   - `supabase/schema.sql` – Tabellen (`ticket_templates`, `classes`, `teams`,
     `tickets`), RLS-Policies, Realtime.
   - `supabase/seed.sql` – die Ticket-Vorlagen (re-runnable).
   - `supabase/rpc-auth.sql` – `create_class` + serverseitige Auth +
     Schreibschutz + Aufräumjob.
3. **Database → Replication / Realtime**: prüfen, dass `tickets` aktiv ist
   (durch `schema.sql` bereits gesetzt).
4. URL und **anon**-Key aus **Project Settings → API** übernehmen.

Konten werden **nicht** mehr per SQL angelegt – jede Lehrkraft erstellt ihr
Klassen-Set selbst über `#/register`.

**Migration von der Einzelklassen-Version:** einfach alle drei Dateien erneut
ausführen. `schema.sql` erkennt die alten Tabellen (ohne `class_id`) und
ersetzt sie – **alte Zugangsdaten und laufende Eingaben gehen dabei bewusst
verloren.** Danach ein frisches Klassen-Set über die App erstellen. Ein
erneutes Ausführen später lässt bestehende Klassen unangetastet (idempotent).

---

## Rollen & Schreibschutz (serverseitig)

Die Anmeldung wird **serverseitig** geprüft: die RPC `app_login` vergleicht
**Klassen-Code + Benutzername + Passwort** gegen die Tabellen `classes`/`teams`
(RLS gesperrt, niemand liest Passwörter oder fremde Codes). Klassen-Code und
Passwort werden dabei unabhängig von Groß-/Kleinschreibung verglichen (beide
bestehen nur aus Großbuchstaben – spart Support, kostet keine Sicherheit).
**Passwörter liegen NICHT im Bundle.** Die Session liegt im `sessionStorage`
(refresh-fest, pro Tab) und hält das eigene Passwort nur clientseitig, damit es
den Schreib-RPCs mitgegeben werden kann.

- Das Frontend lädt und abonniert nur die Tickets der **eigenen Klasse**
  (`class_id`-Filter, auch im Realtime-Kanal).
- Schreiben läuft ausschließlich über `submit_ticket` / `open_ticket` /
  `reset_tickets` (SECURITY DEFINER, je Klasse). Direktes anon-`UPDATE` ist
  per RLS unterbunden.
- Ein **Team** schreibt **nur sein eigenes** Ticket der eigenen Klasse
  (`user1`→#1 … `user7`→#7) – serverseitig erzwungen. Die **Lehrkraft**
  schreibt jedes Ticket ihrer Klasse, darf zurücksetzen, die Zugangsdaten
  erneut abrufen (`list_credentials`) und sieht die Admin-Aktionen.
- `create_class` ist öffentlich aufrufbar (das ist der Zweck des geteilten
  Links), aber ratenbegrenzt (max. 20 neue Klassen/Stunde, max. 500 gesamt).

**Bekannte Grenze (bewusst akzeptiert):** die SELECT-Policy auf `tickets`
bleibt offen, damit Board + Realtime ohne echte Auth funktionieren. Wer den
(öffentlichen) anon-Key aus dem Bundle extrahiert, kann per REST alle Tickets
aller Klassen lesen – inklusive Musterlösungen vor der Freigabe. Für den
Unterrichtseinsatz ist das in Ordnung; echte Abschottung bräuchte
Supabase-Auth mit per-Klasse-Claims.

---

## Deployment auf GitHub Pages (§8)

1. Repository-**Secrets** anlegen (Settings → Secrets and variables → Actions):
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
2. **Settings → Pages → Source = GitHub Actions**.
3. Push auf `main` → Workflow `.github/workflows/deploy.yml` baut und deployt.
4. Erreichbar unter `https://<user>.github.io/b3_support_ticket_system/`.

Die App nutzt `HashRouter`, daher sind Refresh und Deeplinks ohne
SPA-Fallback robust. Bei abweichendem Repo-Namen `base` in `vite.config.ts`
**und** den Pfad in dieser README anpassen.

---

## Bedienung

- **Klassen-Set erstellen** (Lehrkraft, `#/register` – nur per geteiltem
  Einladungslink erreichbar, in der App nicht verlinkt): erzeugt Klassen-Code +
  8 Konten + 7 Tickets und zeigt das druckbare Zugangsdaten-Blatt (QR-Code,
  Login-Link mit vorausgefülltem Code, Zettel zum Ausschneiden). Später
  erneut abrufbar über Board → **„Zugangsdaten & QR-Code"**.
- **Login** (Klassen-Code + Benutzername + Passwort; der Code ist über den
  QR-/Link-Parameter `?class=…` vorausgefüllt) → **Ticket-Übersicht** (Board)
  mit Status-Chips
  (`Offen` / `In Bearbeitung` / `Erledigt`); das eigene Ticket ist markiert.
  Die Spalte **Bearbeitungszeit** zeigt die Zeit vom ersten Öffnen des Tickets
  durch das Team bis zum letzten Speichern (läuft live mit, solange noch nie
  gespeichert wurde) – so ist sichtbar, wie schnell ein Ticket gelöst wurde.
- **Ticket-Detail**: Störungsmeldung des meldenden Kollegen, optionaler Hinweis,
  prominenter Button **„Netzwerk in Echtzeit analysieren"** (der rote Faden zur
  Lösung) und die **geführte Fehlersuche streng nach dem Ablaufdiagramm**:
  Schicht 1 → 2 → 3 → 4 → 7 der Reihe nach prüfen, pro Schicht die eingesetzten
  Werkzeuge abhaken (Pflicht) und „Ja – OK" oder „Nein – Fehler gefunden"
  beantworten. Am Fehler-Endpunkt beschreiben die Teams kurz **Ursache** und
  **Behebung**. Schicht und Werkzeuge werden aus dem Protokoll abgeleitet –
  freie Eingabefelder gibt es nicht mehr. Dazu optionaler **Wireshark-Trace als
  Screenshot-Upload**, **Speichern**.
- **„… weiterleiten"** wird erst aktiv, wenn die Fehler-Schicht im Diagramm
  gefunden und Ursache + Behebung beschrieben sind; danach **kommentiert eine
  erfahrene Kollegin** die Diagnose (Abgleich mit der Musterlösung inkl.
  Prüfprotokoll, bleibt bis Reset).
- **Lehrkraft**: jedes Ticket bearbeiten, **Zurücksetzen** (leert nur die
  Eingaben), **PDF-Export** (Druckansicht → „Als PDF speichern"). Das Board
  läuft per **Realtime** live mit.

---

## Datenmodell

- `ticket_templates` – die 7 Aufgaben-Vorlagen (global, per `seed.sql`).
- `classes` – ein Klassen-Set je Lehrkraft (Code, optionales Label,
  `last_activity` für den Aufräumjob).
- `teams` – 8 Konten je Klasse (user1 … user7 + teacher), Passwörter generiert.
- `tickets` – 7 Zeilen je Klasse: Kopie der Vorlage **und** aktuelle
  Einreichung; Primärschlüssel `(class_id, id)`. Reset leert nur die
  Einreichungsspalten der eigenen Klasse.

Vorlagen-Änderungen wirken nur auf **neu** erstellte Klassen-Sets. Ein
nächtlicher pg_cron-Job löscht Klassen ohne Aktivität seit 100 Tagen (Kaskade
entfernt Konten + Tickets inkl. Screenshots). Details siehe
`supabase/schema.sql` und `supabase/rpc-auth.sql`.
