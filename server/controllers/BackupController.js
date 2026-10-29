import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dbAll } from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BackupController {
  /**
   * Baixa o backup completo integrado de todo o sistema.
   * Suporta ?format=db (padrão, binário SQLite nativo) ou ?format=json (dump estruturado).
   */
  static async downloadBackup(req, res) {
    try {
      const { format = 'db' } = req.query;
      const today = new Date().toISOString().split('T')[0];

      if (format.toLowerCase() === 'json') {
        const metrics = await dbAll('SELECT * FROM metrics');
        const settings = await dbAll('SELECT * FROM settings');
        const hoteis = await dbAll('SELECT * FROM hoteis');
        const responsaveis = await dbAll('SELECT * FROM responsaveis');
        const incidentes = await dbAll('SELECT * FROM incidentes');
        const chamadosFilhos = await dbAll('SELECT * FROM chamados_filhos');
        const incidentesMaiores = await dbAll('SELECT * FROM incidentes_maiores');
        const chamadosOvertime = await dbAll('SELECT * FROM chamados');
        const overtimeConfig = await dbAll("SELECT key, value FROM overtime_config WHERE key != 'master_password'");

        const payload = {
          metadata: {
            app: 'ServiceNow Dashboard & Incident Suite',
            backupDate: new Date().toISOString(),
            version: '2.5.0'
          },
          data: {
            metrics,
            settings,
            hoteis,
            responsaveis,
            incidentes,
            chamadosFilhos,
            incidentesMaiores,
            chamadosOvertime,
            overtimeConfig
          }
        };

        const filename = `servicenow_dashboard_backup_${today}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(JSON.stringify(payload, null, 2));
      }

      // Padrão: arquivo SQLite .db
      const dbPath = path.resolve(__dirname, '../dashboard.db');
      if (!fs.existsSync(dbPath)) {
        return res.status(404).json({ error: 'Arquivo do banco de dados não encontrado.' });
      }

      const filename = `servicenow_dashboard_backup_${today}.db`;
      res.setHeader('Content-Type', 'application/x-sqlite3');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const stream = fs.createReadStream(dbPath);
      stream.pipe(res);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default BackupController;
