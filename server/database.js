/* global process */
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

let backupTimeout = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Better fallback logic for Render Free tier
let dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, 'dashboard.db');
let dbDir = path.dirname(dbPath);

try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (error) {
  console.warn(`[Database] Sem permissão para ${dbDir}, usando fallback local. Erro: ${error.message}`);
  dbPath = path.resolve(__dirname, 'dashboard.db');
}

const db = new (sqlite3.verbose().Database)(dbPath, (err) => {
  if (err) {
    console.error('[Database] Erro crítico:', err.message);
    if (err.code === 'SQLITE_CANTOPEN') {
       console.warn('[Database] Usando fallback final em /tmp');
    }
  } else {
    console.log('[Database] OK! Armazenando em:', dbPath);
  }
});

const backupDatabase = () => {
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupPath = path.join(backupDir, 'dashboard.db.bak');
  
  fs.copyFile(dbPath, backupPath, (err) => {
    if (err) {
      console.error('[Backup] Erro ao criar backup:', err);
    } else {
      console.log(`[Backup] Banco de dados salvo em: ${new Date().toLocaleTimeString()} em ${backupPath}`);
    }
  });
};

const triggerBackup = () => {
  if (backupTimeout) clearTimeout(backupTimeout);
  backupTimeout = setTimeout(backupDatabase, 5000);
};

export const initDb = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month TEXT NOT NULL,
      closed_count INTEGER DEFAULT 0,
      evaluated_count INTEGER DEFAULT 0,
      nps REAL DEFAULT 0,
      nps_general REAL DEFAULT 0,
      is_vacation INTEGER DEFAULT 0,
      is_project INTEGER DEFAULT 0,
      within_sla_count INTEGER DEFAULT 0,
      perfect_fix_count INTEGER DEFAULT 0,
      UNIQUE(year, month)
    )`);

    // Migration for existing databases
    db.all("PRAGMA table_info(metrics)", (err, rows) => {
      const columns = rows.map(r => r.name);
      if (!columns.includes('nps_general')) {
        db.run('ALTER TABLE metrics ADD COLUMN nps_general REAL DEFAULT 0');
      }
      if (!columns.includes('is_vacation')) {
        db.run('ALTER TABLE metrics ADD COLUMN is_vacation INTEGER DEFAULT 0');
      }
      if (!columns.includes('is_project')) {
        db.run('ALTER TABLE metrics ADD COLUMN is_project INTEGER DEFAULT 0');
      }
      if (!columns.includes('within_sla_count')) {
        db.run('ALTER TABLE metrics ADD COLUMN within_sla_count INTEGER DEFAULT 0');
      }
      if (!columns.includes('perfect_fix_count')) {
        db.run('ALTER TABLE metrics ADD COLUMN perfect_fix_count INTEGER DEFAULT 0');
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);

    // Auto-seed if empty
    db.get("SELECT COUNT(*) as count FROM metrics", (err, row) => {
      if (!err && row && row.count === 0) {
        console.log("[Database] Banco vazio detectado. Semeando dados de 2024...");
        const initialMetrics = [
          { year: 2024, month: 'Janeiro', closed_count: 0, evaluated_count: 0, nps: 0, nps_general: 0, is_vacation: 0, is_project: 0 },
          { year: 2024, month: 'Fevereiro', closed_count: 0, evaluated_count: 0, nps: 0, nps_general: 0, is_vacation: 1, is_project: 0 },
          { year: 2024, month: 'Março', closed_count: 0, evaluated_count: 0, nps: 0, nps_general: 0, is_vacation: 0, is_project: 1 },
          { year: 2024, month: 'Abril', closed_count: 31, evaluated_count: 2, nps: 5, nps_general: 0, is_vacation: 0, is_project: 1 },
          { year: 2024, month: 'Maio', closed_count: 235, evaluated_count: 46, nps: 4.59, nps_general: 0, is_vacation: 0, is_project: 0, perfect_fix_count: 139 },
          { year: 2024, month: 'Junho', closed_count: 220, evaluated_count: 38, nps: 4.63, nps_general: 0, is_vacation: 0, is_project: 0, perfect_fix_count: 194 },
          { year: 2024, month: 'Julho', closed_count: 207, evaluated_count: 36, nps: 4.67, nps_general: 0, is_vacation: 0, is_project: 0, perfect_fix_count: 175 },
          { year: 2024, month: 'Agosto', closed_count: 81, evaluated_count: 18, nps: 4.94, nps_general: 0, is_vacation: 0, is_project: 1, perfect_fix_count: 72 },
          { year: 2024, month: 'Setembro', closed_count: 173, evaluated_count: 30, nps: 4.67, nps_general: 0, is_vacation: 0, is_project: 0, perfect_fix_count: 154 },
          { year: 2024, month: 'Outubro', closed_count: 233, evaluated_count: 32, nps: 4.9, nps_general: 0, is_vacation: 0, is_project: 0, perfect_fix_count: 213 },
          { year: 2024, month: 'Novembro', closed_count: 85, evaluated_count: 13, nps: 4.92, nps_general: 0, is_vacation: 0, is_project: 1, perfect_fix_count: 78 },
          { year: 2024, month: 'Dezembro', closed_count: 281, evaluated_count: 21, nps: 4.71, nps_general: 0, is_vacation: 0, is_project: 0, perfect_fix_count: 248 },
          { year: 2025, month: 'Janeiro', closed_count: 140, evaluated_count: 15, nps: 4.67, nps_general: 0, is_vacation: 0, is_project: 0, perfect_fix_count: 123 },
          { year: 2025, month: 'Fevereiro', closed_count: 0, evaluated_count: 0, nps: 0, nps_general: 0, is_vacation: 1, is_project: 0, perfect_fix_count: 0 },
          { year: 2025, month: 'Março', closed_count: 39, evaluated_count: 12, nps: 5, nps_general: 0, is_vacation: 0, is_project: 1, perfect_fix_count: 36 },
          { year: 2025, month: 'Abril', closed_count: 115, evaluated_count: 14, nps: 4.79, nps_general: 4.78, is_vacation: 0, is_project: 0, perfect_fix_count: 99 },
          { year: 2025, month: 'Maio', closed_count: 110, evaluated_count: 21, nps: 4.95, nps_general: 4.74, is_vacation: 0, is_project: 0, perfect_fix_count: 102 },
          { year: 2025, month: 'Junho', closed_count: 107, evaluated_count: 17, nps: 4.94, nps_general: 4.9, is_vacation: 0, is_project: 0, perfect_fix_count: 99 },
          { year: 2025, month: 'Julho', closed_count: 256, evaluated_count: 21, nps: 4.9, nps_general: 4.81, is_vacation: 0, is_project: 1, perfect_fix_count: 243 },
          { year: 2025, month: 'Agosto', closed_count: 112, evaluated_count: 17, nps: 4.82, nps_general: 4.81, is_vacation: 0, is_project: 0, perfect_fix_count: 99 },
          { year: 2025, month: 'Setembro', closed_count: 121, evaluated_count: 16, nps: 4.88, nps_general: 4.88, is_vacation: 0, is_project: 0, perfect_fix_count: 108 },
          { year: 2025, month: 'Outubro', closed_count: 108, evaluated_count: 22, nps: 4.86, nps_general: 4.82, is_vacation: 0, is_project: 0, perfect_fix_count: 97 },
          { year: 2025, month: 'Novembro', closed_count: 141, evaluated_count: 21, nps: 4.9, nps_general: 4.84, is_vacation: 0, is_project: 0, perfect_fix_count: 111 },
          { year: 2025, month: 'Dezembro', closed_count: 47, evaluated_count: 9, nps: 4.89, nps_general: 4.65, is_vacation: 0, is_project: 1, perfect_fix_count: 39 },
          { year: 2026, month: 'Janeiro', closed_count: 4, evaluated_count: 0, nps: 0, nps_general: 4.88, is_vacation: 1, is_project: 0, within_sla_count: 4, perfect_fix_count: 4 },
          { year: 2026, month: 'Fevereiro', closed_count: 169, evaluated_count: 26, nps: 4.62, nps_general: 4.71, is_vacation: 0, is_project: 0, within_sla_count: 162, perfect_fix_count: 148 },
          { year: 2026, month: 'Março', closed_count: 207, evaluated_count: 51, nps: 4.82, nps_general: 4.74, is_vacation: 0, is_project: 0, within_sla_count: 198, perfect_fix_count: 179 },
          { year: 2026, month: 'Abril', closed_count: 14, evaluated_count: 1, nps: 5, nps_general: 4.85, is_vacation: 0, is_project: 0, within_sla_count: 14, perfect_fix_count: 162 },
          { year: 2026, month: 'Maio', closed_count: 0, evaluated_count: 0, nps: 0, nps_general: 4.79, is_vacation: 0, is_project: 0, within_sla_count: 0, perfect_fix_count: 0 }
        ];

        const stmt = db.prepare(`INSERT INTO metrics (year, month, closed_count, evaluated_count, nps, nps_general, is_vacation, is_project) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        for (const m of initialMetrics) {
          stmt.run([m.year, m.month, m.closed_count, m.evaluated_count, m.nps, m.nps_general, m.is_vacation, m.is_project]);
        }
        stmt.finalize();
      }
    });
  });
};

export const getMetrics = (year) => {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM metrics';
    const params = [];
    if (year) {
      sql += ' WHERE year = ?';
      params.push(year);
    }
    sql += ` ORDER BY year DESC, 
      CASE month 
        WHEN "Janeiro" THEN 1 
        WHEN "Fevereiro" THEN 2 
        WHEN "Março" THEN 3 
        WHEN "Abril" THEN 4 
        WHEN "Maio" THEN 5 
        WHEN "Junho" THEN 6 
        WHEN "Julho" THEN 7 
        WHEN "Agosto" THEN 8 
        WHEN "Setembro" THEN 9 
        WHEN "Outubro" THEN 10 
        WHEN "Novembro" THEN 11 
        WHEN "Dezembro" THEN 12 
      END ASC`;
    
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

export const saveMetric = (metric) => {
  const { year, month, closed_count, evaluated_count, nps, nps_general, is_vacation, is_project, within_sla_count, perfect_fix_count } = metric;
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO metrics (year, month, closed_count, evaluated_count, nps, nps_general, is_vacation, is_project, within_sla_count, perfect_fix_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(year, month) DO UPDATE SET
            closed_count = excluded.closed_count,
            evaluated_count = excluded.evaluated_count,
            nps = excluded.nps,
            nps_general = excluded.nps_general,
            is_vacation = excluded.is_vacation,
            is_project = excluded.is_project,
            within_sla_count = excluded.within_sla_count,
            perfect_fix_count = excluded.perfect_fix_count`,
    [year, month, closed_count, evaluated_count, nps, nps_general, is_vacation, is_project, within_sla_count, perfect_fix_count],
    function(err) {
      if (err) {
        reject(err);
      } else {
        triggerBackup();
        resolve(this.lastID);
      }
    });
  });
};

export const getSetting = (key) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
      if (err) reject(err);
      resolve(row ? row.value : null);
    });
  });
};

export const saveSetting = (key, value) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value.toString()],
    function(err) {
      if (err) {
        reject(err);
      } else {
        triggerBackup();
        resolve();
      }
    });
  });
};

// Atualiza within_sla_count, perfect_fix_count e closed_count para um mês/ano.
// Se a linha ainda não existe, insere um registro mínimo (outros campos = 0).
export const updateSlaMetrics = (year, month, within_sla_count, perfect_fix_count, closed_count) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO metrics (year, month, closed_count, evaluated_count, nps, nps_general,
                            is_vacation, is_project, within_sla_count, perfect_fix_count)
       VALUES (?, ?, ?, 0, 0, 0, 0, 0, ?, ?)
       ON CONFLICT(year, month) DO UPDATE SET
         closed_count = excluded.closed_count,
         within_sla_count = excluded.within_sla_count,
         perfect_fix_count = excluded.perfect_fix_count`,
      [year, month, closed_count, within_sla_count, perfect_fix_count],
      function(err) {
        if (err) {
          reject(err);
        } else {
          triggerBackup();
          resolve(this.lastID);
        }
      }
    );
  });
};
