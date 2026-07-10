-- =====================================================================
-- DataSol IT-Support – Seed der Ticket-VORLAGEN (ticket_templates)
-- =====================================================================
-- Nach schema.sql ausführen. Re-runnable: aktualisiert nur die Vorlagen.
-- create_class() kopiert die Vorlagen in die Tickets einer neuen Klasse –
-- Änderungen hier wirken also nur auf danach erstellte Klassen-Sets.
--
-- Die Texte für Ticket 1 und 4 stammen aus der Aufgabenstellung. Tickets
-- 2, 3, 5, 6, 7 sind analog aus dem Ticket-Paket abgeleitet – bei Bedarf hier
-- durch die echten Paket-Texte ersetzen. Filius-Deeplink-Schema:
-- https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_<ticket-id>.
--
-- correct_tools: nur Werkzeuge verwenden, die der geführte Diagnoseweg bis zur
-- Fehler-Schicht auch anbietet (siehe LAYER_STEPS in src/lib/flowchart.ts) –
-- sonst bemängelt das Feedback Werkzeuge, die gar nicht anklickbar waren.
-- ---------------------------------------------------------------------

insert into ticket_templates (id, title, reporter_text, concept_hint, filius_deeplink, correct_layer, correct_tools, model_problem, model_solution) values
(1, 'Ticket #1 – Keine Netzwerkverbindung',
 'Mein Rechner hat überhaupt keine Netzwerkverbindung mehr – kein Intranet, gar nichts. Gestern lief noch alles. Bitte reparieren. Danke!',
 null,
 'https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_1',
 'Schicht 1 – Bitübertragung',
 array['connview'],
 'Kein Link – die physische Verbindung fehlte.',
 'Kabel wieder angeschlossen / an korrekten Switch-Port gesteckt.'),

(2, 'Ticket #2 – Anderes Netz nicht erreichbar',
 'Die Kollegen direkt neben mir kann ich anpingen, aber an die Server in der anderen Abteilung komme ich nicht heran. Das Internet geht auch nicht.',
 null,
 'https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_2',
 'Schicht 3 – Vermittlung',
 array['ipconfig','ping'],
 'Lokales Netz erreichbar, andere Netze nicht → das Standardgateway war nicht/falsch eingetragen.',
 'Korrektes Standardgateway (Router-IP) laut Netzplan im Client eingetragen.'),

(3, 'Ticket #3 – Manche Rechner erreichbar, andere nicht',
 'Ein paar Rechner im Haus erreiche ich problemlos, andere im gleichen Büro überhaupt nicht. Das ergibt für mich keinen Sinn. Bitte reparieren. Danke!',
 null,
 'https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_3',
 'Schicht 3 – Vermittlung',
 array['ipconfig','ping'],
 'Falsche Subnetzmaske → ein Teil der Adressen wurde fälschlich als „fremdes Netz" behandelt und nicht erreicht.',
 'Korrekte Subnetzmaske laut Netzplan gesetzt, danach sind alle Rechner im Subnetz erreichbar.'),

(4, 'Ticket #4 – Ständige Aussetzer trotz blinkender Netzwerk-LED',
 'Bei mir ist der Wurm drin: Mal lädt eine Seite, dann wieder nicht, Downloads brechen ständig mittendrin ab. Dabei blinkt die Lampe an der Netzwerkbuchse munter vor sich hin – es müsste doch eigentlich alles in Ordnung sein? Seit Kurzem steht außerdem ein großes Gerät der Haustechnik direkt neben meinem PC. Kann das was mit dem Umbau zu tun haben? Bitte reparieren. Danke!',
 null,
 'https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_4',
 'Schicht 2 – Sicherung',
 array['connview','wireshark'],
 'Die Verbindung bestand (LED blinkte), aber viele Ethernet-Rahmen kamen mit fehlerhafter Prüfsumme (FCS) an und wurden verworfen → das Kabel war beschädigt bzw. lag direkt neben einer elektrischen Störquelle.',
 'Beschädigtes Kabel ersetzt und ausreichend Abstand zur Störquelle geschaffen (bzw. geschirmtes Kabel verwendet). Danach keine FCS-Fehler mehr, Verbindung stabil.'),

(5, 'Ticket #5 – Intranet per Name nicht erreichbar',
 'Ich will unser Intranet unter intranet.datasol.local öffnen – es kommt aber nur eine Fehlermeldung. Eine Kollegin gab mir eine Zahlenadresse, damit geht es plötzlich. Bitte reparieren. Danke!',
 null,
 'https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_5',
 'Schicht 7 – Anwendung',
 array['nslookup','browser'],
 'Aufruf per IP klappt, per Name nicht → DNS-Eintrag fehlte.',
 'Adresse des DNS-Servers im Client ergänzt (vom Nachbar-PC/Netzplan).'),

(6, 'Ticket #6 – Webseite lädt nicht, Server antwortet aber',
 'Den Server kann ich anpingen, aber unsere interne Webseite lädt einfach nicht – im Browser kommt nur ein Fehler. Bitte reparieren. Danke!',
 null,
 'https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_6',
 'Schicht 7 – Anwendung',
 array['ping','nslookup','browser'],
 'Ping erfolgreich (Netz in Ordnung), Webseite lädt nicht → der Webserver-Dienst war gestoppt.',
 'Webserver-Dienst am Server gestartet/aktiviert, Seite anschließend wieder erreichbar.'),

(7, 'Ticket #7 – Verbindung zum Server seit gestern blockiert',
 'Seit der Umstellung gestern komme ich nicht mehr auf den Server. Pingen kann ich ihn, aber der Verbindungsaufbau zur Anwendung scheitert. Bitte reparieren. Danke!',
 'Eine Firewall kann gezielt einzelne Ports (Transportschicht) sperren. Dann ist der Rechner zwar per Ping erreichbar, der Dienst aber nicht.',
 'https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_7',
 'Schicht 4 – Transport',
 array['ping','firewall'],
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
