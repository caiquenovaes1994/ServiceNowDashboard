import { Readable } from 'stream';
import OvertimePdfGenerator from './OvertimePdfGenerator.js';

/**
 * Serviço de geração de Folha de Ponto em PDF (100% nativo em Node.js ESM).
 * Gera o documento diretamente em memória, eliminando a dependência do Python e ReportLab.
 */
export async function generateOvertimePdf({
  registros = [],
  plantonista = 'CAIQUE NOVAES',
  mes = 'JANEIRO',
  ano = '2026',
  outputPath = null
}) {
  if (outputPath) {
    await OvertimePdfGenerator.generatePdfFile(
      { registros, plantonista, mes, ano },
      outputPath
    );
    return {
      pdfPath: outputPath,
      cleanup: () => {}
    };
  }

  const doc = await OvertimePdfGenerator.createPdfDocument({
    registros,
    plantonista,
    mes,
    ano
  });

  const pdfBuffer = await doc.getBuffer();

  return {
    pdfBuffer,
    pdfStream: Readable.from(pdfBuffer),
    getBuffer: () => pdfBuffer,
    cleanup: () => {}
  };
}

export default {
  generateOvertimePdf
};
