import IncidentService from '../services/IncidentService.js';
import AuditService from '../services/AuditService.js';
import Scheduler from '../services/Scheduler.js';

const getTimestamp = () => {
  const d = new Date();
  const dateStr = d.toLocaleDateString('pt-BR');
  const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} ${timeStr}`;
};

class IncidentController {
  static async getAll(req, res) {
    try {
      const { status } = req.query;
      const incidentes = await IncidentService.getAll(status || 'Aberto');
      res.json(incidentes);
    } catch (err) {
      AuditService.error('Erro ao listar incidentes', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const ts = getTimestamp();
      const id = await IncidentService.create(req.body, ts);
      AuditService.log('INCIDENTE_CRIADO', `ID: ${id} (Caso: ${req.body.caso || '-'}, Incidente: ${req.body.incidente})`, id);
      Scheduler.scheduleBackup();
      res.json({ id });
    } catch (err) {
      AuditService.error('Erro ao criar incidente', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const anterior = await IncidentService.getById(id);
      if (!anterior) return res.status(404).json({ error: 'Incidente não encontrado' });

      const ts = getTimestamp();
      let tsUpdate = null;
      const situacaoAnterior = anterior.situacao || '';
      const statusAnterior = anterior.status || '';
      const situacaoNova = req.body.situacao || '';
      const statusNovo = req.body.status || '';

      if (situacaoNova !== situacaoAnterior || statusNovo !== statusAnterior || req.body.forcar_historico) {
        tsUpdate = ts;
        await IncidentService.addHistory(id, situacaoNova, ts);
      }

      const mergedData = {
        ...anterior,
        ...req.body
      };

      if (!mergedData.status || mergedData.status.trim() === '') {
        mergedData.status = 'Aberto';
      }

      await IncidentService.update(id, mergedData, tsUpdate);
      AuditService.log('INCIDENTE_ATUALIZADO', `ID: ${id} (Status: ${mergedData.status})`, id);
      Scheduler.scheduleBackup();
      res.json({ success: true });
    } catch (err) {
      AuditService.error('Erro ao atualizar incidente', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await IncidentService.delete(id);
      AuditService.log('INCIDENTE_EXCLUIDO', `ID: ${id}`, id);
      Scheduler.scheduleBackup();
      res.json({ success: true });
    } catch (err) {
      AuditService.error('Erro ao excluir incidente', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async getHistory(req, res) {
    try {
      const { id } = req.params;
      const historico = await IncidentService.getHistory(id);
      res.json(historico);
    } catch (err) {
      AuditService.error('Erro ao buscar histórico', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async reorder(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs inválidos' });
      await IncidentService.reordenar(ids);
      AuditService.log('INCIDENTES_REORDENADOS', `${ids.length} itens movidos`);
      Scheduler.scheduleBackup();
      res.json({ success: true });
    } catch (err) {
      AuditService.error('Erro ao reordenar incidentes', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async getChamadosFilhos(req, res) {
    try {
      const { id } = req.params;
      const chamados = await IncidentService.getChamadosFilhos(id);
      res.json(chamados);
    } catch (err) {
      AuditService.error('Erro ao buscar chamados filhos', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async addChamadoFilho(req, res) {
    try {
      const { id } = req.params;
      const chamadoId = await IncidentService.addChamadoFilho(id, req.body);
      AuditService.log('CHAMADO_FILHO_ADICIONADO', `Incidente: ${id}, Ticket: ${req.body.ticket}`, id);
      Scheduler.scheduleBackup();
      res.json({ id: chamadoId });
    } catch (err) {
      AuditService.error('Erro ao adicionar chamado filho', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async removeChamadoFilho(req, res) {
    try {
      const { idChamado } = req.params;
      await IncidentService.removeChamadoFilho(idChamado);
      AuditService.log('CHAMADO_FILHO_REMOVIDO', `ID Chamado Filho: ${idChamado}`);
      Scheduler.scheduleBackup();
      res.json({ success: true });
    } catch (err) {
      AuditService.error('Erro ao remover chamado filho', err);
      res.status(500).json({ error: err.message });
    }
  }
}

export default IncidentController;
