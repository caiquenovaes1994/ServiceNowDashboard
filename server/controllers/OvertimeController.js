import { dbAll, dbGet, dbRun, triggerBackup } from '../database.js';
import OvertimeHolidayService from '../services/OvertimeHolidayService.js';
import OvertimeTimeUtils from '../services/OvertimeTimeUtils.js';
import OvertimePdfService from '../services/OvertimePdfService.js';
import CryptoService from '../services/CryptoService.js';
import fs from 'fs';

function formatCurrency(val) {
  if (!val || val <= 0) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export class OvertimeController {
  static async getChamados(req, res) {
    try {
      const { mes = 'JANEIRO', ano = String(new Date().getFullYear()) } = req.query;
      const faixa = OvertimeTimeUtils.obterFaixaPeriodo(mes, ano);

      const rows = await dbAll(
        `SELECT id, data, caso, pms, hotel, inicio, intervalo, volta, termino, observacoes, motivo, valor_base_snapshot
         FROM chamados
         WHERE data >= ? AND data <= ?
         ORDER BY data ASC, inicio ASC`,
        [faixa.dataInicioStr, faixa.dataFimStr]
      );

      const salaryRow = await dbGet("SELECT value FROM overtime_config WHERE key = 'base_salary'");
      const baseSalary = salaryRow ? CryptoService.decryptNumber(salaryRow.value, 0) : 0;
      const divisor = 200.0;

      // Identificar registros sobrepostos no mesmo dia
      const chamadosPorDia = {};
      rows.forEach((r) => {
        if (!chamadosPorDia[r.data]) chamadosPorDia[r.data] = [];
        chamadosPorDia[r.data].push(r);
      });

      const overlappingIds = new Set();
      Object.values(chamadosPorDia).forEach((diaRows) => {
        if (diaRows.length < 2) return;
        for (let i = 0; i < diaRows.length; i++) {
          for (let j = i + 1; j < diaRows.length; j++) {
            const a = diaRows[i];
            const b = diaRows[j];
            const aStart = OvertimeTimeUtils.timeToMinutes(a.inicio);
            const aEnd = OvertimeTimeUtils.timeToMinutes(a.termino);
            const bStart = OvertimeTimeUtils.timeToMinutes(b.inicio);
            const bEnd = OvertimeTimeUtils.timeToMinutes(b.termino);
            // Verifica sobreposição real de horários
            if (aStart < bEnd && bStart < aEnd) {
              overlappingIds.add(a.id);
              overlappingIds.add(b.id);
            }
          }
        }
      });

      const chamadosFormatados = rows.map((r) => {
        const duracaoMin = OvertimeTimeUtils.calcularDuracaoTotal(r.inicio, r.intervalo, r.volta, r.termino);
        const diaSemana = OvertimeHolidayService.getDiaSemana(r.data);
        const is100 = diaSemana === 'DOMINGO' || diaSemana === 'FERIADO';
        const isOvernight = OvertimeTimeUtils.isHorarioOvernight(r.inicio, r.termino);

        return {
          id: r.id,
          data: r.data,
          diaSemana,
          isFeriadoOuDomingo: is100,
          isOvernight,
          isOverlapping: overlappingIds.has(r.id),
          caso: r.caso || '',
          pms: r.pms || '',
          hotel: r.hotel || '',
          hotelCompleto: r.pms && r.hotel ? `${r.pms} - ${r.hotel}` : r.hotel || r.pms || '—',
          inicio: r.inicio || '',
          intervalo: r.intervalo || '',
          volta: r.volta || '',
          termino: r.termino || '',
          duracaoMinutos: duracaoMin,
          duracaoFormatada: OvertimeTimeUtils.formatarMinutos(duracaoMin),
          observacoes: r.observacoes || '',
          motivo: r.motivo || ''
        };
      });

      // Cálculo apurado oficial: trata virada de noite e agrupa sobreposições
      // Cada apontamento utiliza seu próprio valor_base_snapshot histórico,
      // garantindo que alterações salariais futuras NÃO afetem valores de períodos anteriores.
      const totais = OvertimeTimeUtils.calcularTotaisPeriodo(
        rows,
        (dt) => OvertimeHolidayService.isHoliday(dt),
        baseSalary,
        divisor
      );
      const total50Min = totais.total50Min;
      const total100Min = totais.total100Min;
      const totalGeralMin = totais.totalGeralMin;
      const ganhoTotal = totais.ganhoTotal;

      const mediaMin = rows.length > 0 ? Math.round(totalGeralMin / rows.length) : 0;

      res.json({
        chamados: chamadosFormatados,
        kpis: {
          totalHoras50: OvertimeTimeUtils.formatarMinutos(total50Min),
          totalHoras100: OvertimeTimeUtils.formatarMinutos(total100Min),
          ganhosEstimados: formatCurrency(ganhoTotal),
          ganhoNumerico: ganhoTotal,
          totalChamados: rows.length,
          mediaChamado: OvertimeTimeUtils.formatarMinutos(mediaMin)
        },
        periodo: {
          mes: faixa.mesExtenso,
          ano: faixa.ano,
          dataInicio: faixa.dataInicioStr,
          dataFim: faixa.dataFimStr
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createChamado(req, res) {
    try {
      const { data, caso, pms, hotel, inicio, intervalo, volta, termino, observacoes, motivo } = req.body;

      if (!data || !inicio || !termino || !motivo || !String(motivo).trim()) {
        return res.status(400).json({ error: 'Campos obrigatórios: Data, Início, Término e Motivo.' });
      }

      const inicioFmt = OvertimeTimeUtils.processarInputHorario(inicio);
      const terminoFmt = OvertimeTimeUtils.processarInputHorario(termino);
      const intervaloFmt = OvertimeTimeUtils.processarInputHorario(intervalo);
      const voltaFmt = OvertimeTimeUtils.processarInputHorario(volta);

      if (!inicioFmt || !terminoFmt) {
        return res.status(400).json({ error: 'Formato de horário inválido para Início ou Término (ex: 08:00 ou 0800).' });
      }

      // Busca o salário vigente na data do apontamento no histórico (ou fallback para overtime_config)
      const histRow = await dbGet(
        `SELECT salario FROM overtime_salary_history 
         WHERE data_vigencia <= ? 
         ORDER BY data_vigencia DESC, id DESC LIMIT 1`,
        [data]
      );
      let baseSalaryNum = histRow ? CryptoService.decryptNumber(histRow.salario, null) : null;
      if (baseSalaryNum === null) {
        const salaryRow = await dbGet("SELECT value FROM overtime_config WHERE key = 'base_salary'");
        baseSalaryNum = salaryRow ? CryptoService.decryptNumber(salaryRow.value, 0) : 0;
      }
      const encSnapshot = CryptoService.encrypt(baseSalaryNum);

      const result = await dbRun(
        `INSERT INTO chamados (data, caso, pms, hotel, inicio, intervalo, volta, termino, observacoes, motivo, valor_base_snapshot)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data,
          caso ? String(caso).trim() : null,
          pms ? String(pms).trim() : null,
          hotel ? String(hotel).trim() : null,
          inicioFmt,
          intervaloFmt || null,
          voltaFmt || null,
          terminoFmt,
          observacoes ? String(observacoes).trim() : null,
          String(motivo).trim(),
          encSnapshot
        ]
      );

      triggerBackup();
      res.json({ success: true, id: result.lastID, message: 'Apontamento registrado com sucesso!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateChamado(req, res) {
    try {
      const { id } = req.params;
      const { data, caso, pms, hotel, inicio, intervalo, volta, termino, observacoes, motivo } = req.body;

      if (!data || !inicio || !termino || !motivo || !String(motivo).trim()) {
        return res.status(400).json({ error: 'Campos obrigatórios: Data, Início, Término e Motivo.' });
      }

      const inicioFmt = OvertimeTimeUtils.processarInputHorario(inicio);
      const terminoFmt = OvertimeTimeUtils.processarInputHorario(termino);
      const intervaloFmt = OvertimeTimeUtils.processarInputHorario(intervalo);
      const voltaFmt = OvertimeTimeUtils.processarInputHorario(volta);

      await dbRun(
        `UPDATE chamados
         SET data = ?, caso = ?, pms = ?, hotel = ?, inicio = ?, intervalo = ?, volta = ?, termino = ?, observacoes = ?, motivo = ?
         WHERE id = ?`,
        [
          data,
          caso ? String(caso).trim() : null,
          pms ? String(pms).trim() : null,
          hotel ? String(hotel).trim() : null,
          inicioFmt,
          intervaloFmt || null,
          voltaFmt || null,
          terminoFmt,
          observacoes ? String(observacoes).trim() : null,
          String(motivo).trim(),
          id
        ]
      );

      triggerBackup();
      res.json({ success: true, message: 'Apontamento atualizado com sucesso!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteChamado(req, res) {
    try {
      const { id } = req.params;
      await dbRun('DELETE FROM chamados WHERE id = ?', [id]);
      triggerBackup();
      res.json({ success: true, message: 'Apontamento excluído!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async bulkDeleteChamados(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Nenhum registro selecionado para exclusão.' });
      }

      const placeholders = ids.map(() => '?').join(',');
      await dbRun(`DELETE FROM chamados WHERE id IN (${placeholders})`, ids);

      triggerBackup();
      res.json({ success: true, message: `${ids.length} apontamento(s) excluído(s) com sucesso!` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async downloadPdf(req, res) {
    try {
      const { mes = 'JANEIRO', ano = String(new Date().getFullYear()) } = req.query;
      const faixa = OvertimeTimeUtils.obterFaixaPeriodo(mes, ano);

      const rows = await dbAll(
        `SELECT id, data, inicio, intervalo, volta, termino, observacoes, motivo
         FROM chamados
         WHERE data >= ? AND data <= ?
         ORDER BY data ASC, inicio ASC`,
        [faixa.dataInicioStr, faixa.dataFimStr]
      );

      const nameRow = await dbGet("SELECT value FROM overtime_config WHERE key = 'collaborator_name'");
      const plantonista = nameRow ? nameRow.value : 'CAIQUE NOVAES';

      const registrosProcessados = rows.map((r) => {
        const duracaoMin = OvertimeTimeUtils.calcularDuracaoTotal(r.inicio, r.intervalo, r.volta, r.termino);
        return {
          data: r.data,
          inicio: r.inicio || '',
          intervalo: r.intervalo || '',
          volta: r.volta || '',
          termino: r.termino || '',
          duracao_minutos: duracaoMin,
          motivo: r.motivo || '',
          // Estritamente e exclusivamente o que o usuário preencheu no campo Observações
          observacoes: (r.observacoes && typeof r.observacoes === 'string') ? r.observacoes.trim() : ''
        };
      });

      const { pdfPath, cleanup } = await OvertimePdfService.generateOvertimePdf({
        registros: registrosProcessados,
        plantonista,
        mes: faixa.mesExtenso,
        ano: faixa.ano
      });

      const fileName = `Folha_Horas_Extras_${faixa.mesExtenso}_${faixa.ano}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
      fileStream.on('close', () => {
        cleanup();
      });
      fileStream.on('error', (err) => {
        console.error('[OvertimeController] Erro no stream do PDF:', err.message);
        cleanup();
        res.status(500).end();
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default OvertimeController;
