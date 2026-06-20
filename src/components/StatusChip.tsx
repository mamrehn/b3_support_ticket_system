import { STATUS_LABEL, ticketStatus, type Ticket, type TicketStatus } from '../lib/types';

const STYLES: Record<TicketStatus, string> = {
  offen: 'bg-gray-100 text-gray-700 ring-gray-300',
  in_bearbeitung: 'bg-amber-100 text-amber-800 ring-amber-300',
  erledigt: 'bg-green-100 text-green-800 ring-green-300',
};

export function StatusChip({ ticket }: { ticket: Ticket }) {
  const status = ticketStatus(ticket);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
