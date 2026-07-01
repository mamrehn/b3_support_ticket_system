# DataSol IT-Support

Ein kleines Klassenraum-Ticketsystem für eine Netzwerk-Unterrichtsstunde.
Schülerteams (1–6) diagnostizieren je eine Netzwerkstörung in einem **externen
Filius-Simulator** (per Deeplink) und tragen ihre Befunde hier ein. Ein
**Lehrer-Konto** sieht alle Tickets live, setzt das System zwischen den Klassen
zurück und exportiert ein kombiniertes PDF-Lernblatt.

Stack: **Vite + React + TypeScript + Tailwind CSS**, Backend ausschließlich
**Supabase** (Postgres + Realtime), statisches Deployment auf **GitHub Pages**.

---

## Vor dem Build anzupassen („Fill-ins")

| Stelle | Datei | Was |
| --- | --- | --- |
| Supabase URL + anon-Key | `.env` (lokal) / GitHub-Secrets (Build) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Filius-Deeplink-Schema | `supabase/seed.sql` | `https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_<id>` (`<id>` = Ticket-ID) |
| Passwörter (Teams + Lehrkraft) | DB-Tabelle `teams` (siehe `supabase/rpc-auth.sql`) | echte Passwörter eintragen und auf Papier drucken |
| Repo-Name (Pages-Basispfad) | `vite.config.ts` (`base`) | aktuell `/b3_support_ticket_system/` |
| Ticket-Texte 2/3/5/6 | `supabase/seed.sql` | bei Bedarf durch echte Paket-Texte ersetzen |

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
   - `supabase/schema.sql` – Tabelle, RLS-Policies, Realtime.
   - `supabase/seed.sql` – die Ticket-Vorlagen (re-runnable).
   - `supabase/rpc-auth.sql` – serverseitige Auth + Schreibschutz (siehe §2).
3. In `rpc-auth.sql` den auskommentierten `insert into teams …` mit den echten
   Passwörtern befüllen – **inkl. der `teacher`-Zeile** – und ausführen.
4. **Database → Replication / Realtime**: prüfen, dass `tickets` aktiv ist
   (durch `schema.sql` bereits gesetzt).
5. URL und **anon**-Key aus **Project Settings → API** übernehmen.

**Bestehende Installationen aktualisieren:** `schema.sql` und `rpc-auth.sql`
einfach erneut ausführen (beide sind idempotent). Sie ziehen die Spalten
`diagnosis_path` (dokumentierter Weg durchs Ablaufdiagramm) und `opened_at`
(Startzeit der Bearbeitung) nach und ersetzen `submit_ticket` durch die neue
Signatur inkl. `open_ticket`.

---

## Rollen & Schreibschutz (§2 + §10 – serverseitig)

Die Anmeldung wird **serverseitig** geprüft: die RPC `app_login` vergleicht
Benutzername+Passwort gegen die DB-Tabelle `teams` (RLS gesperrt, niemand liest
die Passwörter). **Passwörter liegen NICHT im Bundle.** Die Session liegt im
`sessionStorage` (refresh-fest) und hält das eigene Passwort nur clientseitig,
damit es den Schreib-RPCs mitgegeben werden kann.

- Jeder angemeldete Nutzer **liest alle** Tickets (offene SELECT-Policy → auch Realtime).
- Schreiben läuft ausschließlich über `submit_ticket` / `reset_tickets`
  (SECURITY DEFINER). Direktes anon-`UPDATE` ist per RLS unterbunden.
- Ein **Team** schreibt **nur sein eigenes** Ticket (Zuordnung über
  `teams.ticket_id`, z. B. `user1`→#1 … `user7`→#7) – serverseitig erzwungen.
  Die **Lehrkraft** (`teacher`) schreibt jedes Ticket, darf zurücksetzen und
  sieht die Admin-Aktionen.

Zugangsdaten werden in der Tabelle `teams` gepflegt (siehe `supabase/rpc-auth.sql`)
und auf Papier verteilt. Determinierte Schüler:innen müssten für ein fremdes
Ticket dessen Papier-Passwort kennen – ohne echte per-Nutzer-Accounts.

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

- **Login** → **Ticket-Übersicht** (Board) mit Status-Chips
  (`Offen` / `In Bearbeitung` / `Erledigt`); das eigene Ticket ist markiert.
  Die Spalte **Bearbeitungszeit** zeigt die Zeit vom ersten Öffnen des Tickets
  durch das Team bis zum letzten Speichern (läuft live mit, solange noch nie
  gespeichert wurde) – so ist sichtbar, wie schnell ein Ticket gelöst wurde.
- **Ticket-Detail**: Störungsmeldung des meldenden Kollegen, optionaler Hinweis,
  prominenter Button **„Netzwerk in Echtzeit analysieren"** (der rote Faden zur
  Lösung), Diagnose-Formular mit **geführter Fehlersuche entlang des
  Ablaufdiagramms** aus `info-sheet-troubleshooting.md` (Raute für Raute
  beantworten, jeder Schritt wird als Protokoll dokumentiert), Schicht,
  Werkzeuge, Problem, Lösung, optionaler **Wireshark-Trace als
  Screenshot-Upload**, **Speichern**.
- **„… weiterleiten"** wird erst aktiv, wenn das Ablaufdiagramm bis zu einem
  Endpunkt durchlaufen ist **und** Schicht + ≥1 Werkzeug + Problem + Lösung
  gefüllt sind; danach **kommentiert eine erfahrene Kollegin** die Diagnose
  (Abgleich mit der Musterlösung inkl. Diagnoseweg, bleibt bis Reset).
- **Lehrkraft**: jedes Ticket bearbeiten, **Zurücksetzen** (leert nur die
  Eingaben), **PDF-Export** (Druckansicht → „Als PDF speichern"). Das Board
  läuft per **Realtime** live mit.

---

## Datenmodell

Eine Tabelle `tickets`, eine vorab eingefügte Zeile je Ticket mit fester
Definition **und** aktueller Einreichung. Reset leert nur die Einreichungs-
spalten. Details siehe `supabase/schema.sql`.
