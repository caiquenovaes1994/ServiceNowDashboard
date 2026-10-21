import ExcelJS from 'exceljs';

/**
 * Aplica a estilização padrão corporativa à planilha (cabeçalho escuro + zebrado + bordas)
 * @param {ExcelJS.Worksheet} ws 
 */
export function formatarPlanilhaExcel(ws) {
  // 1. Estilizar Cabeçalho
  const headerRow = ws.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F2937' } // Fundo escuro moderno
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      bottom: { style: 'medium', color: { argb: 'FF111827' } },
      right: { style: 'thin', color: { argb: 'FF9CA3AF' } }
    };
  });

  // 2. Estilizar Linhas de Dados com Zebrado (#FFFFFF e #D9D9D9)
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Pula cabeçalho

    const isWhite = rowNumber % 2 === 0;
    const bgArgb = isWhite ? 'FFFFFFFF' : 'FFD9D9D9';

    row.height = 20;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFC0C0C0' } },
        left: { style: 'thin', color: { argb: 'FFC0C0C0' } },
        bottom: { style: 'thin', color: { argb: 'FFC0C0C0' } },
        right: { style: 'thin', color: { argb: 'FFC0C0C0' } }
      };
      cell.alignment = { vertical: 'middle' };
    });
  });

  // 3. Auto-ajuste de Largura de Coluna
  ws.columns.forEach((col) => {
    let maxLen = col.header ? String(col.header).length : 10;
    col.eachCell({ includeEmpty: true }, (cell, rowNum) => {
      if (rowNum === 1) return;
      const val = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(Math.max(maxLen + 4, 14), 65);
  });
}

/**
 * Cria uma aba dedicada para chamados vinculados a um Major Incident
 * @param {ExcelJS.Workbook} wb 
 * @param {string} nomeAba 
 * @param {Array} chamados 
 */
export function adicionarAbaChamadosMajor(wb, nomeAba, chamados = []) {
  let cleanNome = (nomeAba || 'Major').replace(/[\\/?*[\]:]/g, '_').trim();
  if (!cleanNome.startsWith('(!)')) {
    cleanNome = `(!) ${cleanNome}`;
  }
  const baseSheetName = cleanNome.slice(0, 31);

  let finalSheetName = baseSheetName;
  let counter = 2;
  while (wb.getWorksheet(finalSheetName)) {
    const suffix = `_${counter}`;
    finalSheetName = `${baseSheetName.slice(0, 31 - suffix.length)}${suffix}`;
    counter++;
  }

  const ws = wb.addWorksheet(finalSheetName);

  ws.columns = [
    { header: 'Chamado', key: 'chamado' },
    { header: 'Hotel', key: 'hotel' }
  ];

  if (chamados && chamados.length > 0) {
    chamados.forEach((c) => {
      const hotelDisplay = c.hotel_rid
        ? `${c.hotel_rid} - ${c.hotel_nome || ''}`
        : (c.hotel_texto || c.hotel_nome || '-');

      ws.addRow({
        chamado: c.ticket || '-',
        hotel: hotelDisplay
      });
    });
  }

  formatarPlanilhaExcel(ws);
  return ws;
}

/**
 * Dispara o download no navegador do arquivo Excel (.xlsx)
 * @param {ExcelJS.Workbook} wb 
 * @param {string} nomeArquivo 
 */
export async function baixarArquivoExcel(wb, nomeArquivo) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Exporta a lista atual de incidentes para planilha Excel
 * @param {Object} params
 * @param {Array} params.incidents
 * @param {string} params.activeSubTab
 * @param {string} [params.filterHotel]
 * @param {string} [params.filterResponsible]
 * @param {Function} [params.onFetchChamados]
 */
export async function exportarIncidentesXLSX({
  incidents = [],
  activeSubTab = 'Aberto',
  filterHotel = 'Todos',
  filterResponsible = 'Todos',
  onFetchChamados = null
}) {
  if (!incidents || incidents.length === 0) {
    alert('Não há registros para exportar na visualização atual.');
    return;
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'ServiceNow Incident Manager';
  wb.created = new Date();

  const sheetName = `Incidentes_${activeSubTab}`.replace(/[\\/?*[\]:]/g, '_').slice(0, 31);
  const ws = wb.addWorksheet(sheetName);

  ws.columns = [
    { header: 'Ordem', key: 'ordem' },
    { header: 'Caso', key: 'caso' },
    { header: 'Incidente', key: 'incidente' },
    { header: 'Hotel', key: 'hotel' },
    { header: 'Problema', key: 'problema' },
    { header: 'Responsável', key: 'responsavel' },
    { header: 'Ticket', key: 'ticket' },
    { header: 'Situação', key: 'situacao' },
    { header: 'Última Atualização', key: 'ultima_atualizacao' },
    { header: 'Status', key: 'status' },
    { header: 'Tipo', key: 'tipo' },
    { header: 'Link', key: 'link' }
  ];

  incidents.forEach((inc, idx) => {
    let hotelStr = '';
    if (inc.is_major) {
      hotelStr = 'Múltiplos';
    } else {
      hotelStr = inc.hotel_rid ? `${inc.hotel_rid} - ${inc.hotel_nome || ''}` : (inc.hotel_nome || '-');
    }

    let casoStr = inc.caso || '';
    if (inc.is_major) {
      const count = inc.total_chamados !== undefined && inc.total_chamados !== null ? inc.total_chamados : 0;
      const countLabel = count === 1 ? '1 caso' : `${count} casos`;
      casoStr = casoStr ? `${casoStr} (${countLabel})` : `(${countLabel})`;
    }

    ws.addRow({
      ordem: inc.ordem !== undefined && inc.ordem !== null ? inc.ordem : (idx + 1),
      caso: casoStr || '-',
      incidente: inc.incidente || '-',
      hotel: hotelStr,
      problema: inc.problema || '-',
      responsavel: inc.responsavel_nome || '-',
      ticket: inc.ticket || '-',
      situacao: inc.situacao || '-',
      ultima_atualizacao: inc.ultima_atualizacao || '-',
      status: inc.status || activeSubTab,
      tipo: inc.is_major ? 'Major Incident' : 'Normal',
      link: inc.link || ''
    });
  });

  formatarPlanilhaExcel(ws);

  // Se houver Major Incidents entre os registros exportados, incluir abas filhas dedicadas
  const majors = incidents.filter((inc) => inc.is_major);
  if (majors.length > 0 && typeof onFetchChamados === 'function') {
    const chamadosPorMajor = await Promise.all(
      majors.map(async (major) => {
        try {
          const chamados = await onFetchChamados(major.id);
          return { major, chamados: chamados || [] };
        } catch (err) {
          console.error(`Erro ao carregar chamados do Major ${major.id}:`, err);
          return { major, chamados: [] };
        }
      })
    );

    chamadosPorMajor.forEach(({ major, chamados }) => {
      const numIncidente = major.incidente || major.caso || `Major_${major.id}`;
      const abaNome = `(!) ${numIncidente}`;
      adicionarAbaChamadosMajor(wb, abaNome, chamados);
    });
  }

  // Montagem do nome do arquivo
  const agora = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dataStr = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
  const horaStr = `${pad(agora.getHours())}h${pad(agora.getMinutes())}`;

  let sufixoFiltro = '';
  if (filterHotel && filterHotel !== 'Todos') {
    sufixoFiltro += `_hotel_${filterHotel.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }
  if (filterResponsible && filterResponsible !== 'Todos') {
    sufixoFiltro += `_resp_${filterResponsible.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  const nomeArquivo = `Incidentes_${activeSubTab}${sufixoFiltro}_${dataStr}_${horaStr}.xlsx`;
  await baixarArquivoExcel(wb, nomeArquivo);
}

/**
 * Exporta apenas os chamados vinculados de um Major Incident
 * @param {Object} incident 
 * @param {Array} tickets 
 */
export async function exportarChamadosMajorXLSX(incident, tickets = []) {
  if (!tickets || tickets.length === 0) {
    alert('Não há chamados vinculados a este Major Incident para exportar.');
    return;
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'ServiceNow Incident Manager';
  wb.created = new Date();

  const numInc = incident?.incidente || incident?.caso || 'Major';
  const abaNome = `(!) ${numInc}`;
  adicionarAbaChamadosMajor(wb, abaNome, tickets);

  const agora = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dataStr = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
  const horaStr = `${pad(agora.getHours())}h${pad(agora.getMinutes())}`;
  const incClean = numInc.replace(/[^a-zA-Z0-9]/g, '_');
  const nomeArquivo = `Chamados_Major_${incClean}_${dataStr}_${horaStr}.xlsx`;

  await baixarArquivoExcel(wb, nomeArquivo);
}
