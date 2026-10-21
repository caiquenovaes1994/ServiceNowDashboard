import { dbAll, dbGet, dbRun } from '../database.js';

class MajorIncidentService {
  static async getMajorIncidents() {
    const query = `
      SELECT i.incidente as numero, count(*) as ocorrencias, 
             COALESCE(MAX(h.nome), 'Hotel não definido') as hotel, 
             MAX(i.ultima_atualizacao) as ultima_atualizacao,
             COALESCE(m.minha_responsabilidade, 0) as minha_responsabilidade
      FROM incidentes i
      LEFT JOIN hoteis h ON i.id_hotel = h.id
      LEFT JOIN incidentes_maiores m ON i.incidente = m.numero
      GROUP BY i.incidente 
      HAVING count(*) >= 5 
         OR MAX(CASE 
              WHEN UPPER(i.caso) LIKE '%MAJOR%' 
                OR UPPER(i.incidente) LIKE '%MAJOR%' 
                OR UPPER(i.problema) LIKE '%MAJOR%' 
                OR UPPER(i.situacao) LIKE '%MAJOR%' 
              THEN 1 ELSE 0 END) = 1
      ORDER BY ultima_atualizacao DESC
    `;
    return await dbAll(query);
  }

  static async toggleMajorResponsibility(numero, val) {
    const exists = await dbGet('SELECT 1 FROM incidentes_maiores WHERE numero = ?', [numero]);
    if (!exists) {
      await dbRun(
        'INSERT INTO incidentes_maiores (numero, minha_responsabilidade) VALUES (?, ?)',
        [numero, val ? 1 : 0]
      );
    } else {
      await dbRun(
        'UPDATE incidentes_maiores SET minha_responsabilidade = ? WHERE numero = ?',
        [val ? 1 : 0, numero]
      );
    }
    return { success: true };
  }
}

export default MajorIncidentService;
