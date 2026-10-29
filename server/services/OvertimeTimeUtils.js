import CryptoService from './CryptoService.js';

export const MESES_PT = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

/**
 * Converte '0730' em '07:30', '8' em '08:00', mantendo o formato se já estiver correto.
 */
export function processarInputHorario(s) {
  if (!s) return '';
  const clean = String(s).trim().replace(':', '');
  if (/^\d+$/.test(clean)) {
    let padded = clean;
    if (clean.length === 1) padded = `0${clean}00`;
    else if (clean.length === 2) padded = `${clean}00`;
    else if (clean.length === 3) padded = `0${clean}`;
    else if (clean.length > 4) padded = clean.slice(0, 4);

    if (padded.length === 4) {
      let h = parseInt(padded.slice(0, 2), 10);
      let m = parseInt(padded.slice(2), 10);
      if (h > 23) h = 23;
      if (m > 59) m = 59;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  return String(s).includes(':') ? String(s).trim() : '';
}

/**
 * Calcula a diferença em minutos entre dois horários (HH:MM), tratando virada de noite.
 */
export function calcularMinutosEntre(horaInicio, horaFim) {
  const i = processarInputHorario(horaInicio);
  const f = processarInputHorario(horaFim);
  if (!i || !f) return 0;

  const [h1, m1] = i.split(':').map(Number);
  const [h2, m2] = f.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;

  let min1 = h1 * 60 + m1;
  let min2 = h2 * 60 + m2;

  // Se o término for menor que o início, significa virada para o dia seguinte (+24h)
  if (min2 < min1) {
    min2 += 24 * 60;
  }

  return min2 - min1;
}

/**
 * Calcula a duração total do atendimento considerando início, intervalo, volta e término.
 */
export function calcularDuracaoTotal(inicio, intervalo, volta, termino) {
  if (!inicio || !termino) return 0;

  const duracaoBruta = calcularMinutosEntre(inicio, termino);
  if (intervalo && volta) {
    const duracaoIntervalo = calcularMinutosEntre(intervalo, volta);
    return Math.max(0, duracaoBruta - duracaoIntervalo);
  }

  return duracaoBruta;
}

/**
 * Formata minutos em 'HH:MM'.
 */
export function formatarMinutos(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return '00:00';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Retorna a faixa de competência fechada (do dia 26 do mês anterior ao dia 25 do mês atual).
 */
export function obterFaixaPeriodo(mesExtenso, ano) {
  const mesIdx = MESES_PT.indexOf(String(mesExtenso).trim().toUpperCase());
  const monthNum = mesIdx !== -1 ? mesIdx + 1 : new Date().getMonth() + 1;
  const yearNum = parseInt(ano, 10) || new Date().getFullYear();

  let inicioAno = yearNum;
  let inicioMes = monthNum - 1;
  if (inicioMes === 0) {
    inicioMes = 12;
    inicioAno = yearNum - 1;
  }

  const fimAno = yearNum;
  const fimMes = monthNum;

  const inicioStr = `${inicioAno}-${String(inicioMes).padStart(2, '0')}-26`;
  const fimStr = `${fimAno}-${String(fimMes).padStart(2, '0')}-25`;

  const dataInicio = new Date(inicioAno, inicioMes - 1, 26, 12, 0, 0);
  const dataFim = new Date(fimAno, fimMes - 1, 25, 12, 0, 0);

  return {
    inicio: dataInicio,
    fim: dataFim,
    dataInicioStr: inicioStr,
    dataFimStr: fimStr,
    mesExtenso: MESES_PT[monthNum - 1],
    ano: yearNum
  };
}

export function timeToMinutes(t) {
  const p = processarInputHorario(t);
  if (!p || !p.includes(':')) return 0;
  const [h, m] = p.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

export function isHorarioOvernight(horaInicio, horaFim) {
  const i = processarInputHorario(horaInicio);
  const f = processarInputHorario(horaFim);
  if (!i || !f) return false;
  const [h1, m1] = i.split(':').map(Number);
  const [h2, m2] = f.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return false;
  return (h2 * 60 + m2) < (h1 * 60 + m1);
}

export function calcularTotaisPeriodo(chamados, isHolidayFn, fallbackBaseSalary = 0, divisor = 200.0) {
  const segmentosPorDia = new Map();

  for (const c of chamados) {
    if (!c.data || !c.inicio || !c.termino) continue;

    const startMin = timeToMinutes(c.inicio);
    const endMin = timeToMinutes(c.termino);
    const isOvernight = endMin < startMin;

    const rawSnap = CryptoService.decryptNumber(c.valor_base_snapshot, 0);
    const vBase = rawSnap > 0 ? rawSnap : fallbackBaseSalary;
    const vHora = vBase > 0 ? vBase / divisor : 0;

    if (isOvernight) {
      if (!segmentosPorDia.has(c.data)) segmentosPorDia.set(c.data, []);
      segmentosPorDia.get(c.data).push({ start: startMin, end: 1439, valorHora: vHora });

      const [y, m, d] = c.data.split('-').map(Number);
      const nextDt = new Date(y, m - 1, d + 1, 12, 0, 0);
      const nextStr = `${nextDt.getFullYear()}-${String(nextDt.getMonth() + 1).padStart(2, '0')}-${String(nextDt.getDate()).padStart(2, '0')}`;
      if (!segmentosPorDia.has(nextStr)) segmentosPorDia.set(nextStr, []);
      segmentosPorDia.get(nextStr).push({ start: 0, end: endMin, valorHora: vHora });
    } else {
      if (!segmentosPorDia.has(c.data)) segmentosPorDia.set(c.data, []);
      segmentosPorDia.get(c.data).push({ start: startMin, end: endMin, valorHora: vHora });
    }
  }

  let total50Min = 0;
  let total100Min = 0;
  let ganho50 = 0;
  let ganho100 = 0;

  for (const [dateStr, segs] of segmentosPorDia.entries()) {
    segs.sort((a, b) => a.start - b.start || a.end - b.end);

    const merged = [];
    for (const s of segs) {
      if (merged.length === 0) {
        merged.push({ start: s.start, end: s.end, valorHora: s.valorHora });
      } else {
        const last = merged[merged.length - 1];
        if (s.start <= last.end) {
          last.end = Math.max(last.end, s.end);
          last.valorHora = Math.max(last.valorHora || 0, s.valorHora || 0);
        } else {
          merged.push({ start: s.start, end: s.end, valorHora: s.valorHora });
        }
      }
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    const dayOfWeek = dateObj.getDay();
    const isHol = isHolidayFn ? isHolidayFn(dateStr) : false;
    const is100 = dayOfWeek === 0 || isHol;

    for (const iv of merged) {
      const dayMinutes = iv.end - iv.start;
      const rate = is100 ? 2.0 : 1.5;
      const ganho = (dayMinutes / 60.0) * (iv.valorHora || 0) * rate;

      if (is100) {
        total100Min += dayMinutes;
        ganho100 += ganho;
      } else {
        total50Min += dayMinutes;
        ganho50 += ganho;
      }
    }
  }

  return {
    total50Min,
    total100Min,
    totalGeralMin: total50Min + total100Min,
    ganho50,
    ganho100,
    ganhoTotal: ganho50 + ganho100
  };
}

export default {
  MESES_PT,
  processarInputHorario,
  calcularMinutosEntre,
  calcularDuracaoTotal,
  formatarMinutos,
  obterFaixaPeriodo,
  timeToMinutes,
  isHorarioOvernight,
  calcularTotaisPeriodo
};
