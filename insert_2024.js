import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'server/dashboard.db');
const db = new (sqlite3.verbose().Database)(dbPath);

const metrics = [
  { year: 2024, month: 'Abril', closed_count: 31, evaluated_count: 2, nps: 5.0, nps_general: 0, is_vacation: 0, is_project: 1 },
  { year: 2024, month: 'Maio', closed_count: 235, evaluated_count: 46, nps: 4.59, nps_general: 0, is_vacation: 0, is_project: 0 },
  { year: 2024, month: 'Junho', closed_count: 220, evaluated_count: 38, nps: 4.63, nps_general: 0, is_vacation: 0, is_project: 0 },
  { year: 2024, month: 'Julho', closed_count: 207, evaluated_count: 36, nps: 4.67, nps_general: 0, is_vacation: 0, is_project: 0 },
  { year: 2024, month: 'Agosto', closed_count: 81, evaluated_count: 18, nps: 4.94, nps_general: 0, is_vacation: 0, is_project: 1 },
  { year: 2024, month: 'Setembro', closed_count: 173, evaluated_count: 30, nps: 4.67, nps_general: 0, is_vacation: 0, is_project: 0 },
  { year: 2024, month: 'Outubro', closed_count: 233, evaluated_count: 32, nps: 4.9, nps_general: 0, is_vacation: 0, is_project: 0 },
  { year: 2024, month: 'Novembro', closed_count: 85, evaluated_count: 13, nps: 4.92, nps_general: 0, is_vacation: 0, is_project: 1 },
  { year: 2024, month: 'Dezembro', closed_count: 281, evaluated_count: 21, nps: 4.71, nps_general: 0, is_vacation: 0, is_project: 0 }
];

db.serialize(() => {
  const stmt = db.prepare(`
    INSERT INTO metrics (year, month, closed_count, evaluated_count, nps, nps_general, is_vacation, is_project)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(year, month) DO UPDATE SET
      closed_count = excluded.closed_count,
      evaluated_count = excluded.evaluated_count,
      nps = excluded.nps,
      nps_general = excluded.nps_general,
      is_vacation = excluded.is_vacation,
      is_project = excluded.is_project
  `);

  for (const m of metrics) {
    stmt.run([m.year, m.month, m.closed_count, m.evaluated_count, m.nps, m.nps_general, m.is_vacation, m.is_project]);
  }

  stmt.finalize(() => {
    console.log('Dados de 2024 inseridos com sucesso!');
    db.close();
  });
});
