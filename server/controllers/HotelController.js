import HotelService from '../services/HotelService.js';
import AuditService from '../services/AuditService.js';
import Scheduler from '../services/Scheduler.js';

class HotelController {
  static async getAll(req, res) {
    try {
      const hoteis = await HotelService.getAll();
      res.json(hoteis);
    } catch (err) {
      AuditService.error('Erro ao listar hotéis', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const id = await HotelService.create(req.body);
      AuditService.log('HOTEL_CRIADO', `RID: ${req.body.rid}, Nome: ${req.body.nome}`, id, 'hoteis');
      Scheduler.scheduleBackup();
      res.json({ id });
    } catch (err) {
      AuditService.error('Erro ao cadastrar hotel', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      await HotelService.update(id, req.body);
      AuditService.log('HOTEL_ATUALIZADO', `ID: ${id}, Nome: ${req.body.nome}`, id, 'hoteis');
      Scheduler.scheduleBackup();
      res.json({ success: true });
    } catch (err) {
      AuditService.error('Erro ao atualizar hotel', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await HotelService.delete(id);
      AuditService.log(
        result.inativado ? 'HOTEL_INATIVADO' : 'HOTEL_EXCLUIDO',
        `ID: ${id}`,
        id,
        'hoteis'
      );
      Scheduler.scheduleBackup();
      res.json(result);
    } catch (err) {
      AuditService.error('Erro ao deletar/inativar hotel', err);
      res.status(500).json({ error: err.message });
    }
  }
}

export default HotelController;
