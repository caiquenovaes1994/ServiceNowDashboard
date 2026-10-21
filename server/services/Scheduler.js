import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbRun } from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Scheduler {
  static backupTimer = null;
  static backupDir = null;

  static init(backupDir) {
    this.backupDir = backupDir || path.resolve(__dirname, '../backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // Prune logs a cada 24 horas
    setInterval(() => this.pruneLogs(), 24 * 60 * 60 * 1000);

    console.log('[Scheduler] Tarefas de manutenção inicializadas (Backup com debounce: 5s, Prune: 24h)');
  }

  static scheduleBackup() {
    if (this.backupTimer) {
      clearTimeout(this.backupTimer);
    }

    this.backupTimer = setTimeout(() => {
      this.backupDatabase();
      this.backupTimer = null;
    }, 5000);
  }

  static backupDatabase() {
    try {
      const dbPath = path.resolve(__dirname, '../dashboard.db');
      if (fs.existsSync(dbPath)) {
        const dateStr = new Date().toISOString().split('T')[0];
        const backupFile = path.join(this.backupDir, `dashboard-backup-${dateStr}.db`);

        fs.copyFileSync(dbPath, backupFile);
        this.cleanupOldBackups();
        console.log(`[Backup] Backup do banco salvo para ${dateStr} em ${new Date().toLocaleTimeString()}`);
      }
    } catch (e) {
      console.error('[Backup] Falha ao criar backup:', e.message);
    }
  }

  static cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir).filter(f => f.endsWith('.db') || f.endsWith('.sqlite')).sort();
      if (files.length > 30) {
        fs.unlinkSync(path.join(this.backupDir, files[0]));
      }
    } catch (e) {
      console.error('[Backup] Erro ao limpar backups antigos:', e.message);
    }
  }

  static async pruneLogs() {
    try {
      const result = await dbRun("DELETE FROM logs_auditoria WHERE timestamp < date('now', '-30 days')");
      if (result.changes > 0) {
        console.log(`[Prune] ${result.changes} logs de auditoria antigos removidos.`);
      }
    } catch (e) {
      console.error('[Prune] Falha ao podar logs:', e.message);
    }
  }
}

export default Scheduler;
