import bcrypt from 'bcryptjs';
import { dbGet, dbRun } from '../database.js';
import CryptoService from '../services/CryptoService.js';

export class OvertimeAuthController {
  static async getStatus(req, res) {
    try {
      const pwdRow = await dbGet("SELECT value FROM overtime_config WHERE key = 'master_password'");
      const nameRow = await dbGet("SELECT value FROM overtime_config WHERE key = 'collaborator_name'");
      const salaryRow = await dbGet("SELECT value FROM overtime_config WHERE key = 'base_salary'");
      const divisorRow = await dbGet("SELECT value FROM overtime_config WHERE key = 'salary_divisor'");

      res.json({
        isConfigured: !!(pwdRow && pwdRow.value),
        collaboratorName: nameRow ? nameRow.value : 'CAIQUE NOVAES',
        baseSalary: salaryRow ? CryptoService.decryptNumber(salaryRow.value, 0) : 0,
        salaryDivisor: divisorRow ? parseInt(divisorRow.value, 10) || 200 : 200
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async setup(req, res) {
    try {
      const { password, collaboratorName, baseSalary } = req.body;
      if (!password || String(password).trim().length < 4) {
        return res.status(400).json({ error: 'A senha deve ter no mínimo 4 caracteres.' });
      }

      const existing = await dbGet("SELECT value FROM overtime_config WHERE key = 'master_password'");
      if (existing && existing.value) {
        return res.status(400).json({ error: 'A senha já foi configurada. Use a verificação para acessar.' });
      }

      const hash = await bcrypt.hash(String(password).trim(), 10);
      const name = collaboratorName ? String(collaboratorName).trim().toUpperCase() : 'CAIQUE NOVAES';
      const numSalary = baseSalary ? parseFloat(baseSalary) || 0 : 0;
      const encSalary = CryptoService.encrypt(numSalary);

      await dbRun("INSERT OR REPLACE INTO overtime_config (key, value) VALUES ('master_password', ?)", [hash]);
      await dbRun("INSERT OR REPLACE INTO overtime_config (key, value) VALUES ('collaborator_name', ?)", [name]);
      await dbRun("INSERT OR REPLACE INTO overtime_config (key, value) VALUES ('base_salary', ?)", [encSalary]);
      await dbRun("INSERT OR REPLACE INTO overtime_config (key, value) VALUES ('salary_divisor', '200')");
      await dbRun("INSERT INTO overtime_salary_history (salario, data_vigencia) VALUES (?, '2020-01-01')", [encSalary]);

      res.json({
        success: true,
        message: 'Módulo de Horas Extras configurado com sucesso!',
        collaboratorName: name,
        baseSalary: numSalary,
        salaryDivisor: 200
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async verify(req, res) {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: 'Informe a senha de acesso.' });
      }

      const pwdRow = await dbGet("SELECT value FROM overtime_config WHERE key = 'master_password'");
      if (!pwdRow || !pwdRow.value) {
        return res.status(400).json({ error: 'Módulo ainda não configurado. Por favor, realize o setup inicial.' });
      }

      const isValid = await bcrypt.compare(String(password).trim(), pwdRow.value);
      if (!isValid) {
        return res.status(401).json({ error: 'Senha incorreta. Tente novamente.' });
      }

      const nameRow = await dbGet("SELECT value FROM overtime_config WHERE key = 'collaborator_name'");
      const salaryRow = await dbGet("SELECT value FROM overtime_config WHERE key = 'base_salary'");
      const divisorRow = await dbGet("SELECT value FROM overtime_config WHERE key = 'salary_divisor'");

      res.json({
        success: true,
        collaboratorName: nameRow ? nameRow.value : 'CAIQUE NOVAES',
        baseSalary: salaryRow ? CryptoService.decryptNumber(salaryRow.value, 0) : 0,
        salaryDivisor: divisorRow ? parseInt(divisorRow.value, 10) || 200 : 200
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateConfig(req, res) {
    try {
      const { collaboratorName, baseSalary, currentPassword, newPassword } = req.body;

      // Se quiser alterar a senha, valida a senha atual
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Informe a senha atual para definir uma nova.' });
        }
        const pwdRow = await dbGet("SELECT value FROM overtime_config WHERE key = 'master_password'");
        if (!pwdRow || !pwdRow.value) {
          return res.status(400).json({ error: 'Configuração não encontrada.' });
        }
        const valid = await bcrypt.compare(String(currentPassword).trim(), pwdRow.value);
        if (!valid) {
          return res.status(401).json({ error: 'Senha atual incorreta.' });
        }
        if (String(newPassword).trim().length < 4) {
          return res.status(400).json({ error: 'A nova senha deve ter pelo menos 4 caracteres.' });
        }
        const newHash = await bcrypt.hash(String(newPassword).trim(), 10);
        await dbRun("INSERT OR REPLACE INTO overtime_config (key, value) VALUES ('master_password', ?)", [newHash]);
      }

      if (collaboratorName !== undefined) {
        await dbRun("INSERT OR REPLACE INTO overtime_config (key, value) VALUES ('collaborator_name', ?)", [
          String(collaboratorName).trim().toUpperCase()
        ]);
      }

      if (baseSalary !== undefined) {
        const numVal = parseFloat(baseSalary) || 0;
        const encSalary = CryptoService.encrypt(numVal);
        await dbRun("INSERT OR REPLACE INTO overtime_config (key, value) VALUES ('base_salary', ?)", [encSalary]);

        // Registra no histórico de salários para vigência histórica (criptografado)
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const hojeStr = `${y}-${m}-${d}`;

        await dbRun(
          "INSERT INTO overtime_salary_history (salario, data_vigencia) VALUES (?, ?)",
          [encSalary, hojeStr]
        );
      }

      res.json({ success: true, message: 'Configurações atualizadas com sucesso!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default OvertimeAuthController;
