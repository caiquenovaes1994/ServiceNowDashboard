import { dbAll, dbGet, dbRun } from '../database.js';

class HotelService {
  static async getAll() {
    return await dbAll('SELECT * FROM hoteis ORDER BY rid ASC, nome ASC');
  }

  static async getById(id) {
    return await dbGet('SELECT * FROM hoteis WHERE id = ?', [id]);
  }

  static async getByRid(rid) {
    return await dbGet('SELECT * FROM hoteis WHERE rid = ?', [rid]);
  }

  static async create(data) {
    const { rid, nome, ativo } = data;
    const statusAtivo = ativo !== undefined ? (ativo ? 1 : 0) : 1;
    const result = await dbRun(
      'INSERT INTO hoteis (rid, nome, ativo) VALUES (?, ?, ?)',
      [rid, nome, statusAtivo]
    );
    return result.lastID;
  }

  static async update(id, data) {
    const { rid, nome, ativo } = data;
    const current = await HotelService.getById(id);
    const statusAtivo = ativo !== undefined ? (ativo ? 1 : 0) : (current && current.ativo !== undefined ? current.ativo : 1);
    await dbRun(
      'UPDATE hoteis SET rid = ?, nome = ?, ativo = ? WHERE id = ?',
      [rid, nome, statusAtivo, id]
    );
    return { success: true };
  }

  static async delete(id) {
    const countInc = await dbGet('SELECT COUNT(*) as c FROM incidentes WHERE id_hotel = ?', [id]);
    const countFilhos = await dbGet('SELECT COUNT(*) as c FROM chamados_filhos WHERE id_hotel = ?', [id]);
    const total = (countInc?.c || 0) + (countFilhos?.c || 0);

    if (total > 0) {
      await dbRun('UPDATE hoteis SET ativo = 0 WHERE id = ?', [id]);
      return { inativado: true, incidentes: total };
    } else {
      await dbRun('DELETE FROM hoteis WHERE id = ?', [id]);
      return { inativado: false, deletado: true };
    }
  }
}

export default HotelService;
