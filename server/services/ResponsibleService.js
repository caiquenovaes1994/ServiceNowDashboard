import { dbAll, dbGet, dbRun } from '../database.js';

class ResponsibleService {
  static async getAll() {
    return await dbAll('SELECT * FROM responsaveis ORDER BY nome ASC');
  }

  static async getById(id) {
    return await dbGet('SELECT * FROM responsaveis WHERE id = ?', [id]);
  }

  static async create(data) {
    const { nome, equipe, ativo } = data;
    const statusAtivo = ativo !== undefined ? (ativo ? 1 : 0) : 1;
    const result = await dbRun(
      'INSERT INTO responsaveis (nome, equipe, ativo) VALUES (?, ?, ?)',
      [nome, equipe, statusAtivo]
    );
    return result.lastID;
  }

  static async update(id, data) {
    const { nome, equipe, ativo } = data;
    const current = await ResponsibleService.getById(id);
    const statusAtivo = ativo !== undefined ? (ativo ? 1 : 0) : (current && current.ativo !== undefined ? current.ativo : 1);
    await dbRun(
      'UPDATE responsaveis SET nome = ?, equipe = ?, ativo = ? WHERE id = ?',
      [nome, equipe, statusAtivo, id]
    );
    return { success: true };
  }

  static async delete(id) {
    const countInc = await dbGet('SELECT COUNT(*) as c FROM incidentes WHERE id_responsavel = ?', [id]);
    const total = countInc?.c || 0;

    if (total > 0) {
      await dbRun('UPDATE responsaveis SET ativo = 0 WHERE id = ?', [id]);
      return { inativado: true, incidentes: total };
    } else {
      await dbRun('DELETE FROM responsaveis WHERE id = ?', [id]);
      return { inativado: false, deletado: true };
    }
  }
}

export default ResponsibleService;
