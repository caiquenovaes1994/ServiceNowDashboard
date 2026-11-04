import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import OvertimeHolidayService from './OvertimeHolidayService.js';
import OvertimeTimeUtils from './OvertimeTimeUtils.js';

const require = createRequire(import.meta.url);
const pdfmake = require('pdfmake');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório dedicado de fontes do projeto
const fontsDir = path.resolve(__dirname, '../assets/fonts');
const calibriNormal = path.join(fontsDir, 'calibri.ttf');
const calibriBold = path.join(fontsDir, 'calibrib.ttf');
const calibriItalic = path.join(fontsDir, 'calibrii.ttf');
const calibriBoldItalic = path.join(fontsDir, 'calibriz.ttf');

// Fallback secundário para C:/Windows/Fonts caso o diretório local de assets não tenha sido populado
const winFontsDir = 'C:/Windows/Fonts';
const winCalibriNormal = path.join(winFontsDir, 'calibri.ttf');
const winCalibriBold = path.join(winFontsDir, 'calibrib.ttf');
const winCalibriItalic = path.join(winFontsDir, 'calibrii.ttf');
const winCalibriBoldItalic = path.join(winFontsDir, 'calibriz.ttf');

const normalPath = fs.existsSync(calibriNormal) ? calibriNormal : (fs.existsSync(winCalibriNormal) ? winCalibriNormal : null);
const boldPath = fs.existsSync(calibriBold) ? calibriBold : (fs.existsSync(winCalibriBold) ? winCalibriBold : null);
const italicPath = fs.existsSync(calibriItalic) ? calibriItalic : (fs.existsSync(winCalibriItalic) ? winCalibriItalic : normalPath);
const boldItalicPath = fs.existsSync(calibriBoldItalic) ? calibriBoldItalic : (fs.existsSync(winCalibriBoldItalic) ? winCalibriBoldItalic : boldPath);

let DEFAULT_FONT = 'Helvetica';

if (normalPath && boldPath) {
  pdfmake.setFonts({
    Calibri: {
      normal: normalPath,
      bold: boldPath,
      italics: italicPath,
      bolditalics: boldItalicPath
    },
    Roboto: {
      normal: normalPath,
      bold: boldPath,
      italics: italicPath,
      bolditalics: boldItalicPath
    },
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  });
  DEFAULT_FONT = 'Calibri';
} else {
  pdfmake.setFonts({
    Roboto: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    },
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  });
  DEFAULT_FONT = 'Helvetica';
}

pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy(() => true);

// Cores oficiais da folha de apontamento
const HEADER_BG = '#632523';
const COL_HEADER_BG = '#C0504D';
const GRAY_WEEKEND = '#D9D9D9';
const GRAY_NAME_BG = '#D9D9D9';
const TEXT_HEADER = '#FFFFFF';
const TEXT_MAIN = '#000000';

// Tipografia oficial
const FS_TITLE = 10.5; // 14px * 0.75
const FS_MAIN = 8.25;  // 11px * 0.75

// Conversão exata de colunas em pixels escaladas para A4 paisagem
const ptsCm = 28.35;
const pxTotal = 2093.0;
const wAvail = 27.7 * ptsCm;
const scaleW = wAvail / pxTotal;

const colWidths = [
  183.0 * scaleW, // 0: DIA (~2.42cm)
  183.0 * scaleW, // 1: SEMANA (~2.42cm)
  183.0 * scaleW, // 2: DATA (~2.42cm)
  150.0 * scaleW, // 3: INÍCIO (~1.98cm)
  150.0 * scaleW, // 4: INTERVALO (~1.98cm)
  150.0 * scaleW, // 5: VOLTA (~1.98cm)
  150.0 * scaleW, // 6: TÉRMINO (~1.98cm)
  188.0 * scaleW, // 7: HORAS TRABALHADAS (~2.49cm)
  150.0 * scaleW, // 8: 50% (~1.98cm)
  150.0 * scaleW, // 9: 100% (~1.98cm)
  336.0 * scaleW  // 10: OBSERVAÇÕES (~4.45cm)
];

const totalTableOffsets = 31.0; // 10 cols * 2.5pt (pad 1+1 + vLine 0.5) + col 10 (pad 4+1 + vLine 0.5) + last vLine 0.5pt
const totalTableWidth = colWidths.reduce((a, b) => a + b, 0) + totalTableOffsets;
// Centralização milimétrica na página A4 Paisagem (841.89 pt de largura total)
const horizontalMargin = (841.89 - totalTableWidth) / 2;

function formatMinutes(min) {
  if (!min || min <= 0) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseTime(s) {
  if (!s) return '';
  const clean = String(s).trim();
  return clean.includes(':') ? clean : '';
}

function timeToMinutes(tStr) {
  const p = parseTime(tStr);
  if (!p || !p.includes(':')) return 0;
  const [h, m] = p.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Agrupa apontamentos respeitando estritamente o período oficial de fechamento (26 a 25),
 * tratamento de virada de noite e merge de sobreposições de horários.
 */
export function agruparParaPdf(registros = [], mes = 'JANEIRO', ano = '2026') {
  const faixa = OvertimeTimeUtils.obterFaixaPeriodo(mes, ano);
  const agrupado = {};

  let curr = new Date(faixa.inicio);
  const end = new Date(faixa.fim);

  while (curr <= end) {
    const dtStr = formatDateKey(curr);
    const dtObj = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), 12, 0, 0);
    let semana = OvertimeHolidayService.getDiaSemana(dtObj);
    // Regra de negócio: se feriado cair no domingo, no PDF deve ser mantido como DOMINGO
    if (dtObj.getDay() === 0) {
      semana = 'DOMINGO';
    }

    agrupado[dtStr] = {
      data: dtObj,
      dtStr,
      semana,
      inicio: '',
      intervalo: '',
      volta: '',
      termino: '',
      duracaoMin: 0,
      obs: [],
      min50: 0,
      min100: 0
    };

    curr.setDate(curr.getDate() + 1);
  }

  // 1. Expandir registros tratando virada de meia-noite (split em 2 segmentos)
  const segmentosPorDia = {};

  function adicionarSegmento(dtKey, startM, endM, startS, endS, obsText) {
    if (!segmentosPorDia[dtKey]) {
      segmentosPorDia[dtKey] = [];
    }
    segmentosPorDia[dtKey].push({
      start: startM,
      end: endM,
      start_str: startS,
      end_str: endS,
      obs: obsText
    });
  }

  for (const c of registros) {
    const dRaw = c.data;
    if (!dRaw) continue;

    let dStr = '';
    if (typeof dRaw === 'string') {
      dStr = dRaw.slice(0, 10);
    } else if (dRaw instanceof Date) {
      dStr = formatDateKey(dRaw);
    }

    const iniStr = parseTime(c.inicio);
    const fimStr = parseTime(c.termino);
    if (!iniStr || !fimStr) continue;

    const iniMin = timeToMinutes(iniStr);
    const fimMin = timeToMinutes(fimStr);
    const obsVal = (c.observacoes && typeof c.observacoes === 'string') ? c.observacoes.trim() : '';

    if (fimMin < iniMin) {
      // Cruzou a meia-noite!
      // Segmento 1: no próprio dia, das iniStr até 23:59 (1439 min)
      adicionarSegmento(dStr, iniMin, 1439, iniStr, '23:59', obsVal);

      // Segmento 2: no dia seguinte, das 00:00 até fimStr
      const [y, m, d] = dStr.split('-').map(Number);
      const nextDt = new Date(y, m - 1, d + 1, 12, 0, 0);
      const nextStr = formatDateKey(nextDt);
      adicionarSegmento(nextStr, 0, fimMin, '00:00', fimStr, obsVal);
    } else {
      adicionarSegmento(dStr, iniMin, fimMin, iniStr, fimStr, obsVal);
    }
  }

  // 2. Mesclar intervalos sobrepostos por dia e preencher colunas
  for (const [dtStr, segs] of Object.entries(segmentosPorDia)) {
    if (!agrupado[dtStr]) continue;

    // Observações únicas
    const dayObs = [];
    for (const s of segs) {
      const ob = String(s.obs || '').trim();
      if (ob && !dayObs.includes(ob)) {
        dayObs.push(ob);
      }
    }
    agrupado[dtStr].obs = dayObs;

    // Ordenar por início e término
    segs.sort((a, b) => a.start - b.start || a.end - b.end);

    const mergedIntervals = [];
    for (const s of segs) {
      if (mergedIntervals.length === 0) {
        mergedIntervals.push({
          start: s.start,
          end: s.end,
          start_str: s.start_str,
          end_str: s.end_str
        });
      } else {
        const prev = mergedIntervals[mergedIntervals.length - 1];
        if (s.start <= prev.end) {
          // Sobreposto ou contínuo: agrupa início mais cedo e término mais tarde
          if (s.end > prev.end) {
            prev.end = s.end;
            prev.end_str = s.end_str;
          }
        } else {
          mergedIntervals.push({
            start: s.start,
            end: s.end,
            start_str: s.start_str,
            end_str: s.end_str
          });
        }
      }
    }

    // Alocação nas colunas (INÍCIO, INTERVALO, VOLTA, TÉRMINO)
    const n = mergedIntervals.length;
    if (n === 1) {
      agrupado[dtStr].inicio = mergedIntervals[0].start_str;
      agrupado[dtStr].intervalo = '';
      agrupado[dtStr].volta = '';
      agrupado[dtStr].termino = mergedIntervals[0].end_str;
    } else if (n === 2) {
      agrupado[dtStr].inicio = mergedIntervals[0].start_str;
      agrupado[dtStr].intervalo = mergedIntervals[0].end_str;
      agrupado[dtStr].volta = mergedIntervals[1].start_str;
      agrupado[dtStr].termino = mergedIntervals[1].end_str;
    } else if (n >= 3) {
      agrupado[dtStr].inicio = mergedIntervals[0].start_str;
      agrupado[dtStr].intervalo = mergedIntervals[0].end_str;
      agrupado[dtStr].volta = mergedIntervals[1].start_str;
      agrupado[dtStr].termino = mergedIntervals[n - 1].end_str;
    }

    const totalDiaMin = mergedIntervals.reduce((acc, iv) => acc + (iv.end - iv.start), 0);
    agrupado[dtStr].duracaoMin = totalDiaMin;

    const semana = agrupado[dtStr].semana;
    if (semana === 'DOMINGO' || semana === 'FERIADO') {
      agrupado[dtStr].min100 = totalDiaMin;
    } else {
      agrupado[dtStr].min50 = totalDiaMin;
    }
  }

  const listaFinal = Object.keys(agrupado)
    .sort()
    .map((k) => {
      const item = agrupado[k];
      return {
        data: item.data,
        dia: String(item.data.getDate()).padStart(2, '0'),
        semana: item.semana,
        dataFormatada: `${String(item.data.getDate()).padStart(2, '0')}/${String(item.data.getMonth() + 1).padStart(2, '0')}/${item.data.getFullYear()}`,
        inicio: item.inicio,
        intervalo: item.intervalo,
        volta: item.volta,
        termino: item.termino,
        duracaoMin: item.duracaoMin,
        horasTrabalhadas: formatMinutes(item.duracaoMin),
        min50: item.min50,
        min100: item.min100,
        horas50: formatMinutes(item.min50),
        horas100: formatMinutes(item.min100),
        observacoes: item.obs.join(' | ').slice(0, 60)
      };
    });

  return listaFinal;
}

/**
 * Cria a definição de documento PDFMake espelhando exatamente a folha de ponto corporativa oficial.
 */
export function buildDocumentDefinition({ registros = [], plantonista = 'CAIQUE NOVAES', mes = 'JANEIRO', ano = '2026' }) {
  const dados = agruparParaPdf(registros, mes, ano);

  let totalWorkedMin = 0;
  let total50Min = 0;
  let total100Min = 0;

  const dataRows = dados.map((r) => {
    totalWorkedMin += r.duracaoMin;
    total50Min += r.min50;
    total100Min += r.min100;

    const isWeekendOrHoliday = ['SÁBADO', 'DOMINGO', 'FERIADO'].includes(r.semana);
    const bg = isWeekendOrHoliday ? GRAY_WEEKEND : undefined;

    return [
      { text: r.dia, alignment: 'center', fillColor: bg, border: [true, true, true, true] },
      { text: r.semana, alignment: 'center', fillColor: bg, border: [true, true, true, true] },
      { text: r.dataFormatada, alignment: 'center', fillColor: bg, border: [true, true, true, true] },
      { text: r.inicio, alignment: 'center', fillColor: bg, border: [true, true, true, true] },
      { text: r.intervalo, alignment: 'center', fillColor: bg, border: [true, true, true, true] },
      { text: r.volta, alignment: 'center', fillColor: bg, border: [true, true, true, true] },
      { text: r.termino, alignment: 'center', fillColor: bg, border: [true, true, true, true] },
      { text: r.horasTrabalhadas, alignment: 'center', fillColor: bg, border: [true, true, true, true] },
      { text: r.horas50, alignment: 'center', fillColor: bg, border: [true, true, true, true] },
      { text: r.horas100, alignment: 'center', fillColor: bg, border: [true, true, true, true] },
      { text: r.observacoes, alignment: 'left', fillColor: bg, border: [true, true, true, true], margin: [4, 0, 0, 0] }
    ];
  });

  const footerRow = [
    { text: '', border: [true, true, true, true] },
    { text: '', border: [true, true, true, true] },
    { text: '', border: [true, true, true, true] },
    { text: '', border: [true, true, true, true] },
    { text: '', border: [true, true, true, true] },
    { text: '', border: [true, true, true, true] },
    { text: 'TOTAL:', alignment: 'center', bold: true, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
    { text: formatMinutes(totalWorkedMin), alignment: 'center', bold: true, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
    { text: formatMinutes(total50Min), alignment: 'center', bold: true, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
    { text: formatMinutes(total100Min), alignment: 'center', bold: true, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
    { text: '', border: [true, true, true, true] }
  ];

  // ── Cabeçalho Unificado em 4 Linhas ──────────────────────────────────────────
  const headerTable = {
    table: {
      widths: colWidths,
      body: [
        // Linha 1: Título unificado cobrindo toda a largura (A1:K1)
        [
          { text: 'FOLHA DE HORA EXTRA', colSpan: 11, alignment: 'center', bold: true, fontSize: FS_TITLE, color: TEXT_HEADER, fillColor: HEADER_BG, border: [true, true, true, false] },
          {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
        ],
        // Linha 2: Espaçador interno
        [
          { text: ' ', colSpan: 11, fontSize: 3, fillColor: HEADER_BG, border: [true, false, true, false] },
          {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
        ],
        // Linha 3: Dados do plantonista espelhando o Excel
        [
          { text: 'COLABORADOR:', colSpan: 2, alignment: 'right', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: HEADER_BG, border: [true, false, false, false], margin: [0, 2, 4, 0] },
          {},
          { text: '', fillColor: HEADER_BG, border: [false, false, false, false] },
          { text: String(plantonista).toUpperCase(), colSpan: 2, alignment: 'left', bold: true, fontSize: FS_MAIN, color: TEXT_MAIN, fillColor: GRAY_NAME_BG, border: [true, true, true, true], margin: [4, 2, 0, 0] },
          {},
          { text: 'MÊS REFERENTE:', colSpan: 2, alignment: 'right', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: HEADER_BG, border: [false, false, false, false], margin: [0, 2, 4, 0] },
          {},
          { text: String(mes).toUpperCase(), alignment: 'center', bold: true, fontSize: FS_MAIN, color: TEXT_MAIN, fillColor: GRAY_NAME_BG, border: [true, true, true, true], margin: [0, 2, 0, 0] },
          { text: 'ANO:', alignment: 'right', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: HEADER_BG, border: [false, false, false, false], margin: [0, 2, 4, 0] },
          { text: String(ano), alignment: 'center', bold: true, fontSize: FS_MAIN, color: TEXT_MAIN, fillColor: GRAY_NAME_BG, border: [true, true, true, true], margin: [0, 2, 0, 0] },
          { text: '', fillColor: HEADER_BG, border: [false, false, true, false] }
        ],
        // Linha 4: Espaçador interno
        [
          { text: ' ', colSpan: 11, fontSize: 3, fillColor: HEADER_BG, border: [true, false, true, true] },
          {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
        ]
      ]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: (i, node, colIdx) => {
        if (i === 0 || i === 4) return '#000000';
        if ((i === 2 || i === 3) && [3, 4, 7, 9].includes(colIdx)) return '#000000';
        return HEADER_BG;
      },
      vLineColor: (i, node, rowIdx) => {
        if (i === 0 || i === 11) return '#000000';
        if (rowIdx === 2 && [3, 5, 7, 8, 9, 10].includes(i)) return '#000000';
        return HEADER_BG;
      },
      paddingLeft: (i) => (i === 10 ? 4 : 1),
      paddingRight: () => 1,
      paddingTop: (i) => (i === 1 || i === 3 ? 0 : 2),
      paddingBottom: (i) => (i === 1 || i === 3 ? 0 : 2)
    }
  };

  // ── Tabela Principal de Horas Trabalhadas ─────────────────────────────────────
  const mainTable = {
    table: {
      widths: colWidths,
      dontBreakRows: true,
      body: [
        // Linha 0 de Cabeçalho de Colunas
        [
          { text: 'DIA', rowSpan: 2, alignment: 'center', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
          { text: 'SEMANA', rowSpan: 2, alignment: 'center', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
          { text: 'DATA', rowSpan: 2, alignment: 'center', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
          { text: 'INÍCIO', rowSpan: 2, alignment: 'center', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
          { text: 'INTERVALO', rowSpan: 2, alignment: 'center', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
          { text: 'VOLTA', rowSpan: 2, alignment: 'center', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
          { text: 'TÉRMINO', rowSpan: 2, alignment: 'center', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
          { text: 'HORAS\nTRABALHADAS', rowSpan: 2, alignment: 'center', bold: true, fontSize: FS_MAIN * 0.9, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
          { text: 'Horas a Receber', colSpan: 2, alignment: 'center', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
          {},
          { text: 'OBSERVAÇÕES', rowSpan: 2, alignment: 'center', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] }
        ],
        // Linha 1 de Cabeçalho de Colunas (sub-colunas 50% e 100%)
        [
          {}, {}, {}, {}, {}, {}, {}, {},
          { text: '50%', alignment: 'center', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
          { text: '100%', alignment: 'center', bold: true, fontSize: FS_MAIN, color: TEXT_HEADER, fillColor: COL_HEADER_BG, border: [true, true, true, true] },
          {}
        ],
        ...dataRows,
        footerRow
      ]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
      paddingLeft: (i) => (i === 10 ? 4 : 1),
      paddingRight: () => 1,
      paddingTop: () => 1.5,
      paddingBottom: () => 1.5
    }
  };

  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [horizontalMargin, 14.175, horizontalMargin, 14.175],
    defaultStyle: {
      font: DEFAULT_FONT,
      fontSize: FS_MAIN,
      color: TEXT_MAIN
    },
    content: [
      headerTable,
      { text: '', margin: [0, 4, 0, 0] },
      mainTable
    ]
  };

  return docDefinition;
}

/**
 * Gera o PDF oficial em memória e retorna o documento pdfmake pronto para streaming ou buffer.
 */
export async function createPdfDocument(options) {
  const docDefinition = buildDocumentDefinition(options);
  return pdfmake.createPdf(docDefinition);
}

/**
 * Gera o arquivo PDF no caminho fornecido (compatível com CLI e modo arquivo).
 */
export async function generatePdfFile(options, outputPath) {
  const doc = await createPdfDocument(options);
  await doc.write(outputPath);
  return outputPath;
}

// Suporte para execução direta via CLI (substituindo pdf_generator.py)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  const inputIdx = args.indexOf('--input');
  const outputIdx = args.indexOf('--output');

  const outputPath = outputIdx !== -1 && args[outputIdx + 1] ? args[outputIdx + 1] : 'folha_horas_extras_node.pdf';

  if (isTest) {
    const testRegistros = [
      {
        data: '2026-05-02',
        inicio: '08:00',
        intervalo: '12:00',
        volta: '13:00',
        termino: '17:00',
        duracao_minutos: 480,
        motivo: 'Plantão de suporte aos hotéis',
        observacoes: 'Validação de virada'
      }
    ];

    generatePdfFile({
      registros: testRegistros,
      plantonista: 'CAIQUE NOVAES',
      mes: 'MAIO',
      ano: '2026'
    }, outputPath)
      .then((p) => {
        console.log(`TEST_OK: ${p}`);
        process.exit(0);
      })
      .catch((err) => {
        console.error('TEST_ERROR:', err);
        process.exit(1);
      });
  } else if (inputIdx !== -1 && args[inputIdx + 1]) {
    const inputPath = args[inputIdx + 1];
    try {
      const payload = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
      generatePdfFile(payload, outputPath)
        .then((p) => {
          console.log(`PDF_GENERATED: ${p}`);
          process.exit(0);
        })
        .catch((err) => {
          console.error('GEN_ERROR:', err);
          process.exit(1);
        });
    } catch (err) {
      console.error('Erro ao ler payload JSON:', err.message);
      process.exit(1);
    }
  } else {
    console.log('Uso: node OvertimePdfGenerator.js [--test] [--input payload.json --output saida.pdf]');
  }
}

export default {
  buildDocumentDefinition,
  createPdfDocument,
  generatePdfFile,
  agruparParaPdf
};
