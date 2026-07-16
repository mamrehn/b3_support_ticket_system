-- =====================================================================
-- DataSol IT-Support – Seed der Ticket-VORLAGEN (ticket_templates)
-- =====================================================================
-- Nach schema.sql ausführen. Re-runnable: aktualisiert nur die Vorlagen.
-- create_class() kopiert die Vorlagen in die Tickets einer neuen Klasse.
-- Bestehende Klassen behalten zunächst ihren alten Stand; sie übernehmen
-- Änderungen von hier erst, wenn die Lehrkraft das Ticketsystem zurücksetzt
-- (reset_tickets kopiert die Vorlagen-Inhalte dann erneut in die Klasse).
--
-- Alle Filius-Szenarien zeigen dasselbe Netz: ein Router verbindet zwei
-- Subnetze. Switch1 (192.168.0.0/24): Laptop des Melders (.10) + Laptop eines
-- Kollegen (.11). Switch2 (10.0.0.0/24): Laptop (.12) + Server (.10; DNS-/
-- Webserver nur, wenn das Ticket sie braucht). Es gibt KEINEN Internetzugang –
-- die Texte dürfen daher weder das Internet noch Dienste erwähnen, die im
-- jeweiligen Szenario fehlen.
--
-- Die Texte für Ticket 1 und 4 stammen aus der Aufgabenstellung (Ticket 4
-- leicht an das Simulationsnetz angepasst: dort gibt es keine Webseiten zum
-- Laden). Tickets 2, 3, 5, 6, 7 sind analog aus dem Ticket-Paket abgeleitet.
-- Filius-Deeplink-Schema:
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
 'Den Kollegen direkt neben mir kann ich anpingen, aber in die andere Abteilung komme ich gar nicht durch – weder zum Server noch zum Rechner des Kollegen dort. Bitte reparieren. Danke!',
 null,
 'https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_2',
 'Schicht 3 – Vermittlung',
 array['ipconfig','ping'],
 'Lokales Netz erreichbar, andere Netze nicht → das Standardgateway war nicht/falsch eingetragen.',
 'Korrektes Standardgateway (Router-IP) laut Netzplan im Client eingetragen.'),

(3, 'Ticket #3 – Nicht alle Rechner erreichbar',
 'Den Server und den Rechner in der anderen Abteilung erreiche ich problemlos, aber den Laptop vom Kollegen direkt neben mir überhaupt nicht. Das ergibt für mich keinen Sinn. Bitte reparieren. Danke!',
 null,
 'https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_3',
 'Schicht 3 – Vermittlung',
 array['ipconfig','ping'],
 'Der Nachbar-Laptop hatte eine falsche IP-Adresse und Subnetzmaske (192.168.1.11 / 255.255.0.0 statt 192.168.0.11 / 255.255.255.0) → die übrigen Rechner behandelten ihn dadurch als „fremdes Netz" und erreichten ihn nicht.',
 'IP-Adresse und Subnetzmaske des Nachbar-Laptops laut Netzplan korrigiert, danach sind alle Rechner im Subnetz erreichbar.'),

(4, 'Ticket #4 – Ständige Aussetzer trotz blinkender Netzwerk-LED',
 'Bei mir ist der Wurm drin: Mal erreiche ich die anderen Rechner, dann wieder nicht, und Übertragungen brechen ständig mittendrin ab. Dabei blinkt die Lampe an der Netzwerkbuchse munter vor sich hin – es müsste doch eigentlich alles in Ordnung sein? Seit Kurzem steht außerdem ein großes Gerät der Haustechnik direkt neben meinem Laptop. Kann das was mit dem Umbau zu tun haben? Bitte reparieren. Danke!',
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
 'Aufruf per IP klappt, per Name nicht → in den Netzwerkeinstellungen des Rechners fehlte die Adresse des DNS-Servers.',
 'Adresse des DNS-Servers (laut Netzplan: Server 10.0.0.10) in den Netzwerkeinstellungen ergänzt.'),

(6, 'Ticket #6 – Webseite lädt nicht, Server antwortet aber',
 'Den Server kann ich anpingen, aber unsere interne Webseite lädt einfach nicht – im Browser kommt nur ein Fehler, obwohl ich wie gewohnt die Zahlenadresse verwende. Bitte reparieren. Danke!',
 null,
 'https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_6',
 'Schicht 7 – Anwendung',
 array['ping','browser'],
 'Ping erfolgreich (Netz in Ordnung), Webseite lädt auch per IP-Adresse nicht → der Webserver-Dienst war gestoppt.',
 'Webserver-Dienst am Server gestartet/aktiviert, Seite anschließend wieder erreichbar.'),

(7, 'Ticket #7 – Verbindung zum Server seit gestern blockiert',
 'Seit der Umstellung gestern komme ich nicht mehr auf den Server. Pingen kann ich ihn, aber der Verbindungsaufbau zur Anwendung scheitert. Bitte reparieren. Danke!',
 'Eine Firewall kann gezielt einzelne Ports (Transportschicht) sperren. Dann ist der Rechner zwar per Ping erreichbar, der Dienst aber nicht. Im Übungsnetz sitzt die Firewall auf dem Router.',
 'https://mamrehn.github.io/netlab3-web/?load_file=b3_support_ticket_7',
 'Schicht 4 – Transport',
 array['ping','firewall'],
 'Ping ok, aber Verbindungsaufbau scheitert → die Firewall sperrte den benötigten Port.',
 'Firewall-Regel am Router angepasst und den benötigten Port (TCP 80) für den Dienst freigegeben.')

on conflict (id) do update set
  title           = excluded.title,
  reporter_text   = excluded.reporter_text,
  concept_hint    = excluded.concept_hint,
  filius_deeplink = excluded.filius_deeplink,
  correct_layer   = excluded.correct_layer,
  correct_tools   = excluded.correct_tools,
  model_problem   = excluded.model_problem,
  model_solution  = excluded.model_solution;
