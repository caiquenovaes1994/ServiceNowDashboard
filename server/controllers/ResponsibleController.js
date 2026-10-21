import ResponsibleService from '../services/ResponsibleService.js';
import AuditService from '../services/AuditService.js';
import Scheduler from '../services/Scheduler.js';

class ResponsibleController {
  static async getAll(req, res) {
    try {
      const responsaveis = await ResponsibleService.getAll();
      res.json(responsaveis);
    } catch (err) {
      AuditService.error('Erro ao listar responsáveis', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const id = await ResponsibleService.create(req.body);
      AuditService.log('RESPONSAVEL_CRIADO', `Nome: ${req.body.nome}, Equipe: ${req.body.equipe}`, id, 'responsaveis');
      Scheduler.scheduleBackup();
      res.json({ id });
    } catch (err) {
      AuditService.error('Erro ao cadastrar responsável', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      await ResponsibleService.update(id, req.body);
      AuditService.log('RESPONSAVEL_ATUALIZADO', `ID: ${id}, Nome: ${req.body.nome}`, id, 'responsaveis');
      Scheduler.scheduleBackup();
      res.json({ success: true });
    } catch (err) {
      AuditService.error('Erro ao atualizar responsável', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await ResponsibleService.delete(id);
      AuditService.log(
        result.inativado ? 'RESPONSAVEL_INATIVADO' : 'RESPONSAVEL_EXCLUIDO',
        `ID: ${id}`,
        id,
        'responsaveis'
      );
      Scheduler.scheduleBackup();
      res.json(result);
    } catch (err) {
      AuditService.error('Erro ao deletar/inativar responsável', err);
      res.status(500).json({ error: err.message });
    }
  }
}

export default ResponsibleController;
