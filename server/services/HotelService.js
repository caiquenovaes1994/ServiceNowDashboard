import { dbAll, dbGet, dbRun } from '../database.js';

class HotelService {
  static async getAll(rede = null) {
    if (rede) {
      return await dbAll(
        'SELECT * FROM hoteis WHERE rede = ? ORDER BY CASE WHEN rid IS NULL THEN 1 ELSE 0 END, rid ASC, nome ASC',
        [rede]
      );
    }
    return await dbAll(
      'SELECT * FROM hoteis ORDER BY rede ASC, CASE WHEN rid IS NULL THEN 1 ELSE 0 END, rid ASC, nome ASC'
    );
  }

  static async getById(id) {
    return await dbGet('SELECT * FROM hoteis WHERE id = ?', [id]);
  }

  static async getByRid(rid) {
    if (!rid) return null;
    return await dbGet('SELECT * FROM hoteis WHERE rid = ?', [rid]);
  }

  static async create(data) {
    const { rid, nome, ativo, rede } = data;
    const cleanRid = rid && typeof rid === 'string' && rid.trim() !== '' ? rid.trim() : null;
    const hotelRede = ['Accor', 'Intercity', 'Emiliano'].includes(rede) ? rede : 'Accor';
    const statusAtivo = ativo !== undefined ? (ativo ? 1 : 0) : 1;
    const result = await dbRun(
      'INSERT INTO hoteis (rid, nome, ativo, rede) VALUES (?, ?, ?, ?)',
      [cleanRid, nome, statusAtivo, hotelRede]
    );
    return result.lastID;
  }

  static async update(id, data) {
    const { rid, nome, ativo, rede } = data;
    const current = await HotelService.getById(id);
    const cleanRid = rid && typeof rid === 'string' && rid.trim() !== '' ? rid.trim() : null;
    const hotelRede = rede !== undefined ? rede : (current?.rede || 'Accor');
    const statusAtivo = ativo !== undefined ? (ativo ? 1 : 0) : (current && current.ativo !== undefined ? current.ativo : 1);
    await dbRun(
      'UPDATE hoteis SET rid = ?, nome = ?, ativo = ?, rede = ? WHERE id = ?',
      [cleanRid, nome, statusAtivo, hotelRede, id]
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
