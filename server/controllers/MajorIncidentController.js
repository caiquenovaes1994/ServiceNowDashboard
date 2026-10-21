import MajorIncidentService from '../services/MajorIncidentService.js';
import AuditService from '../services/AuditService.js';
import Scheduler from '../services/Scheduler.js';

class MajorIncidentController {
  static async getAll(req, res) {
    try {
      const records = await MajorIncidentService.getMajorIncidents();
      res.json(records);
    } catch (err) {
      AuditService.error('Erro ao buscar major incidents', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async toggleResponsibility(req, res) {
    try {
      const { numero } = req.params;
      const { minha_responsabilidade } = req.body;
      const result = await MajorIncidentService.toggleMajorResponsibility(numero, minha_responsabilidade);
      AuditService.log(
        'MAJOR_RESPONSABILIDADE_TOGGLE',
        `Incidente: ${numero}, Minha Responsabilidade: ${minha_responsabilidade ? 'SIM' : 'NÃO'}`,
        null,
        'incidentes_maiores'
      );
      Scheduler.scheduleBackup();
      res.json(result);
    } catch (err) {
      AuditService.error('Erro ao alterar responsabilidade de major incident', err);
      res.status(500).json({ error: err.message });
    }
  }
}

export default MajorIncidentController;
