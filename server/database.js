import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

let backupTimeout = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'dashboard.db');
const db = new (sqlite3.verbose().Database)(dbPath);

const backupDatabase = () => {
  const backupPath = dbPath + '.bak';
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
    });

    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);
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
  const { year, month, closed_count, evaluated_count, nps, nps_general, is_vacation, is_project } = metric;
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO metrics (year, month, closed_count, evaluated_count, nps, nps_general, is_vacation, is_project)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(year, month) DO UPDATE SET
            closed_count = excluded.closed_count,
            evaluated_count = excluded.evaluated_count,
            nps = excluded.nps,
            nps_general = excluded.nps_general,
            is_vacation = excluded.is_vacation,
            is_project = excluded.is_project`,
    [year, month, closed_count, evaluated_count, nps, nps_general, is_vacation, is_project],
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
