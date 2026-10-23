import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, ReferenceLine
} from 'recharts';
import { 
  Calendar, BarChart3, Users, Activity, ArrowUp, ArrowDown, UploadCloud, ChevronDown, Check
} from 'lucide-react';

import NavigationTabs, { TABS } from './components/common/NavigationTabs.jsx';
import IncidentList from './components/incidents/IncidentList.jsx';
import { isIncidentStale } from './utils/incidentUtils.js';
import HotelManagement from './components/settings/HotelManagement.jsx';
import ResponsibleManagement from './components/settings/ResponsibleManagement.jsx';
import SettingsDropdown from './components/common/SettingsDropdown.jsx';

const API_BASE = '/api';

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// ── Unified Dropzone Uploader ──────────────────────────────────────────────────
const UnifiedUploader = ({ onSuccess, currentYear }) => {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const filesArray = Array.from(files);
    setStatus('uploading');
    setMessage('');
    let totalProcessed = 0;
    let errors = [];

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const ext = file.name.split('.').pop().toLowerCase();
      
      const formData = new FormData();
      formData.append('file', file);
      if (currentYear) formData.append('targetYear', currentYear);

      let endpoint = '';
      if (ext === 'csv') endpoint = `${API_BASE}/upload-metrics`;
      else if (ext === 'json') endpoint = `${API_BASE}/upload-json`;
      else {
        errors.push(`Ignorado: ${file.name}`);
        continue;
      }

      try {
        const res = await fetch(endpoint, { method: 'POST', body: formData });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Erro');
        totalProcessed++;
      } catch (err) {
        errors.push(`Erro (${ext}): ${err.message}`);
      }
    }

    if (errors.length > 0) {
      setStatus('error');
      setMessage(errors.join(' | '));
    } else if (totalProcessed > 0) {
      setStatus('success');
      setMessage(`${totalProcessed} arquivo(s) importado(s)!`);
      onSuccess();
    } else {
      setStatus('idle');
    }
    setTimeout(() => { setStatus('idle'); setMessage(''); }, 5000);
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (status !== 'uploading') handleFiles(e.dataTransfer.files);
  };

  const label = {
    idle: 'CSV / JSON',
    uploading: 'Processando…',
    success: 'Importação Concluída!',
    error: 'Aviso/Erro'
  }[status];

  return (
    <div 
      className={`unified-dropzone dropzone--${status}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => status === 'idle' && inputRef.current?.click()}
      title="Importar métricas via CSV (SLA) ou JSON (NPS)"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,.json,application/json"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <div className="dropzone-content">
        <UploadCloud size={20} strokeWidth={2.2} />
        <span>{label}</span>
      </div>
      {message && <span className="dropzone-msg">{message}</span>}
    </div>
  );
};

// ── Custom Styled Year Dropdown ────────────────────────────────────────────────
const YearDropdown = ({ value, onChange, options = [2024, 2025, 2026] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="year-dropdown-container" ref={containerRef}>
      <button 
        type="button"
        className={`year-filter-btn ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Filtrar por ano"
      >
        <Calendar size={18} strokeWidth={2.2} />
        <span>{value}</span>
        <ChevronDown 
          size={14} 
          strokeWidth={2.2} 
          className={`year-chevron ${isOpen ? 'rotate' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="year-dropdown-menu" role="listbox">
          {options.map((y) => {
            const isSelected = y === value;
            return (
              <div
                key={y}
                role="option"
                aria-selected={isSelected}
                className={`year-dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(y);
                  setIsOpen(false);
                }}
              >
                <span>{y}</span>
                {isSelected && <Check size={14} strokeWidth={2.5} className="item-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="clock-section">
      <div className="clock-date font-mono">
        {time.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
      </div>
      <div className="clock-time font-mono">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

const formatMonthTooltip = (item, fallbackLabel = '', allMetrics = []) => {
  let target = item;
  if (!target && fallbackLabel && allMetrics?.length) {
    target = allMetrics.find(m => m.shortMonth === fallbackLabel || m.month === fallbackLabel);
  }
  if (!target) return fallbackLabel;

  const monthName = target.month || fallbackLabel || '';
  const isVacation = target.is_vacation === 1 || target.is_vacation === '1' || target.is_vacation === true;
  const isProject = target.is_project === 1 || target.is_project === '1' || target.is_project === true;

  if (isVacation && isProject) {
    return `${monthName} (Férias / Projeto)`;
  }
  if (isVacation) {
    return `${monthName} (Férias)`;
  }
  if (isProject) {
    return `${monthName} (Projeto)`;
  }
  return monthName;
};

const RatioTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const label = formatMonthTooltip(item, item?.month);
    const closed = payload.find(p => p.dataKey === 'closed_count')?.value || 0;
    const evalld = payload.find(p => p.dataKey === 'evaluated_count')?.value || 0;
    const ratio = closed > 0 ? ((evalld / closed) * 100).toFixed(1) : 0;
    
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        <p style={{color: 'var(--primary)'}}>Fechados: {closed}</p>
        <p style={{color: 'var(--secondary)'}}>Avaliados: {evalld}</p>
        <p style={{color: 'var(--success)', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
          {ratio}%
        </p>
      </div>
    );
  }
  return null;
};

const MetricRow = ({ month, data, onSave, readOnly }) => {
  const [editData, setEditData] = useState({
    closed_count: 0,
    evaluated_count: 0,
    nps: 0,
    nps_general: 0,
    is_vacation: 0,
    is_project: 0,
    within_sla_count: 0,
    perfect_fix_count: 0
  });

  useEffect(() => {
    if (data) {
      Promise.resolve().then(() => {
        setEditData({
          closed_count: data.closed_count || 0,
          evaluated_count: data.evaluated_count || 0,
          nps: data.nps || 0,
          nps_general: data.nps_general || 0,
          is_vacation: data.is_vacation || 0,
          is_project: data.is_project || 0,
          within_sla_count: data.within_sla_count || 0,
          perfect_fix_count: data.perfect_fix_count || 0
        });
      });
    }
  }, [data]);

  const handleChange = (field, value) => {
    if (readOnly) return;
    let clampedValue = value;
    if (field === 'closed_count' || field === 'evaluated_count' || field === 'within_sla_count' || field === 'perfect_fix_count') {
      clampedValue = Math.min(Math.max(value, 0), 999);
    } else if (field === 'nps' || field === 'nps_general') {
      clampedValue = Math.min(Math.max(value, 0), 5.0);
    }
    setEditData(prev => ({ ...prev, [field]: clampedValue }));
  };

  const handleBlur = () => {
    if (readOnly) return;
    onSave(month, editData);
  };

  return (
    <div className={`metrics-row ${readOnly ? 'readonly' : ''}`}>
      <span className="row-label">{month}</span>
      <input 
        type="number" 
        className="input-minimal font-mono" 
        value={editData.closed_count} 
        onChange={(e) => handleChange('closed_count', parseInt(e.target.value) || 0)}
        onBlur={handleBlur}
        disabled={readOnly}
        placeholder="Fechados"
      />
      <input 
        type="number" 
        className="input-minimal font-mono" 
        value={editData.evaluated_count} 
        onChange={(e) => handleChange('evaluated_count', parseInt(e.target.value) || 0)}
        onBlur={handleBlur}
        disabled={readOnly}
        placeholder="Avaliados"
      />

      <input 
        type="number" 
        step="0.01"
        className="input-minimal font-mono" 
        value={editData.nps} 
        onChange={(e) => handleChange('nps', parseFloat(e.target.value) || 0)}
        onBlur={handleBlur}
        disabled={readOnly}
        placeholder="Meu NPS"
      />
      <input 
        type="number" 
        step="0.01"
        className="input-minimal font-mono" 
        value={editData.nps_general} 
        onChange={(e) => handleChange('nps_general', parseFloat(e.target.value) || 0)}
        onBlur={handleBlur}
        disabled={readOnly}
        placeholder="NPS Geral"
      />
      <div 
        className={`checkbox-container ${readOnly ? 'disabled' : ''}`} 
        onClick={() => {
          if (readOnly) return;
          const newVal = editData.is_vacation ? 0 : 1;
          handleChange('is_vacation', newVal);
          onSave(month, { ...editData, is_vacation: newVal });
        }}
      >
        <div className={`checkbox-custom ${editData.is_vacation ? 'checked' : ''}`}>
          {editData.is_vacation ? '✓' : ''}
        </div>
        Férias
      </div>
      <div 
        className={`checkbox-container ${readOnly ? 'disabled' : ''}`} 
        onClick={() => {
          if (readOnly) return;
          const newVal = editData.is_project ? 0 : 1;
          handleChange('is_project', newVal);
          onSave(month, { ...editData, is_project: newVal });
        }}
      >
        <div className={`checkbox-custom ${editData.is_project ? 'checked' : ''}`}>
          {editData.is_project ? '✓' : ''}
        </div>
        Projeto
      </div>
    </div>
  );
};

function App() {
  const [metrics, setMetrics] = useState([]);
  const [year, setYear] = useState(2026);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Estados de Navegação e Módulos Operacionais
  const [activeMainTab, setActiveMainTab] = useState(TABS.METRICS);
  const [activeIncidentSubTab, setActiveIncidentSubTab] = useState('Aberto');

  const [incidents, setIncidents] = useState([]);
  const [majorRecords, setMajorRecords] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [responsibles, setResponsibles] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/metrics?year=${year}`);
      if (response.data && Array.isArray(response.data.metrics)) {
        setMetrics(response.data.metrics);
      }
    } catch (err) {
      console.error("Error fetching metrics", err);
    }
  }, [year]);

  // Carregamento de dados operacionais
  const fetchIncidents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/incidentes?status=Todos`);
      if (Array.isArray(res.data)) setIncidents(res.data);
    } catch (err) {
      console.error("Error fetching incidentes", err);
    }
  }, []);

  const fetchMajorRecords = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/incidentes-maiores`);
      if (Array.isArray(res.data)) setMajorRecords(res.data);
    } catch (err) {
      console.error("Error fetching major records", err);
    }
  }, []);

  const fetchHotels = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/hoteis`);
      if (Array.isArray(res.data)) setHotels(res.data);
    } catch (err) {
      console.error("Error fetching hoteis", err);
    }
  }, []);

  const fetchResponsibles = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/responsaveis`);
      if (Array.isArray(res.data)) setResponsibles(res.data);
    } catch (err) {
      console.error("Error fetching responsaveis", err);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchData();
      fetchIncidents();
      fetchMajorRecords();
      fetchHotels();
      fetchResponsibles();
    });
  }, [fetchData, fetchIncidents, fetchMajorRecords, fetchHotels, fetchResponsibles]);

  const handleSaveMonth = async (month, data) => {
    try {
      await axios.post(`${API_BASE}/metrics`, { ...data, year, month });
      fetchData();
    } catch {
      alert("Erro ao salvar dados");
    }
  };

  // ── Handlers de Incidentes ────────────────────────────────────────────────
  const handleCreateIncident = async (data) => {
    try {
      await axios.post(`${API_BASE}/incidentes`, data);
      await fetchIncidents();
      await fetchMajorRecords();
    } catch (err) {
      alert("Erro ao criar incidente: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateIncident = async (id, data) => {
    try {
      await axios.put(`${API_BASE}/incidentes/${id}`, data);
      await fetchIncidents();
      await fetchMajorRecords();
    } catch (err) {
      alert("Erro ao atualizar incidente: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteIncident = async (id) => {
    try {
      await axios.delete(`${API_BASE}/incidentes/${id}`);
      await fetchIncidents();
      await fetchMajorRecords();
    } catch (err) {
      alert("Erro ao excluir incidente: " + (err.response?.data?.error || err.message));
    }
  };

  const handleReorderIncidents = async (ids) => {
    try {
      await axios.put(`${API_BASE}/incidentes/reordenar`, { ids });
      await fetchIncidents();
    } catch (err) {
      console.error("Erro ao reordenar incidentes:", err);
    }
  };

  const handleToggleMajorResponsibility = async (numero, val) => {
    try {
      await axios.post(`${API_BASE}/incidentes-maiores/${numero}/toggle`, { minha_responsabilidade: val });
      await fetchMajorRecords();
    } catch (err) {
      console.error("Erro ao alternar responsabilidade:", err);
    }
  };

  const handleFetchHistory = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/incidentes/${id}/historico`);
      return res.data;
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
      return [];
    }
  };

  const handleFetchChamados = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/incidentes/${id}/chamados`);
      return res.data;
    } catch (err) {
      console.error("Erro ao buscar chamados vinculados:", err);
      return [];
    }
  };

  const handleAddChamado = async (idIncidente, ticketData) => {
    try {
      await axios.post(`${API_BASE}/incidentes/${idIncidente}/chamados`, ticketData);
      await fetchIncidents();
      await fetchMajorRecords();
    } catch (err) {
      alert("Erro ao vincular chamado: " + (err.response?.data?.error || err.message));
    }
  };

  const handleRemoveChamado = async (idChamado) => {
    try {
      await axios.delete(`${API_BASE}/incidentes/chamados/${idChamado}`);
      await fetchIncidents();
      await fetchMajorRecords();
    } catch (err) {
      alert("Erro ao remover chamado: " + (err.response?.data?.error || err.message));
    }
  };

  // ── Handlers de Hotéis ───────────────────────────────────────────────────
  const handleCreateHotel = async (data) => {
    try {
      await axios.post(`${API_BASE}/hoteis`, data);
      await fetchHotels();
    } catch (err) {
      alert("Erro ao cadastrar hotel: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateHotel = async (id, data) => {
    try {
      await axios.put(`${API_BASE}/hoteis/${id}`, data);
      await fetchHotels();
    } catch (err) {
      alert("Erro ao atualizar hotel: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteHotel = async (id) => {
    try {
      await axios.delete(`${API_BASE}/hoteis/${id}`);
      await fetchHotels();
    } catch (err) {
      alert("Erro ao inativar/excluir hotel: " + (err.response?.data?.error || err.message));
    }
  };

  // ── Handlers de Responsáveis ─────────────────────────────────────────────
  const handleCreateResponsible = async (data) => {
    try {
      await axios.post(`${API_BASE}/responsaveis`, data);
      await fetchResponsibles();
    } catch (err) {
      alert("Erro ao cadastrar responsável: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateResponsible = async (id, data) => {
    try {
      await axios.put(`${API_BASE}/responsaveis/${id}`, data);
      await fetchResponsibles();
    } catch (err) {
      alert("Erro ao atualizar responsável: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteResponsible = async (id) => {
    try {
      await axios.delete(`${API_BASE}/responsaveis/${id}`);
      await fetchResponsibles();
    } catch (err) {
      alert("Erro ao inativar/excluir responsável: " + (err.response?.data?.error || err.message));
    }
  };

  // KPI Logic 
  const safeMetrics = Array.isArray(metrics) ? metrics.map(m => ({
    ...m,
    shortMonth: m.month ? m.month.substring(0, 3) : ''
  })) : [];
  
  const totalClosedYear = safeMetrics.reduce((acc, m) => acc + (m.closed_count || 0), 0);
  const totalEvaluatedYear = safeMetrics.reduce((acc, m) => acc + (m.evaluated_count || 0), 0);
  const totalWithinSlaYear = safeMetrics.reduce((acc, m) => acc + (m.within_sla_count || 0), 0);
  
  // Count months that have actual records (closed or evaluated > 0)
  const monthsWithData = safeMetrics.filter(m => (m.closed_count || 0) > 0 || (m.evaluated_count || 0) > 0).length;
  const monthsPassed = Math.max(monthsWithData, 1); // Avoid division by zero

  const avgClosedMonth = (totalClosedYear / monthsPassed).toFixed(1);
  const _avgClosedDay = (totalClosedYear / (monthsPassed * 22)).toFixed(1);
  
  const avgEvalMonth = (totalEvaluatedYear / monthsPassed).toFixed(1);
  const _avgEvalDay = (totalEvaluatedYear / (monthsPassed * 22)).toFixed(1);

  const slaAccuracy = totalClosedYear > 0 ? ((totalWithinSlaYear / totalClosedYear) * 100).toFixed(1) : "0";

  const totalPerfectFixYear = safeMetrics.reduce((acc, m) => acc + (m.perfect_fix_count || 0), 0);
  const perfectFixRate = totalClosedYear > 0 ? ((totalPerfectFixYear / totalClosedYear) * 100).toFixed(1) : "0";
  
  const evalIndex = totalClosedYear > 0 ? ((totalEvaluatedYear / totalClosedYear) * 100).toFixed(1) : "0";

  const npsValues = safeMetrics.filter(m => (m.nps || 0) > 0).map(m => m.nps);
  const avgNpsYear = npsValues.length > 0 
    ? (npsValues.reduce((acc, val) => acc + val, 0) / npsValues.length).toFixed(2)
    : "0.00";

  // Filter for months with evaluations (must not be vacation or project)
  const evaluatedMetrics = safeMetrics.filter(m => 
    (m.evaluated_count || 0) > 0 && 
    Number(m.is_vacation || 0) === 0 && 
    Number(m.is_project || 0) === 0
  );

  const getExtreme = (arr, key, isMax) => 
    arr.length > 0 ? arr.reduce((p, c) => (isMax ? c[key] > p[key] : c[key] < p[key]) ? c : p) : null;

  const bestNps = getExtreme(evaluatedMetrics, 'nps', true);
  const worstNps = getExtreme(evaluatedMetrics, 'nps', false);

  const bestNpsGeneral = getExtreme(evaluatedMetrics, 'nps_general', true);
  const worstNpsGeneral = getExtreme(evaluatedMetrics, 'nps_general', false);

  const bestClosed = getExtreme(evaluatedMetrics, 'closed_count', true);
  const worstClosed = getExtreme(evaluatedMetrics, 'closed_count', false);
  
  const bestEval = getExtreme(evaluatedMetrics, 'evaluated_count', true);
  const worstEval = getExtreme(evaluatedMetrics, 'evaluated_count', false);

  const ratioMetrics = evaluatedMetrics.map(m => ({
    ...m,
    ratio: ((m.evaluated_count || 0) / (m.closed_count || 1)) * 100
  }));
  
  const bestRatio = getExtreme(ratioMetrics, 'ratio', true);
  const worstRatio = getExtreme(ratioMetrics, 'ratio', false);

  const slaChartData = safeMetrics.map(m => ({
    ...m,
    sla_rate: m.closed_count > 0 ? ((m.within_sla_count || 0) / m.closed_count) * 100 : 0,
    perfect_fix_rate: m.closed_count > 0 ? ((m.perfect_fix_count || 0) / m.closed_count) * 100 : 0,
  }));

  const validSlaMetrics = slaChartData.filter(m => 
    (m.closed_count || 0) > 0 && 
    Number(m.is_vacation || 0) === 0 && 
    Number(m.is_project || 0) === 0
  );
  const bestSla = getExtreme(validSlaMetrics, 'sla_rate', true);
  const worstSla = getExtreme(validSlaMetrics, 'sla_rate', false);

  const bestPerfectFix = getExtreme(validSlaMetrics, 'perfect_fix_rate', true);
  const worstPerfectFix = getExtreme(validSlaMetrics, 'perfect_fix_rate', false);

  const isCurrentYear = year === new Date().getFullYear();
  const visibleMonths = isCurrentYear
    ? MONTHS.slice(0, new Date().getMonth() + 1).reverse()
    : [...MONTHS].reverse();

  const hasStaleIncidents = incidents.some(
    (inc) => inc.status !== 'Resolvido' && isIncidentStale(inc.ultima_atualizacao)
  );

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="title-section">
          <div>
            <h1>ServiceNow Dashboard</h1>
            <p className="welcome-msg">Painel Integrado de Gestão de Incidentes e<br></br> Análise de Desempenho</p>
          </div>
          
          {activeMainTab === TABS.METRICS && (
            <div className="controls">
              <YearDropdown 
                value={year} 
                onChange={setYear} 
                options={[2024, 2025, 2026]} 
              />
              <UnifiedUploader onSuccess={fetchData} currentYear={year} />
            </div>
          )}
        </div>
        
        <div className="header-right-group">
          <Clock />
          <SettingsDropdown 
            activeTab={activeMainTab}
            onSelectTab={setActiveMainTab}
          />
        </div>
      </header>

      {/* Navegação por Abas Principais */}
      <NavigationTabs
        activeTab={activeMainTab}
        onTabChange={setActiveMainTab}
        openIncidentsCount={incidents.filter(i => i.status !== 'Resolvido').length}
        hasStaleIncidents={hasStaleIncidents}
      />

      {/* Módulo 1: Métricas & KPIs Analíticos */}
      {activeMainTab === TABS.METRICS && (
        <>
          <div className="kpi-grid">
        <div className="card kpi-card split-kpi-card">
          <div className="split-kpi-section">
            <span className="label">Total Fechados</span>
            <span className="value font-mono">{totalClosedYear}</span>
          </div>
          <div className="split-kpi-section">
            <span className="label">Fechados/Mês</span>
            <span className="value font-mono">{avgClosedMonth}</span>
          </div>
        </div>

        <div className="card kpi-card split-kpi-card">
          <div className="split-kpi-section">
            <span className="label">NPS Médio</span>
            <span className="value font-mono" style={{color: 'var(--primary)'}}>{avgNpsYear}</span>
          </div>
          <div className="split-kpi-section">
            <span className="label">Índice Avaliações</span>
            <span className="value font-mono" style={{color: 'var(--primary)'}}>{evalIndex}%</span>
          </div>
        </div>

        <div className="card kpi-card split-kpi-card">
          <div className="split-kpi-section">
            <span className="label">Total Avaliados</span>
            <span className="value font-mono">{totalEvaluatedYear}</span>
          </div>
          <div className="split-kpi-section">
            <span className="label">Avaliações/Mês</span>
            <span className="value font-mono">{avgEvalMonth}</span>
          </div>
        </div>

        <div className="card kpi-card split-kpi-card">
          <div className="split-kpi-section">
            <span className="label">SLA</span>
            <span className="value font-mono" style={{
              color: Number(slaAccuracy) >= 95 ? 'var(--success)' : 
                     Number(slaAccuracy) <= 70 ? 'var(--error)' : 'var(--secondary)'
            }}>{slaAccuracy}%</span>
            <span className="meta font-mono" style={{ display: 'block', color: '#eab308', fontSize: '0.65rem', marginTop: '-0.25rem', fontWeight: 600 }}>Meta: 95%</span>
          </div>
          <div className="split-kpi-section">
            <span className="label">Perfect Fix</span>
            <span className="value font-mono" style={{
              color: Number(perfectFixRate) >= 80 ? 'var(--success)' : 
                     Number(perfectFixRate) <= 70 ? 'var(--error)' : 'var(--secondary)'
            }}>{perfectFixRate}%</span>
            <span className="meta font-mono" style={{ display: 'block', color: '#ffffff', fontSize: '0.65rem', marginTop: '-0.25rem', fontWeight: 600 }}>Meta: 80%</span>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="card chart-card">
          <span className="label" style={{marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
            <Users size={16}/> Comparação NPS
          </span>
          <div style={{width: '100%', height: '198px'}}>
            <ResponsiveContainer>
              <LineChart data={safeMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="shortMonth" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                <Tooltip labelFormatter={(label, payload) => formatMonthTooltip(payload?.[0]?.payload, label, safeMetrics)} contentStyle={{background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="nps" name="Meu NPS" stroke="var(--primary)" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="nps_general" name="NPS Geral" stroke="var(--secondary)" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {bestNps && worstNps && (
            <div className="chart-highlights multi-row">
              <div className="highlight-group">
                <span className="group-label" style={{ color: 'var(--primary)' }}>Meu NPS:</span>
                <div className="highlight-item best">
                  <ArrowUp size={14} />
                  <span>{bestNps.shortMonth?.toUpperCase()} ({bestNps.nps.toFixed(2)})</span>
                </div>
                <div className="highlight-item worst">
                  <ArrowDown size={14} />
                  <span>{worstNps.shortMonth?.toUpperCase()} ({worstNps.nps.toFixed(2)})</span>
                </div>
              </div>
              {bestNpsGeneral && worstNpsGeneral && (
                <div className="highlight-group">
                  <span className="group-label" style={{ color: 'var(--secondary)' }}>NPS Geral:</span>
                  <div className="highlight-item best">
                    <ArrowUp size={14} />
                    <span>{bestNpsGeneral.shortMonth?.toUpperCase()} ({bestNpsGeneral.nps_general.toFixed(2)})</span>
                  </div>
                  <div className="highlight-item worst">
                    <ArrowDown size={14} />
                    <span>{worstNpsGeneral.shortMonth?.toUpperCase()} ({worstNpsGeneral.nps_general.toFixed(2)})</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card chart-card">
          <span className="label" style={{marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
            <BarChart3 size={16}/> Volume de Chamados
          </span>
          <div style={{width: '100%', height: '198px'}}>
            <ResponsiveContainer>
              <BarChart data={safeMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="shortMonth" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={(label, payload) => formatMonthTooltip(payload?.[0]?.payload, label, safeMetrics)} cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} />
                <Legend iconType="circle" />
                <Bar dataKey="closed_count" name="Fechados" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="evaluated_count" name="Avaliados" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-highlights multi-row">
            <div className="highlight-group">
              <span className="group-label" style={{ color: 'var(--primary)' }}>Fechados:</span>
              <div className="highlight-item best"><ArrowUp size={14} /> <span>{bestClosed?.shortMonth?.toUpperCase()} ({bestClosed?.closed_count})</span></div>
              <div className="highlight-item worst"><ArrowDown size={14} /> <span>{worstClosed?.shortMonth?.toUpperCase()} ({worstClosed?.closed_count})</span></div>
            </div>
            <div className="highlight-group">
              <span className="group-label" style={{ color: 'var(--secondary)' }}>Avaliados:</span>
              <div className="highlight-item best"><ArrowUp size={14} /> <span>{bestEval?.shortMonth?.toUpperCase()} ({bestEval?.evaluated_count})</span></div>
              <div className="highlight-item worst"><ArrowDown size={14} /> <span>{worstEval?.shortMonth?.toUpperCase()} ({worstEval?.evaluated_count})</span></div>
            </div>
          </div>
        </div>

        <div className="card chart-card">
          <span className="label" style={{marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
            <Activity size={16}/> Índice de Avaliações
          </span>
          <div style={{width: '100%', height: '198px'}}>
            <ResponsiveContainer>
              <LineChart data={safeMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="shortMonth" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip content={<RatioTooltip />} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="closed_count" name="Fechados" stroke="var(--primary)" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="evaluated_count" name="Avaliados" stroke="var(--secondary)" strokeWidth={2} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {bestRatio && worstRatio && (
            <div className="chart-highlights multi-row">
              <div className="highlight-item best"><ArrowUp size={14} /> <span>{bestRatio.shortMonth?.toUpperCase()} ({bestRatio.ratio.toFixed(1)}%)</span></div>
              <div className="highlight-item worst"><ArrowDown size={14} /> <span>{worstRatio.shortMonth?.toUpperCase()} ({worstRatio.ratio.toFixed(1)}%)</span></div>
            </div>
          )}
        </div>

        <div className="card chart-card">
          <span className="label" style={{marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
            <Activity size={16}/> SLA & Perfect Fix
          </span>
          <div style={{width: '100%', height: '198px'}}>
            <ResponsiveContainer>
              <LineChart data={slaChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="shortMonth" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip labelFormatter={(label, payload) => formatMonthTooltip(payload?.[0]?.payload, label, slaChartData)} contentStyle={{background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} formatter={(value) => `${Number(value).toFixed(1)}%`} />
                <Legend iconType="circle" />
                <ReferenceLine y={95} stroke="#eab308" strokeDasharray="3 3" strokeWidth={2} label={{ position: 'top', value: 'Meta SLA (95%)', fill: '#eab308', fontSize: 12, fontWeight: 'bold' }} />
                <ReferenceLine y={80} stroke="#ffffff" strokeDasharray="3 3" strokeWidth={2} label={{ position: 'top', value: 'Meta PF (80%)', fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="sla_rate" name="SLA" stroke="var(--success)" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="perfect_fix_rate" name="Perfect Fix" stroke="var(--primary)" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-highlights multi-row">
            <div className="highlight-group">
              <span className="group-label" style={{ color: 'var(--success)' }}>SLA:</span>
              <div className="highlight-item best"><ArrowUp size={14} /> <span>{bestSla?.shortMonth?.toUpperCase()} ({bestSla?.sla_rate.toFixed(1)}%)</span></div>
              <div className="highlight-item worst"><ArrowDown size={14} /> <span>{worstSla?.shortMonth?.toUpperCase()} ({worstSla?.sla_rate.toFixed(1)}%)</span></div>
            </div>
            <div className="highlight-group">
              <span className="group-label" style={{ color: 'var(--primary)' }}>Perfect Fix:</span>
              <div className="highlight-item best"><ArrowUp size={14} /> <span>{bestPerfectFix?.shortMonth?.toUpperCase()} ({bestPerfectFix?.perfect_fix_rate.toFixed(1)}%)</span></div>
              <div className="highlight-item worst"><ArrowDown size={14} /> <span>{worstPerfectFix?.shortMonth?.toUpperCase()} ({worstPerfectFix?.perfect_fix_rate.toFixed(1)}%)</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className={`details-section-container ${isDetailsOpen ? 'is-expanded' : ''}`}>
        <div className="details-header">
          <button 
            type="button"
            className={`details-toggle-btn ${isDetailsOpen ? 'is-active' : ''}`}
            onClick={() => setIsDetailsOpen(prev => !prev)}
            aria-expanded={isDetailsOpen}
            title={isDetailsOpen ? "Recolher Detalhamento Mensal" : "Expandir Detalhamento Mensal"}
          >
            <span>Detalhamento Mensal</span>
            <ArrowDown 
              size={18} 
              strokeWidth={2.2} 
              className={`details-arrow-icon ${isDetailsOpen ? 'rotate' : ''}`} 
            />
          </button>
        </div>

        <div className={`details-collapse-wrapper ${isDetailsOpen ? 'expanded' : ''}`}>
          <div className="details-collapse-inner">
            <div className="metrics-grid">
              <div className="metrics-row" style={{background: 'transparent', border: 'none', paddingBottom: 0}}>
                <span className="row-label">Mês</span>
                <span className="row-label">Fechados</span>
                <span className="row-label">Avaliados</span>

                <span className="row-label">Meu NPS</span>
                <span className="row-label">NPS Geral</span>
                <span className="row-label">Férias</span>
                <span className="row-label">Projeto</span>
              </div>
              
              {visibleMonths.map(month => {
                const today = new Date();
                const currentYear = today.getFullYear();
                const currentMonthIdx = today.getMonth();
                const currentMonthName = MONTHS[currentMonthIdx];
                const currentDay = today.getDate();

                let prevMonthIdx = currentMonthIdx - 1;
                let prevYear = currentYear;
                if (prevMonthIdx < 0) {
                  prevMonthIdx = 11;
                  prevYear = currentYear - 1;
                }
                const prevMonthName = MONTHS[prevMonthIdx];

                const isEditable = (year === currentYear && month === currentMonthName) || 
                                   (year === prevYear && month === prevMonthName && currentDay < 10);
                
                return (
                  <MetricRow 
                    key={`${year}-${month}`} 
                    month={month} 
                    data={safeMetrics.find(m => m.month === month)}
                    onSave={handleSaveMonth}
                    readOnly={!isEditable}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Módulo 2: Gestão Operacional de Incidentes */}
      {activeMainTab === TABS.INCIDENTS && (
        <IncidentList
          incidents={incidents}
          majorRecords={majorRecords}
          hotels={hotels}
          responsibles={responsibles}
          activeSubTab={activeIncidentSubTab}
          onSubTabChange={setActiveIncidentSubTab}
          onCreateIncident={handleCreateIncident}
          onUpdateIncident={handleUpdateIncident}
          onDeleteIncident={handleDeleteIncident}
          onReorderIncidents={handleReorderIncidents}
          onToggleMajorResponsibility={handleToggleMajorResponsibility}
          onFetchHistory={handleFetchHistory}
          onFetchChamados={handleFetchChamados}
          onAddChamado={handleAddChamado}
          onRemoveChamado={handleRemoveChamado}
        />
      )}

      {/* Módulo 3: Gestão de Hotéis */}
      {activeMainTab === TABS.HOTELS && (
        <HotelManagement
          hotels={hotels}
          onCreateHotel={handleCreateHotel}
          onUpdateHotel={handleUpdateHotel}
          onDeleteHotel={handleDeleteHotel}
        />
      )}

      {/* Módulo 4: Gestão de Responsáveis */}
      {activeMainTab === TABS.RESPONSIBLES && (
        <ResponsibleManagement
          responsibles={responsibles}
          onCreateResponsible={handleCreateResponsible}
          onUpdateResponsible={handleUpdateResponsible}
          onDeleteResponsible={handleDeleteResponsible}
        />
      )}
    </div>
  );
}

export default App;
