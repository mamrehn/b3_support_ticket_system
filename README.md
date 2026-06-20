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
| Filius-Basis-URL + Szenario-Schema | `supabase/seed.sql` | `https://<filius-clone>/?scenario=<id>` ersetzen |
| Team-Passwörter | `src/lib/auth.ts` (Konstante `USERS`) | ersetzen und auf Papier drucken |
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
   - `supabase/seed.sql` – die sechs Ticket-Vorlagen (re-runnable).
3. **Database → Replication / Realtime**: prüfen, dass `tickets` aktiv ist
   (durch `schema.sql` bereits gesetzt).
4. URL und **anon**-Key aus **Project Settings → API** übernehmen.

Optional (mehr Schreibschutz, README §10): `supabase/optional-hardening.sql`.

---

## Rollen & Schreibschutz (§2)

**Bewusste Entscheidung: keine serverseitige Auth.** Die Anmeldung ist eine
clientseitige Prüfung gegen `USERS` in `src/lib/auth.ts`; die Session liegt im
`sessionStorage` (refresh-fest). Der anon-Key und diese Zuordnung sind im
öffentlichen Bundle sichtbar – das ist akzeptiert. Ziel ist nur, das Schreiben
in ein *fremdes* Ticket etwas zu erschweren.

- Jeder angemeldete Nutzer **liest alle** Tickets.
- Ein **Team** bearbeitet **nur sein eigenes** Ticket (`team1`→#1 … `team6`→#6).
- **teacher** bearbeitet **jedes** Ticket und sieht die Admin-Aktionen.

Standard-Zugangsdaten (in `src/lib/auth.ts` ersetzen!): `team1 … team6` mit den
dort hinterlegten Passwörtern, `teacher` / `datasol-lehrer-2026`.

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
- **Ticket-Detail**: Störungsmeldung, optionaler Hinweis, Button „Szenario in
  Filius öffnen", Diagnose-Formular (Schicht, Werkzeuge, Problem, Lösung,
  optionaler Trace), **Speichern**.
- **„… weiterleiten"** wird erst aktiv, wenn Schicht + ≥1 Werkzeug + Problem +
  Lösung gefüllt sind; danach erscheint die **Musterlösung** (bleibt bis Reset).
- **Lehrkraft**: jedes Ticket bearbeiten, **Zurücksetzen** (leert nur die
  Eingaben), **PDF-Export** (Druckansicht → „Als PDF speichern"). Das Board
  läuft per **Realtime** live mit.

---

## Datenmodell

Eine Tabelle `tickets`, eine vorab eingefügte Zeile je Ticket (1–6) mit fester
Definition **und** aktueller Einreichung. Reset leert nur die Einreichungs-
spalten. Details siehe `supabase/schema.sql`.
