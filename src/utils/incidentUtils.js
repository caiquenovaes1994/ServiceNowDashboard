/**
 * Utilitários para tratamento de datas e regras de negócio de incidentes.
 */

// Converte 'DD/MM/YYYY HH:mm' em timestamp numérico
export const parseDateToTimestamp = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return 0;
  const parts = dateStr.trim().split(' ');
  const dateParts = parts[0].split('/');
  if (dateParts.length === 3) {
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    let hours = 0;
    let minutes = 0;
    if (parts[1]) {
      const timeParts = parts[1].split(':');
      hours = parseInt(timeParts[0], 10) || 0;
      minutes = parseInt(timeParts[1], 10) || 0;
    }
    const d = new Date(year, month, day, hours, minutes);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? 0 : parsed;
};

// Verifica se o incidente está há 3 ou mais dias sem atualização
export const isIncidentStale = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '-') return false;
  const parts = dateStr.trim().split(' ')[0].split('/');
  if (parts.length !== 3) return false;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const dataInc = new Date(year, month, day);
  if (isNaN(dataInc.getTime())) return false;
  const diffDays = (new Date() - dataInc) / (1000 * 60 * 60 * 24);
  return diffDays >= 3;
};

export const INVENTTI_TICKET_URL_PREFIX = 'https://inventti.movidesk.com/Ticket/Edit/';

// Verifica se o responsável informado é a Inventti
export const isInventtiResponsible = (name) =>
  typeof name === 'string' && name.trim().toLowerCase() === 'inventti';

// Monta a URL padrão do Movidesk da Inventti a partir do número do ticket
export const buildInventtiTicketUrl = (ticket) => {
  const cleanTicket = typeof ticket === 'string' ? ticket.trim() : '';
  return cleanTicket ? `${INVENTTI_TICKET_URL_PREFIX}${cleanTicket}` : '';
};

const alphanumericCollator = new Intl.Collator('pt-BR', {
  sensitivity: 'base',
  ignorePunctuation: true
});

// Ordenação alfanumérica considerando números primeiro [0-9, A-Z]
export const compareAlphanumeric = (a, b) =>
  alphanumericCollator.compare(String(a || '').trim(), String(b || '').trim());
