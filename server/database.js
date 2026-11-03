/* global process */
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import CryptoService from './services/CryptoService.js';

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
  return new Promise((resolve) => {
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

    // ── Tabelas do Incident Manager (migradas do SNOW_INC) ──────────────────
    db.run(`CREATE TABLE IF NOT EXISTS hoteis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rid TEXT UNIQUE,
      nome TEXT NOT NULL,
      ativo BOOLEAN DEFAULT 1
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS responsaveis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      equipe TEXT,
      ativo BOOLEAN DEFAULT 1
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS incidentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caso TEXT,
      incidente TEXT,
      id_hotel INTEGER,
      problema TEXT,
      id_responsavel INTEGER,
      ticket TEXT,
      situacao TEXT,
      ultima_atualizacao TEXT,
      status TEXT DEFAULT 'Aberto',
      ordem INTEGER,
      link TEXT,
      pendencia TEXT,
      is_major BOOLEAN DEFAULT 0,
      FOREIGN KEY (id_hotel) REFERENCES hoteis(id),
      FOREIGN KEY (id_responsavel) REFERENCES responsaveis(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS chamados_filhos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_incidente INTEGER,
      id_hotel INTEGER,
      ticket TEXT,
      hotel_texto TEXT,
      FOREIGN KEY (id_incidente) REFERENCES incidentes(id) ON DELETE CASCADE,
      FOREIGN KEY (id_hotel) REFERENCES hoteis(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS historico_situacao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_incidente INTEGER,
      situacao TEXT,
      timestamp TEXT,
      FOREIGN KEY (id_incidente) REFERENCES incidentes(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS incidentes_maiores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE NOT NULL,
      descricao TEXT,
      hotel TEXT,
      ocorrencias INTEGER DEFAULT 1,
      ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      minha_responsabilidade BOOLEAN DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS logs_auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      id_registro INTEGER,
      entidade TEXT,
      tipo_acao TEXT,
      valor_anterior TEXT,
      valor_novo TEXT
    )`);

    // Índices de otimização
    db.run(`CREATE INDEX IF NOT EXISTS idx_incidentes_status ON incidentes(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_incidentes_id_hotel ON incidentes(id_hotel)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_incidentes_id_responsavel ON incidentes(id_responsavel)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_historico_id_incidente ON historico_situacao(id_incidente)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_chamados_id_incidente ON chamados_filhos(id_incidente)`);

    // ── Tabelas do Módulo de Horas Extras ──────────────────────────────────────
    db.run(`CREATE TABLE IF NOT EXISTS chamados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data DATE NOT NULL,
      caso TEXT,
      pms TEXT,
      hotel TEXT,
      inicio TEXT NOT NULL,
      intervalo TEXT,
      volta TEXT,
      termino TEXT NOT NULL,
      observacoes TEXT,
      motivo TEXT,
      valor_base_snapshot TEXT DEFAULT '0.0'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS overtime_config (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS overtime_salary_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      salario TEXT NOT NULL,
      data_vigencia DATE NOT NULL,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Migração de Criptografia para dados financeiros confidenciais (AES-256-GCM)
    // 1. Criptografar base_salary em overtime_config se estiver em texto puro
    db.get("SELECT value FROM overtime_config WHERE key = 'base_salary'", (err, sRow) => {
      if (!err && sRow && sRow.value && !CryptoService.isEncrypted(sRow.value)) {
        const enc = CryptoService.encrypt(sRow.value);
        db.run("UPDATE overtime_config SET value = ? WHERE key = 'base_salary'", [enc]);
      }
    });

    // 2. Criptografar valor_base_snapshot em chamados se estiver em texto puro
    db.all("SELECT id, valor_base_snapshot FROM chamados", (err, cRows) => {
      if (!err && cRows) {
        cRows.forEach(r => {
          if (r.valor_base_snapshot && !CryptoService.isEncrypted(r.valor_base_snapshot)) {
            const enc = CryptoService.encrypt(r.valor_base_snapshot);
            db.run("UPDATE chamados SET valor_base_snapshot = ? WHERE id = ?", [enc, r.id]);
          }
        });
      }
    });

    // 3. Criptografar salario em overtime_salary_history se estiver em texto puro
    db.all("SELECT id, salario FROM overtime_salary_history", (err, hRows) => {
      if (!err && hRows) {
        hRows.forEach(r => {
          if (r.salario && !CryptoService.isEncrypted(String(r.salario))) {
            const enc = CryptoService.encrypt(r.salario);
            db.run("UPDATE overtime_salary_history SET salario = ? WHERE id = ?", [enc, r.id]);
          }
        });
      }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_chamados_data ON chamados(data)`);

    // Migração de colunas para chamados (se já existia de versões anteriores)
    db.all("PRAGMA table_info(chamados)", (err, rows) => {
      if (!err && rows) {
        const columns = rows.map(r => r.name);
        if (!columns.includes('intervalo')) {
          db.run('ALTER TABLE chamados ADD COLUMN intervalo TEXT');
        }
        if (!columns.includes('volta')) {
          db.run('ALTER TABLE chamados ADD COLUMN volta TEXT');
        }
        if (!columns.includes('valor_base_snapshot')) {
          db.run("ALTER TABLE chamados ADD COLUMN valor_base_snapshot TEXT DEFAULT '0.0'");
        }
      }
    });

    db.get("SELECT 1", () => {
      resolve();
    });
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

// Atualiza nps_general para um mês/ano.
// Se a linha ainda não existe, insere um registro mínimo (outros campos = 0).
export const updateNpsGeneralMetrics = (year, month, nps_general) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO metrics (year, month, closed_count, evaluated_count, nps, nps_general,
                            is_vacation, is_project, within_sla_count, perfect_fix_count)
       VALUES (?, ?, 0, 0, 0, ?, 0, 0, 0, 0)
       ON CONFLICT(year, month) DO UPDATE SET
         nps_general = excluded.nps_general`,
      [year, month, nps_general],
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

// ── Generic Async DB Helpers ───────────────────────────────────────────────
export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
};

export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export { db, triggerBackup };

