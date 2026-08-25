/* global process */
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import { initDb, getMetrics, saveMetric, getSetting, saveSetting, updateSlaMetrics, updateNpsGeneralMetrics } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import Holidays from 'date-holidays';

const hd = new Holidays('BR', 'SP');

// Helper para verificar feriados municipais de São Paulo
const isMunicipalHoliday = (dateObj) => {
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  // 25 de Janeiro: Aniversário da Cidade de São Paulo
  if (month === 1 && day === 25) return true;
  // 20 de Novembro: Dia da Consciência Negra
  if (month === 11 && day === 20) return true;
  return false;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ── Multer: armazena o CSV em uploads/ dentro de server/ ──────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: uploadDir });

// ── Mapeamento numérico de mês → nome PT-BR ───────────────────────────────────
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// ── SLA por prioridade (em segundos) ─────────────────────────────────────────
const SLA_LIMITS = {
  '1': 4  * 3600,   // P1 → 4 h
  '2': 24 * 3600,   // P2 → 24 h
  '3': 48 * 3600,   // P3 → 48 h
  '4': 96 * 3600,   // P4 → 96 h
};

// ── Cálculo de horas úteis (Segunda a Sexta, 9:00 às 18:00) ──────────────────
const calculateBusinessSeconds = (start, end) => {
  if (start >= end) return 0;
  
  let current = new Date(start);
  let totalSeconds = 0;

  while (current < end) {
    const dayOfWeek = current.getDay();
    // Segunda(1) a Sexta(5) e não é feriado nacional, estadual ou municipal
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !hd.isHoliday(current) && !isMunicipalHoliday(current)) {
      const workStart = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 9, 0, 0, 0);
      const workEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 18, 0, 0, 0);

      const effectiveStart = new Date(Math.max(current, workStart));
      const effectiveEnd = new Date(Math.min(end, workEnd));

      if (effectiveStart < effectiveEnd) {
        totalSeconds += (effectiveEnd - effectiveStart) / 1000;
      }
    }

    // Avança para o dia seguinte à meia-noite
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 0, 0);
  }

  return totalSeconds;
};

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize Database
initDb();

// API Routes
app.get('/api/metrics', async (req, res) => {
  try {
    const { year } = req.query;
    const metrics = await getMetrics(year ? parseInt(year) : null);
    const nps_general = await getSetting('nps_general');
    res.json({ metrics, nps_general });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/metrics', async (req, res) => {
  try {
    const { year, month, closed_count, evaluated_count, nps, nps_general, is_vacation, is_project, within_sla_count, perfect_fix_count } = req.body;
    await saveMetric({ year, month, closed_count, evaluated_count, nps, nps_general, is_vacation, is_project, within_sla_count, perfect_fix_count });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    await saveSetting(key, value);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ── POST /api/upload-metrics ─────────────────────────────────────────────────
app.post('/api/upload-metrics', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const filePath = req.file.path;

  // Accumulate per-month totals: { 'YYYY-MM': { within_sla: N, perfect_fix: N } }
  const monthTotals = {};

  const rows = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (row) => rows.push(row))
    .on('end', async () => {
      // ── Higiene: remove o arquivo temporário ────────────────────────────
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.warn('[Upload] Aviso: não foi possível remover arquivo temp:', unlinkErr.message);
        else console.log('[Upload] Arquivo temporário removido:', filePath);
      });

      // ── Diagnóstico: mostra as colunas reais do CSV ──────────────────────
      if (rows.length > 0) {
        const sampleKeys = Object.keys(rows[0]).map(k => k.trim().replace(/^\uFEFF/, ''));
        console.log('[Upload] Colunas detectadas:', sampleKeys);
        console.log('[Upload] Primeira linha (amostra):', JSON.stringify(rows[0], null, 2));
      }

      // ── Parseia datas de forma robusta (suporta "YYYY-MM-DD HH:mm:ss") ──────
      const parseDate = (str) => {
        if (!str || !str.trim()) return null;
        // Substitui espaço por T para tornar ISO-8601 válido no Node.js
        const iso = str.trim().replace(' ', 'T');
        const d = new Date(iso);
        return isNaN(d) ? null : d;
      };

      // ── Processar cada linha ────────────────────────────────────────────
      let skipped = 0;
      for (const row of rows) {
        // Normaliza chaves (remove BOM e espaços)
        const normalizedRow = {};
        for (const key of Object.keys(row)) {
          normalizedRow[key.trim().replace(/^\uFEFF/, '')] = (row[key] || '').trim();
        }

        const createdStr  = normalizedRow['sys_created_on'] || normalizedRow['Created'] || normalizedRow['created'] || normalizedRow['Opened']   || normalizedRow['opened']   || '';
        const resolvedStr = normalizedRow['resolved_at'] || normalizedRow['Resolved at'] || normalizedRow['resolved at'] || normalizedRow['closed_at'] || normalizedRow['Closed'] || normalizedRow['closed'] || '';
        const updatedStr  = normalizedRow['sys_updated_on'] || normalizedRow['Updated'] || normalizedRow['updated'] || normalizedRow['Resolved'] || normalizedRow['resolved'] || '';
        const priorityRaw = normalizedRow['priority']        || normalizedRow['Priority'] || '';
        const reopenRaw   = normalizedRow['u_reopen_count']  || normalizedRow['Reopen count'] || normalizedRow['reopen_count'] || normalizedRow['reopenCount'] || '0';

        // Prioriza a data de resolução final. Se não existir, usa a data de última atualização (fallback).
        const endStr = resolvedStr || updatedStr;

        const createdAt = parseDate(createdStr);
        const updatedAt = parseDate(endStr);

        if (!createdAt || !updatedAt) {
          skipped++;
          continue;
        }

        // Extrai dígito da prioridade (ex.: "1 - Critical" → "1", "P2" → "2")
        const priorityMatch = priorityRaw.match(/(\d)/);
        const priorityKey   = priorityMatch ? priorityMatch[1] : null;

        // Duração em segundos: P1 e P2 usam tempo absoluto (24x7); P3 e P4 usam horas úteis
        let durationSec;
        if (priorityKey === '1' || priorityKey === '2') {
          durationSec = (updatedAt - createdAt) / 1000;
        } else {
          durationSec = calculateBusinessSeconds(createdAt, updatedAt);
        }

        const slaLimit      = priorityKey ? SLA_LIMITS[priorityKey] : null;

        const withinSla   = slaLimit !== null && durationSec <= slaLimit;
        const reopenCount = parseInt(reopenRaw, 10) || 0;
        const perfectFix  = withinSla && reopenCount === 0;

        const targetYear = parseInt(req.body.targetYear, 10);
        
        // Agrupa por YYYY-MM usando a coluna Updated
        const yearKey   = updatedAt.getFullYear();
        
        // Ignora chamados que não pertencem ao ano que o usuário selecionou no dashboard
        if (!isNaN(targetYear) && yearKey !== targetYear) {
          skipped++;
          continue;
        }

        const monthKey  = updatedAt.getMonth(); // 0-indexed
        const bucketKey = `${yearKey}-${String(monthKey + 1).padStart(2, '0')}`;

        if (!monthTotals[bucketKey]) {
          monthTotals[bucketKey] = { year: yearKey, month: monthKey, within_sla: 0, perfect_fix: 0, closed_count: 0 };
        }
        
        monthTotals[bucketKey].closed_count++;
        if (withinSla)  monthTotals[bucketKey].within_sla++;
        if (perfectFix) monthTotals[bucketKey].perfect_fix++;
      }

      if (skipped > 0) {
        console.warn(`[Upload] ${skipped} linha(s) ignorada(s) por datas inválidas ou ausentes.`);
      }

      // ── Persistir no banco ──────────────────────────────────────────────
      try {
        const updates = Object.values(monthTotals);
        for (const entry of updates) {
          const monthName = MONTH_NAMES[entry.month];
          await updateSlaMetrics(entry.year, monthName, entry.within_sla, entry.perfect_fix, entry.closed_count);
        }

        console.log(`[Upload] CSV processado: ${rows.length} linhas, ${skipped} ignoradas, ${updates.length} meses atualizados.`);
        res.json({
          success: true,
          rows_processed: rows.length,
          rows_skipped: skipped,
          months_updated: updates.length,
          summary: Object.fromEntries(
            Object.entries(monthTotals).map(([k, v]) => [
              k,
              { within_sla: v.within_sla, perfect_fix: v.perfect_fix }
            ])
          )
        });
      } catch (dbErr) {
        console.error('[Upload] Erro ao atualizar banco:', dbErr.message);
        res.status(500).json({ error: 'Erro ao salvar métricas no banco.', detail: dbErr.message });
      }
    })
    .on('error', (parseErr) => {
      console.error('[Upload] Erro ao parsear CSV:', parseErr.message);
      fs.unlink(filePath, () => {});
      res.status(400).json({ error: 'Falha ao ler o arquivo CSV.', detail: parseErr.message });
    });
});

// ── POST /api/upload-json ───────────────────────────────────────────────────
app.post('/api/upload-json', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const filePath = req.file.path;
  fs.readFile(filePath, 'utf8', async (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao ler arquivo.' });
    }

    try {
      const json = JSON.parse(data);
      const records = json.records || [];
      const targetYear = parseInt(req.body.targetYear, 10);

      const monthTotals = {};
      let skipped = 0;

      for (const record of records) {
        const actualValueStr = record.actual_value;
        const updatedOnStr = record.sys_updated_on;

        if (!actualValueStr || !updatedOnStr) {
          skipped++;
          continue;
        }

        const val = parseFloat(actualValueStr);
        if (isNaN(val)) {
          skipped++;
          continue;
        }

        const dateStr = updatedOnStr.replace(' ', 'T');
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          skipped++;
          continue;
        }

        const yearKey = date.getFullYear();
        if (!isNaN(targetYear) && yearKey !== targetYear) {
          skipped++;
          continue;
        }

        const monthKey = date.getMonth(); // 0-11
        const bucketKey = `${yearKey}-${String(monthKey + 1).padStart(2, '0')}`;

        if (!monthTotals[bucketKey]) {
          monthTotals[bucketKey] = { year: yearKey, month: monthKey, sum: 0, count: 0 };
        }

        monthTotals[bucketKey].sum += val;
        monthTotals[bucketKey].count++;
      }

      fs.unlink(filePath, () => {});

      const updates = Object.values(monthTotals);
      for (const entry of updates) {
        const monthName = MONTH_NAMES[entry.month];
        const npsGeneral = Number((entry.sum / entry.count).toFixed(2));
        await updateNpsGeneralMetrics(entry.year, monthName, npsGeneral);
      }
      
      console.log(`[Upload JSON] ${records.length} registros, ${skipped} ignorados, ${updates.length} meses atualizados.`);
      res.json({
        success: true,
        rows_processed: records.length,
        rows_skipped: skipped,
        months_updated: updates.length
      });
    } catch (parseErr) {
      console.error('[Upload JSON] Erro ao parsear JSON:', parseErr.message);
      fs.unlink(filePath, () => {});
      res.status(400).json({ error: 'Falha ao processar o arquivo JSON.', detail: parseErr.message });
    }
  });
});

// Serve static files from Vite's build output (dist)
app.use(express.static(path.join(__dirname, '../dist')));

// SPA Catch-all: Route anything not matching an API or static file to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
