import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function generateOvertimePdf({ registros = [], plantonista = 'CAIQUE NOVAES', mes = 'JANEIRO', ano = '2026' }) {
  const timestamp = Date.now();
  const jsonPath = path.join(uploadsDir, `payload_${timestamp}.json`);
  const pdfPath = path.join(uploadsDir, `folha_horas_${timestamp}.pdf`);
  const scriptPath = path.resolve(__dirname, 'pdf_generator.py');

  const payload = {
    registros,
    plantonista,
    mes,
    ano: String(ano)
  };

  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');

  return new Promise((resolve, reject) => {
    const pyProcess = spawn('python', [scriptPath, '--input', jsonPath, '--output', pdfPath]);

    let stderr = '';
    pyProcess.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    pyProcess.on('close', (code) => {
      // Exclui o arquivo JSON temporário
      try {
        if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
      } catch (e) {
        console.warn('[OvertimePdfService] Falha ao limpar json temporário:', e.message);
      }

      if (code !== 0) {
        return reject(new Error(`Falha no gerador de PDF (código ${code}): ${stderr}`));
      }

      if (!fs.existsSync(pdfPath)) {
        return reject(new Error('PDF não foi gerado no caminho esperado'));
      }

      resolve({
        pdfPath,
        cleanup: () => {
          try {
            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
          } catch (e) {
            console.warn('[OvertimePdfService] Falha ao remover PDF temporário:', e.message);
          }
        }
      });
    });

    pyProcess.on('error', (err) => {
      try {
        if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
      } catch {
        // ignore
      }
      reject(new Error(`Erro ao iniciar processo Python: ${err.message}`));
    });
  });
}

export default {
  generateOvertimePdf
};
