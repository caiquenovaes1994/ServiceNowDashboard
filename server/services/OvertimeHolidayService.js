import Holidays from 'date-holidays';

const hd = new Holidays('BR', 'SP');

// Algoritmo de Butcher / Meeus para cálculo da Páscoa Gregoriana
function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day, 12, 0, 0);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const holidaysCache = new Map();

export function getHolidaysForYear(year) {
  if (holidaysCache.has(year)) {
    return holidaysCache.get(year);
  }

  const holidayMap = new Map();

  // Feriados da biblioteca date-holidays (Nacionais BR e Estaduais SP)
  try {
    const brHolidays = hd.getHolidays(year);
    if (Array.isArray(brHolidays)) {
      brHolidays.forEach((h) => {
        const dateStr = h.date.split(' ')[0];
        holidayMap.set(dateStr, h.name);
      });
    }
  } catch (err) {
    console.warn(`[OvertimeHolidayService] Erro ao carregar date-holidays para ${year}:`, err.message);
  }

  // Feriados fixos estaduais e municipais de São Paulo
  // 25 de Janeiro: Aniversário de São Paulo (Municipal)
  holidayMap.set(`${year}-01-25`, 'Aniversário de São Paulo');
  // 9 de Julho: Revolução Constitucionalista (Estadual SP)
  holidayMap.set(`${year}-07-09`, 'Revolução Constitucionalista');
  // 20 de Novembro: Dia da Consciência Negra (Nacional / Municipal)
  holidayMap.set(`${year}-11-20`, 'Dia da Consciência Negra');

  // Feriados móveis derivados da Páscoa
  try {
    const easter = calculateEaster(year);
    const carnival = addDays(easter, -47);
    const goodFriday = addDays(easter, -2);
    const corpusChristi = addDays(easter, 60);

    holidayMap.set(formatDateKey(carnival), 'Carnaval');
    holidayMap.set(formatDateKey(goodFriday), 'Sexta-feira Santa');
    holidayMap.set(formatDateKey(corpusChristi), 'Corpus Christi');
  } catch (err) {
    console.warn(`[OvertimeHolidayService] Erro ao calcular feriados móveis para ${year}:`, err.message);
  }

  holidaysCache.set(year, holidayMap);
  return holidayMap;
}

export function parseLocalDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string') {
    const clean = dateInput.trim();
    const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, 12, 0, 0);
    }
  }
  return new Date(dateInput);
}

export function isHoliday(dateInput) {
  const d = parseLocalDate(dateInput);
  if (!d || isNaN(d.getTime())) return false;
  const year = d.getFullYear();
  const map = getHolidaysForYear(year);
  const key = formatDateKey(d);
  return map.has(key);
}

export function getDiaSemana(dateInput) {
  const d = parseLocalDate(dateInput);
  if (!d || isNaN(d.getTime())) return '';
  if (isHoliday(d)) {
    return 'FERIADO';
  }
  const dias = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
  return dias[d.getDay()];
}

export default {
  getHolidaysForYear,
  isHoliday,
  getDiaSemana,
  parseLocalDate
};
