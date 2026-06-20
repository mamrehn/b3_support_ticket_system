-- =====================================================================
-- DataSol IT-Support – Seed der sechs Ticket-Vorlagen
-- =====================================================================
-- Nach schema.sql ausführen. Re-runnable: aktualisiert NUR die Vorlagen-
-- Spalten, die Schülereingaben (submitted_*, revealed) bleiben unangetastet.
--
-- Die Texte für Ticket 1 und 4 stammen aus der Aufgabenstellung. Tickets
-- 2, 3, 5, 6 sind analog aus dem Ticket-Paket abgeleitet – bei Bedarf hier
-- durch die echten Paket-Texte ersetzen. <filius-clone> durch die Basis-URL
-- des Filius-Klons ersetzen (Szenario-Parameter ?scenario=<id>).
-- ---------------------------------------------------------------------

insert into tickets (id, title, reporter_text, concept_hint, filius_deeplink, correct_layer, correct_tools, model_problem, model_solution) values
(1, 'Ticket #1 – Keine Netzwerkverbindung',
 'Mein Rechner hat überhaupt keine Netzwerkverbindung mehr – kein Intranet, gar nichts. Gestern lief noch alles.',
 null,
 'https://<filius-clone>/?scenario=1',
 'Schicht 1 – Bitübertragung',
 array['connview','ipconfig'],
 'Kein Link – die physische Verbindung fehlte.',
 'Kabel wieder angeschlossen / an korrekten Switch-Port gesteckt.'),

(2, 'Ticket #2 – Anderes Netz nicht erreichbar',
 'Die Kollegen direkt neben mir kann ich anpingen, aber an die Server in der anderen Abteilung komme ich nicht heran. Das Internet geht auch nicht.',
 'Pakete in fremde Netze schickt ein PC an sein Standardgateway (den Router). Fehlt diese Adresse, bleibt nur das eigene Teilnetz erreichbar.',
 'https://<filius-clone>/?scenario=2',
 'Schicht 3 – Vermittlung',
 array['ipconfig','ping','tracert'],
 'Lokales Netz erreichbar, andere Netze nicht → das Standardgateway war nicht/falsch eingetragen.',
 'Korrektes Standardgateway (Router-IP) laut Netzplan im Client eingetragen.'),

(3, 'Ticket #3 – Manche Rechner erreichbar, andere nicht',
 'Ein paar Rechner im Haus erreiche ich problemlos, andere im gleichen Büro überhaupt nicht. Das ergibt für mich keinen Sinn.',
 null,
 'https://<filius-clone>/?scenario=3',
 'Schicht 3 – Vermittlung',
 array['ipconfig','ping','arp'],
 'Falsche Subnetzmaske → ein Teil der Adressen wurde fälschlich als „fremdes Netz" behandelt und nicht erreicht.',
 'Korrekte Subnetzmaske laut Netzplan gesetzt, danach sind alle Rechner im Subnetz erreichbar.'),

(4, 'Ticket #4 – Intranet per Name nicht erreichbar',
 'Ich will unser Intranet unter intranet.datasol.local öffnen – es kommt aber nur eine Fehlermeldung. Eine Kollegin gab mir eine Zahlenadresse, damit geht es plötzlich.',
 'Namen wie intranet.datasol.local übersetzt ein DNS-Server in IP-Adressen. Jeder PC muss die Adresse seines DNS-Servers kennen.',
 'https://<filius-clone>/?scenario=4',
 'Schicht 7 – Anwendung',
 array['nslookup','browser'],
 'Aufruf per IP klappt, per Name nicht → DNS-Eintrag fehlte.',
 'Adresse des DNS-Servers im Client ergänzt (vom Nachbar-PC/Netzplan).'),

(5, 'Ticket #5 – Webseite lädt nicht, Server antwortet aber',
 'Den Server kann ich anpingen, aber unsere interne Webseite lädt einfach nicht – im Browser kommt nur ein Fehler.',
 'Ein Ping prüft nur, ob der Rechner im Netz erreichbar ist. Ob eine Anwendung (z. B. der Webserver-Dienst) läuft, ist eine eigene Frage – das ist Schicht 7.',
 'https://<filius-clone>/?scenario=5',
 'Schicht 7 – Anwendung',
 array['ping','browser','service'],
 'Ping erfolgreich (Netz in Ordnung), Webseite lädt nicht → der Webserver-Dienst war gestoppt.',
 'Webserver-Dienst am Server gestartet/aktiviert, Seite anschließend wieder erreichbar.'),

(6, 'Ticket #6 – Verbindung zum Server seit gestern blockiert',
 'Seit der Umstellung gestern komme ich nicht mehr auf den Server. Pingen kann ich ihn, aber der Verbindungsaufbau zur Anwendung scheitert.',
 'Eine Firewall kann gezielt einzelne Ports (Transportschicht) sperren. Dann ist der Rechner zwar per Ping erreichbar, der Dienst aber nicht.',
 'https://<filius-clone>/?scenario=6',
 'Schicht 4 – Transport',
 array['ping','browser','firewall'],
 'Ping ok, aber Verbindungsaufbau scheitert → die Firewall sperrte den benötigten Port.',
 'Firewall-Regel angepasst und den benötigten Port für den Dienst freigegeben.')

on conflict (id) do update set
  title           = excluded.title,
  reporter_text   = excluded.reporter_text,
  concept_hint    = excluded.concept_hint,
  filius_deeplink = excluded.filius_deeplink,
  correct_layer   = excluded.correct_layer,
  correct_tools   = excluded.correct_tools,
  model_problem   = excluded.model_problem,
  model_solution  = excluded.model_solution;
