import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dbRun } from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AuditService {
  constructor() {
    this.logFilePath = path.resolve(__dirname, '../../audit.log');
    this.cleanOldLogs();

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
      ),
      transports: [
        new winston.transports.File({ filename: this.logFilePath }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(info => `[Audit] ${info.message}`)
          )
        })
      ]
    });
  }

  cleanOldLogs() {
    try {
      if (!fs.existsSync(this.logFilePath)) return;

      const content = fs.readFileSync(this.logFilePath, 'utf8');
      if (!content) return;

      const lines = content.split('\n');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let keep = true;
      const filteredLines = lines.filter(line => {
        const match = line.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/);
        if (match) {
          const logDate = new Date(match[1]);
          keep = logDate >= thirtyDaysAgo;
        }
        return keep && line.trim() !== '';
      });

      const finalContent = filteredLines.length > 0 ? filteredLines.join('\n') + '\n' : '';
      fs.writeFileSync(this.logFilePath, finalContent);
    } catch (e) {
      console.error('[AuditService] Falha ao limpar logs antigos:', e.message);
    }
  }

  async log(action, details, id = null, entity = 'incidentes') {
    this.logger.info(`${action} | ${details}`);
    try {
      await dbRun(
        `INSERT INTO logs_auditoria (id_registro, entidade, tipo_acao, valor_novo)
         VALUES (?, ?, ?, ?)`,
        [id, entity, action, details]
      );
    } catch (e) {
      this.logger.error(`Falha ao gravar log no SQL: ${e.message}`);
    }
  }

  error(message, error) {
    this.logger.error(`${message}: ${error?.stack || error}`);
  }
}

export default new AuditService();
