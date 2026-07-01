# Informationsblatt · Strukturierte Fehlersuche mit dem Schichtenmodell

## Warum Schichten?
Ein Netzwerk muss viele Teilaufgaben erfüllen – Bits übertragen, adressieren, Wege finden, Programme bedienen. Diese Aufgaben sind in **Schichten** aufgeteilt: Jede Schicht erledigt **eine** Aufgabe, nutzt die Schicht darunter und bietet der Schicht darüber einen Dienst. Das **OSI-Modell** beschreibt 7 Schichten (feine Landkarte), das **DoD-/TCP-IP-Modell** fasst sie zu 4 Gruppen zusammen (die Praxis-Sicht).

Für die **Fehlersuche** ist das Gold wert: Ein Fehler steckt fast immer in **einer** Schicht. Prüft man die Schichten **der Reihe nach**, schließt man mit einem einzigen Test oft ganze Gruppen von Ursachen aus.

## Die Schichten, ihre Aufgaben und Testwerkzeuge

| Schicht (OSI) | DoD-Gruppe | Aufgabe | Typisches Fehlerbild | Werkzeug zum Testen |
|---|---|---|---|---|
| **7 Anwendung** | Anwendung | Dienste/Programme bereitstellen (Web, DNS) | Name geht nicht / Seite lädt nicht – obwohl Ping klappt | Browser, `nslookup`, Dienststatus |
| **6 Darstellung** | Anwendung | Datenformat, Verschlüsselung | Daten unleserlich / Zertifikatfehler | (Browser-Meldung) |
| **5 Sitzung** | Anwendung | Verbindung auf-/abbauen | Verbindung bricht ab | (Protokolle/Logs) |
| **4 Transport** | Transport | Datenstrom, **Ports** (TCP/UDP) | Ping klappt, aber Dienst verweigert/blockiert | Firewall, „Port offen?" |
| **3 Vermittlung** | Internet | Adressierung & Wegwahl (IP, ICMP, **ARP**) | keine/falsche IP; remote nicht erreichbar | `ping`, `ipconfig`, `arp -a`, Wireshark |
| **2 Sicherung** | Netzzugang | Frames, MAC, Fehlererkennung (**FCS**) | Link da, aber Frames beschädigt/verworfen | Wireshark (FCS), SAT des Switch |
| **1 Bitübertragung** | Netzzugang | Bits über Kabel/Funk | kein Link; „Kabel nicht verbunden" | LED, Verbindungsansicht, `ipconfig` |

> Die Schichten **5 und 6** fasst man in der Praxis meist mit Schicht 7 zur „Anwendung" zusammen.

## So suchst du systematisch
**Grundregel:** Gehe die Schichten **von unten (1) nach oben (7)** durch. Prüfe eine Schicht – ist sie in Ordnung, steige eine höher; ist sie es nicht, hast du den Fehler gefunden. Da jede Schicht auf der darunter aufbaut, gilt: Funktioniert Schicht N, sind die Schichten 1 bis N in Ordnung.
*Nach jeder Behebung von der betroffenen Schicht aus erneut prüfen.*

### ① Standard-Weg – Schicht für Schicht (1 → 7)

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 30, "rankSpacing": 35, "diagramPadding": 4, "padding": 8}} }%%
flowchart TD
  A(["Fehler gemeldet"]) --> S1{"Schicht 1 OK?<br/>Link / LED vorhanden? (Verbindungsansicht)"}
  S1 -- "Nein" --> F1["Schicht 1 – Bitübertragung<br/>Kabel / Port / Strom prüfen, neu verbinden"]
  S1 -- "Ja" --> S2{"Schicht 2 OK?<br/>Frames kommen an und FCS fehlerfrei? (Wireshark)"}
  S2 -- "Nein" --> F2["Schicht 2 – Sicherung<br/>defektes Kabel tauschen (FCS-Fehler)"]
  S2 -- "Ja" --> S3{"Schicht 3 OK?<br/>Andere Geräte per IP erreichbar? (ipconfig, ping)"}
  S3 -- "Nein" --> F3["Schicht 3 – Vermittlung<br/>Eigene IP/Maske korrekt? Standardgateway gesetzt?"]
  S3 -- "Ja" --> S4{"Schicht 4 OK?<br/>Dienst-Port am Server erreichbar, nicht blockiert? (Firewall)"}
  S4 -- "Nein" --> F4["Schicht 4 – Transport<br/>Firewall-Port für den Dienst freigeben"]
  S4 -- "Ja" --> S7{"Schicht 7 OK?<br/>Name löst auf und Dienst antwortet? (nslookup, Browser)"}
  S7 -- "Nein" --> F7["Schicht 7 – Anwendung<br/>DNS-Eintrag korrigieren / Dienst starten"]
  S7 -- "Ja" --> OK(["Alles OK – Fehler woanders suchen"])

  classDef low fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e;
  classDef mid fill:#ede9fe,stroke:#6d28d9,color:#4c1d95;
  classDef app fill:#ffedd5,stroke:#c2410c,color:#7c2d12;
  classDef neu fill:#f1f5f9,stroke:#64748b,color:#334155;
  class S1,S2,F1,F2 low
  class S3,F3 mid
  class S4,S7,F4,F7 app
  class A,OK neu
```

*Farben: blau = Netzzugang (Schicht 1/2), violett = Internet (3), orange = Transport/Anwendung (4/7).*

### ② Bonus für Schnelle – der „Ping-Sprung"
Profis sparen Schritte. Der **Ping** testet die Schichten **1–3 mit einem einzigen Befehl**: Klappt er, kann man die unteren drei Schichten überspringen und sofort weiter oben suchen; klappt er nicht, grenzt man von dort nach unten ein.

> **Merksatz:** Klappt der Ping zu einer IP-Adresse, arbeiten die Schichten 1–3 für *diesen Weg* gerade. *Achtung:* nur „in diesem Moment" – sporadische Aussetzer schließt ein erfolgreicher Ping nicht aus.

Schneller, aber schwerer zu lesen:

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 30, "rankSpacing": 35, "diagramPadding": 4, "padding": 8}} }%%
flowchart TD
  A(["Fehler gemeldet"]) --> B{"Ping zur Ziel-IP erfolgreich?<br/>(prüft Schicht 1–3 auf einmal)"}

  B -- "Ja, 1–3 OK" --> D{"Aufruf per Name möglich?<br/>(Browser / nslookup – Schicht 7)"}
  B -- "Nein" --> F{"Ping ins lokale Netz erfolgreich?<br/>(Gateway / Nachbar-PC)"}

  D -- "Nein" --> L7a["Schicht 7 – DNS<br/>DNS-Server-Eintrag am PC korrigieren"]
  D -- "Ja" --> E{"Dienst bzw. Seite erreichbar?<br/>(Dienst läuft? Port frei? – Schicht 4/7)"}
  E -- "Nein" --> L74["Schicht 4/7 – Dienst & Port<br/>Dienst starten oder Port freigeben"]
  E -- "Ja" --> OK(["Funktioniert –<br/>Ursache woanders suchen"])

  F -- "nur remote" --> L3b["Schicht 3 – Routing<br/>Standardgateway eintragen"]
  F -- "auch lokal nicht" --> G{"Link vorhanden?<br/>(LED / Verbindungsansicht – Schicht 1)"}
  G -- "Nein" --> L1["Schicht 1 – Bitübertragung<br/>Kabel / Port / Strom prüfen"]
  G -- "Ja" --> H{"Frames fehlerfrei?<br/>(Wireshark: FCS – Schicht 2)"}
  H -- "FCS-Fehler" --> L2["Schicht 2 – Sicherung<br/>defektes Kabel tauschen"]
  H -- "Frames OK" --> I{"Eigene IP korrekt?<br/>(ipconfig – Schicht 3)"}
  I -- "Nein" --> L3a["Schicht 3 – Adressierung<br/>IP-Adresse / Subnetzmaske setzen"]
  I -- "Ja" --> OK

  classDef neu fill:#f1f5f9,stroke:#64748b,color:#334155;
  classDef low fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e;
  classDef mid fill:#ede9fe,stroke:#6d28d9,color:#4c1d95;
  classDef app fill:#ffedd5,stroke:#c2410c,color:#7c2d12;
  class A,B,F,OK neu
  class G,H,L1,L2 low
  class I,L3a,L3b mid
  class D,E,L7a,L74 app
```

*Graue Rauten = breiter Ping-Test (Schicht 1–3); farbige Elemente = eine bestimmte Schicht.*
