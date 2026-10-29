import React, { useState } from 'react';
import axios from 'axios';
import { 
  Clock, Plus, Download, Settings, Lock, Eye, Edit2, Trash2, 
  Calendar, CheckSquare, Square, AlertTriangle, FileText, CheckCircle2 
} from 'lucide-react';
import OvertimeRecordModal from './OvertimeRecordModal.jsx';
import OvertimeSettingsModal from './OvertimeSettingsModal.jsx';

const MESES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

const ANOS = [2024, 2025, 2026, 2027, 2028];

const OvertimeDashboard = ({
  chamados = [],
  kpis = {},
  periodo = {},
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onRefresh,
  onLock,
  collaboratorName,
  baseSalary,
  hotels = [],
  loading = false
}) => {

  const [selectedIds, setSelectedIds] = useState([]);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const showNotification = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === chamados.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(chamados.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleOpenNew = () => {
    setActiveRecord(null);
    setIsViewOnly(false);
    setIsRecordModalOpen(true);
  };

  const handleOpenEdit = (rec) => {
    setActiveRecord(rec);
    setIsViewOnly(false);
    setIsRecordModalOpen(true);
  };

  const handleOpenView = (rec) => {
    setActiveRecord(rec);
    setIsViewOnly(true);
    setIsRecordModalOpen(true);
  };

  const handleSaveRecord = async (formData) => {
    try {
      if (formData.id) {
        await axios.put(`/api/overtime/chamados/${formData.id}`, formData);
        showNotification('Apontamento atualizado com sucesso!');
      } else {
        await axios.post('/api/overtime/chamados', formData);
        showNotification('Novo apontamento cadastrado com sucesso!');
      }
      setIsRecordModalOpen(false);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar apontamento.');
    }
  };

  const handleDeleteSingle = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este apontamento?')) return;
    try {
      await axios.delete(`/api/overtime/chamados/${id}`);
      showNotification('Apontamento excluído.');
      setSelectedIds(selectedIds.filter((item) => item !== id));
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir apontamento.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Deseja realmente excluir os ${selectedIds.length} apontamentos selecionados?`)) return;

    try {
      await axios.post('/api/overtime/chamados/bulk-delete', { ids: selectedIds });
      showNotification(`${selectedIds.length} apontamento(s) excluído(s) com sucesso!`);
      setSelectedIds([]);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro na exclusão em massa.');
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const url = `/api/overtime/download-pdf?mes=${encodeURIComponent(selectedMonth)}&ano=${selectedYear}`;
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Folha_Horas_Extras_${selectedMonth}_${selectedYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      showNotification('Folha de Hora Extra gerada com sucesso!');
    } catch (err) {
      console.error('[OvertimeDashboard] Erro ao gerar PDF:', err.message);
      alert('Erro ao gerar o relatório PDF. Verifique se o Python com ReportLab está instalado.');
    } finally {

      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="overtime-container">
      {/* ── Barra Superior de Controle ────────────────────────────────────── */}
      <div className="ot-header-bar">
        <div className="ot-title-group">
          <div className="ot-badge-wine">
            <Clock size={16} />
            <span>HORAS EXTRAS</span>
          </div>

          <div className="ot-filters-group">
            <select
              className="ot-select"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              title="Mês de Competência"
            >
              {MESES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              className="ot-select"
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              title="Ano de Competência"
            >
              {ANOS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {periodo.dataInicio && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginLeft: 6 }}>
                Ciclo: {periodo.dataInicio.split('-').reverse().join('/')} a {periodo.dataFim.split('-').reverse().join('/')}
              </span>
            )}
          </div>
        </div>

        <div className="ot-actions-group">
          <button type="button" className="btn-wine" onClick={handleOpenNew}>
            <Plus size={16} />
            <span>Novo Registro</span>
          </button>

          <button
            type="button"
            className="btn-wine-outline"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            title="Baixar Folha de Hora Extra em PDF (A4 Paisagem Oficial)"
          >
            <Download size={16} />
            <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsSettingsModalOpen(true)}
            title="Configurações e Salário Base"
          >
            <Settings size={16} />
            <span>Configurações</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onLock}
            title="Bloquear Módulo de Horas Extras"
          >
            <Lock size={15} />
            <span>Bloquear</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="badge badge-success" style={{ padding: '0.75rem 1rem', width: '100%' }}>
          <CheckCircle2 size={16} style={{ marginRight: 6 }} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ── 4 KPI Cards Executivos ────────────────────────────────────────── */}
      <div className="ot-kpi-grid">
        <div className="ot-kpi-card">
          <div className="ot-kpi-top">
            <span className="ot-kpi-icon">🕐</span>
            <span className="ot-kpi-label">Horas (50% / 100%)</span>
          </div>
          <div className="ot-kpi-value">
            {kpis.totalHoras50 || '00:00'} / {kpis.totalHoras100 || '00:00'}
          </div>
        </div>

        <div className="ot-kpi-card">
          <div className="ot-kpi-top">
            <span className="ot-kpi-icon">💰</span>
            <span className="ot-kpi-label">Ganhos Estimados</span>
          </div>
          <div className="ot-kpi-value" style={{ color: '#4ade80' }}>
            {kpis.ganhosEstimados || 'R$ 0,00'}
          </div>
        </div>

        <div className="ot-kpi-card">
          <div className="ot-kpi-top">
            <span className="ot-kpi-icon">📋</span>
            <span className="ot-kpi-label">Total de Chamados</span>
          </div>
          <div className="ot-kpi-value" style={{ color: '#38bdf8' }}>
            {kpis.totalChamados || 0}
          </div>
        </div>

        <div className="ot-kpi-card">
          <div className="ot-kpi-top">
            <span className="ot-kpi-icon">📊</span>
            <span className="ot-kpi-label">Média por Chamado</span>
          </div>
          <div className="ot-kpi-value" style={{ color: '#f59e0b' }}>
            {kpis.mediaChamado || '00:00'}
          </div>
        </div>
      </div>

      {/* ── Barra de Exclusão em Massa (Se houver selecionados) ────────────── */}
      {selectedIds.length > 0 && (
        <div className="ot-bulk-bar">
          <span className="ot-bulk-info">
            {selectedIds.length} atendimento(s) selecionado(s)
          </span>
          <button type="button" className="btn btn-danger" onClick={handleBulkDelete}>
            <Trash2 size={16} />
            <span>Deletar Selecionados</span>
          </button>
        </div>
      )}

      {/* ── Tabela de Apontamentos ────────────────────────────────────────── */}
      <div className="ot-table-card">
        <div className="ot-table-header">
          <div className="ot-table-title">
            <FileText size={18} style={{ color: '#ff6b6b' }} />
            <span>Espelho de Apontamentos ({chamados.length})</span>
          </div>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Titular: <strong style={{ color: 'var(--text-white)' }}>{collaboratorName}</strong>
          </span>
        </div>

        <div className="ot-table-responsive">
          <table className="ot-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                    onClick={handleSelectAll}
                    title="Selecionar todos"
                  >
                    {chamados.length > 0 && selectedIds.length === chamados.length ? (
                      <CheckSquare size={17} style={{ color: '#ff6b6b' }} />
                    ) : (
                      <Square size={17} />
                    )}
                  </button>
                </th>
                <th>Data</th>
                <th>Semana</th>
                <th>Caso / INC</th>
                <th>Hotel</th>
                <th>Início</th>
                <th>Término</th>
                <th>Duração</th>
                <th>Taxa</th>
                <th>Motivo</th>
                <th>Observações</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                    Carregando apontamentos...
                  </td>
                </tr>
              ) : chamados.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                    Nenhum apontamento registrado para o período de {selectedMonth}/{selectedYear}.
                    <div style={{ marginTop: '0.75rem' }}>
                      <button type="button" className="btn-wine" onClick={handleOpenNew}>
                        <Plus size={15} />
                        <span>Inserir Primeiro Registro</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                chamados.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  const dataFormatted = item.data ? item.data.split('-').reverse().join('/') : '';

                  return (
                    <tr
                      key={item.id}
                      className={item.isFeriadoOuDomingo ? 'ot-row-holiday' : ''}
                      style={{ background: isChecked ? 'rgba(128, 0, 0, 0.15)' : undefined }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                          onClick={() => handleToggleSelect(item.id)}
                        >
                          {isChecked ? (
                            <CheckSquare size={17} style={{ color: '#ff6b6b' }} />
                          ) : (
                            <Square size={17} />
                          )}
                        </button>
                      </td>
                      <td style={{ fontWeight: 600 }}>{dataFormatted}</td>
                      <td>
                        <span
                          className={`ot-badge-tag ${
                            item.isFeriadoOuDomingo ? 'ot-badge-100' : 'ot-badge-50'
                          }`}
                        >
                          {item.diaSemana}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        {item.caso || '—'}
                      </td>
                      <td>{item.hotelCompleto}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{item.inicio}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                          {item.termino}
                          {item.isOvernight && (
                            <sup
                              style={{
                                fontSize: '0.68em',
                                fontWeight: 700,
                                color: '#f87171',
                                marginLeft: '2px',
                                verticalAlign: 'super',
                                lineHeight: 1
                              }}
                              title="Término pós meia-noite (+1 dia)"
                            >
                              +1
                            </sup>
                          )}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-white)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span>{item.duracaoFormatada}</span>
                          {item.isOverlapping && (
                            <span
                              className="ot-badge-tag"
                              style={{
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#60a5fa',
                                fontSize: '0.65rem',
                                padding: '1px 5px',
                                fontWeight: 600
                              }}
                              title="Horário sobreposto com outro apontamento do mesmo dia (Agrupado na apuração e no PDF)"
                            >
                              Sobreposto
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`ot-badge-tag ${
                            item.isFeriadoOuDomingo ? 'ot-badge-100' : 'ot-badge-50'
                          }`}
                        >
                          {item.isFeriadoOuDomingo ? '100%' : '50%'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.motivo}>
                        {item.motivo}
                      </td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-muted)' }} title={item.observacoes || ''}>
                        {item.observacoes || '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            type="button"
                            className="ot-action-btn"
                            onClick={() => handleOpenView(item)}
                            title="Visualizar Detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="ot-action-btn"
                            onClick={() => handleOpenEdit(item)}
                            title="Editar Apontamento"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            className="ot-action-btn delete"
                            onClick={() => handleDeleteSingle(item.id)}
                            title="Excluir Apontamento"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modais Auxiliares ────────────────────────────────────────────── */}
      <OvertimeRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleSaveRecord}
        record={activeRecord}
        isViewOnly={isViewOnly}
        hotels={hotels}
      />

      <OvertimeSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentName={collaboratorName}
        currentSalary={baseSalary}
        onConfigUpdated={onRefresh}
      />
    </div>
  );
};

export default OvertimeDashboard;
