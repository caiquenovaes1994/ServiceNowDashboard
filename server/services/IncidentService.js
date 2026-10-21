import { dbAll, dbGet, dbRun } from '../database.js';

class IncidentService {
  static async getAll(status = 'Aberto') {
    let sql = `
      SELECT i.*, h.nome as hotel_nome, h.rid as hotel_rid, r.nome as responsavel_nome,
             (SELECT COUNT(*) FROM chamados_filhos cf WHERE cf.id_incidente = i.id) AS total_chamados
      FROM incidentes i
      LEFT JOIN hoteis h ON i.id_hotel = h.id
      LEFT JOIN responsaveis r ON i.id_responsavel = r.id
    `;
    const params = [];
    if (status && status !== 'Todos') {
      sql += ' WHERE i.status = ?';
      params.push(status);
    }

    if (status === 'Resolvido') {
      sql += ' ORDER BY i.id DESC';
    } else {
      sql += ' ORDER BY i.ordem ASC, i.id DESC';
    }

    return await dbAll(sql, params);
  }

  static async getById(id) {
    return await dbGet('SELECT * FROM incidentes WHERE id = ?', [id]);
  }

  static async create(data, ts) {
    const { caso, incidente, id_hotel, problema, id_responsavel, ticket, situacao, link, is_major, chamados } = data;

    // Pega ordem máxima atual para colocar no fim
    const maxRow = await dbGet('SELECT MAX(ordem) as maxO FROM incidentes');
    const nextOrder = (maxRow?.maxO || 0) + 1;

    const res = await dbRun(
      `INSERT INTO incidentes (caso, incidente, id_hotel, problema, id_responsavel, ticket, situacao, ultima_atualizacao, status, ordem, link, is_major)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Aberto', ?, ?, ?)`,
      [caso, incidente, id_hotel || null, problema, id_responsavel || null, ticket, situacao, ts, nextOrder, link, is_major ? 1 : 0]
    );

    const newId = res.lastID;

    // Grava histórico inicial
    if (situacao) {
      await dbRun(
        'INSERT INTO historico_situacao (id_incidente, situacao, timestamp) VALUES (?, ?, ?)',
        [newId, situacao, ts]
      );
    }

    // Se for major e tiver chamados filhos informados
    if (is_major && Array.isArray(chamados)) {
      for (const c of chamados) {
        await dbRun(
          'INSERT INTO chamados_filhos (id_incidente, id_hotel, ticket, hotel_texto) VALUES (?, ?, ?, ?)',
          [newId, c.id_hotel || null, c.ticket, c.hotel_texto || '']
        );
      }
    }

    return newId;
  }

  static async update(id, data, tsUpdate = null) {
    const { caso, incidente, id_hotel, problema, id_responsavel, ticket, situacao, status, link, is_major } = data;

    await dbRun(
      `UPDATE incidentes 
       SET caso = ?, incidente = ?, id_hotel = ?, problema = ?, id_responsavel = ?, ticket = ?,
           situacao = ?, status = ?, ultima_atualizacao = COALESCE(?, ultima_atualizacao), link = ?, is_major = ?
       WHERE id = ?`,
      [caso, incidente, id_hotel || null, problema, id_responsavel || null, ticket, situacao, status || 'Aberto', tsUpdate, link, is_major ? 1 : 0, id]
    );

    return { success: true };
  }

  static async delete(id) {
    await dbRun('DELETE FROM chamados_filhos WHERE id_incidente = ?', [id]);
    await dbRun('DELETE FROM historico_situacao WHERE id_incidente = ?', [id]);
    await dbRun('DELETE FROM incidentes WHERE id = ?', [id]);
    return { success: true };
  }

  static async reordenar(ids) {
    for (let index = 0; index < ids.length; index++) {
      await dbRun('UPDATE incidentes SET ordem = ? WHERE id = ?', [index + 1, ids[index]]);
    }
    return { success: true };
  }

  static async getHistory(idIncidente) {
    return await dbAll(
      'SELECT * FROM historico_situacao WHERE id_incidente = ? ORDER BY id DESC',
      [idIncidente]
    );
  }

  static async addHistory(idIncidente, situacao, ts) {
    const res = await dbRun(
      'INSERT INTO historico_situacao (id_incidente, situacao, timestamp) VALUES (?, ?, ?)',
      [idIncidente, situacao, ts]
    );
    return res.lastID;
  }

  static async getChamadosFilhos(idIncidente) {
    return await dbAll(
      `SELECT c.*, h.nome as hotel_nome, h.rid as hotel_rid 
       FROM chamados_filhos c
       LEFT JOIN hoteis h ON c.id_hotel = h.id
       WHERE c.id_incidente = ?
       ORDER BY h.rid ASC, c.hotel_texto ASC`,
      [idIncidente]
    );
  }

  static async addChamadoFilho(idIncidente, data) {
    const res = await dbRun(
      'INSERT INTO chamados_filhos (id_incidente, id_hotel, ticket, hotel_texto) VALUES (?, ?, ?, ?)',
      [idIncidente, data.id_hotel || null, data.ticket, data.hotel_texto || '']
    );
    return res.lastID;
  }

  static async removeChamadoFilho(idChamado) {
    await dbRun('DELETE FROM chamados_filhos WHERE id = ?', [idChamado]);
    return { success: true };
  }
}

export default IncidentService;
