// Personas für die Immersion (reine Darstellung, keine DB-Daten).
// Pro Ticket meldet eine Kollegin/ein Kollege aus einer Fachabteilung die
// Störung; eine erfahrene Kollegin gibt nach dem Weiterleiten Feedback.
// Über die Ticket-ID den passenden Melder zuordnen.

export interface Reporter {
  name: string;
  department: string;
}

export const REPORTERS: Record<number, Reporter> = {
  1: { name: 'Markus Hoffmann', department: 'Buchhaltung' }, // #1 keine Verbindung (L1)
  2: { name: 'Petra Wagner', department: 'Vertrieb' }, // #2 anderes Netz (L3)
  3: { name: 'Stefan Klein', department: 'Lager & Logistik' }, // #3 IP/Subnetzmaske Nachbar-Laptop (L3)
  4: { name: 'Daniel Wolf', department: 'Haustechnik' }, // #4 FCS/Störung (L2)
  5: { name: 'Julia Becker', department: 'Marketing' }, // #5 DNS (L7)
  6: { name: 'Thomas Schäfer', department: 'Personalabteilung' }, // #6 Webdienst (L7)
  7: { name: 'Sabine Richter', department: 'Einkauf' }, // #7 Firewall (L4)
};

export function reporterFor(ticketId: number): Reporter {
  return REPORTERS[ticketId] ?? { name: 'Anonyme Meldung', department: 'DataSol' };
}

// Die "erfahrene Kollegin", an die zum Feedback weitergeleitet wird.
export const MENTOR = {
  name: 'Sandra Berger',
  role: 'Netzwerkadministratorin · 2nd Level Support',
};
