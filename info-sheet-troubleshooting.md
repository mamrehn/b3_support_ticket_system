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
Nicht raten – **prüfen**. Der **Ping** ist dein wichtigstes erstes Werkzeug: Mit einem Befehl testet er die Schichten **1 bis 3** auf einmal.

> **Merksatz:** Klappt der Ping zu einer IP-Adresse, arbeiten die unteren Schichten (1–3) für *diesen Weg* gerade – viele Ursachen sind damit ausgeschlossen.
> *Achtung:* nur „für diesen Weg, in diesem Moment" – sporadische Aussetzer kann ein erfolgreicher Ping nicht ausschließen.

Arbeite dann nach dem Ablaufdiagramm. **Jede Raute nennt die zu prüfende Schicht und das passende Werkzeug; jeder Endpunkt nennt Schicht und Maßnahme.**

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

*Graue Rauten = breiter Ping-Test (Schicht 1–3). Farbige Elemente = eine bestimmte Schicht: blau = Netzzugang (1/2), violett = Internet (3), orange = Anwendung (4/7).*
