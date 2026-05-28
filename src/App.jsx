import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, ReferenceLine
} from 'recharts';
import { 
  Calendar, BarChart3, Users, Activity, ArrowUp, ArrowDown, UploadCloud
} from 'lucide-react';

const API_BASE = '/api';

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// ── CSV Upload Button ─────────────────────────────────────────────────────────
const CsvUploader = ({ onSuccess, currentYear }) => {
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input so the same file can be re-uploaded if needed
    e.target.value = '';

    setStatus('uploading');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    if (currentYear) {
      formData.append('targetYear', currentYear);
    }

    try {
      const res = await fetch(`${API_BASE}/upload-metrics`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Erro desconhecido');

      setStatus('success');
      setMessage(`${json.rows_processed} linhas · ${json.months_updated} meses`);
      onSuccess();

      setTimeout(() => { setStatus('idle'); setMessage(''); }, 4000);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
      setTimeout(() => { setStatus('idle'); setMessage(''); }, 5000);
    }
  };

  const label = {
    idle:      'Importar CSV',
    uploading: 'Processando…',
    success:   'Importado!',
    error:     'Erro',
  }[status];

  return (
    <div className="csv-uploader">
      <input
        ref={inputRef}
        id="csv-file-input"
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button
        id="csv-upload-btn"
        className={`btn-import btn-import--${status}`}
        onClick={() => status === 'idle' && inputRef.current?.click()}
        disabled={status === 'uploading'}
        title="Importar métricas de SLA via CSV do ServiceNow"
      >
        <UploadCloud size={15} strokeWidth={2.2} />
        <span>{label}</span>
      </button>
      {message && (
        <span className={`import-msg import-msg--${status}`}>{message}</span>
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

const RatioTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const label = payload[0].payload.month;
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

  console.log("Dashboard Render Check - Metrics Count:", metrics?.length);

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

  useEffect(() => {
    Promise.resolve().then(() => fetchData());
  }, [fetchData]);

  const handleSaveMonth = async (month, data) => {
    try {
      await axios.post(`${API_BASE}/metrics`, { ...data, year, month });
      fetchData();
    } catch {
      alert("Erro ao salvar dados");
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
  const avgClosedDay = (totalClosedYear / (monthsPassed * 22)).toFixed(1);
  
  const avgEvalMonth = (totalEvaluatedYear / monthsPassed).toFixed(1);
  const avgEvalDay = (totalEvaluatedYear / (monthsPassed * 22)).toFixed(1);

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

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="title-section" style={{display: 'flex', alignItems: 'center', gap: '2rem'}}>
          <div>
            <h1>ServiceNow Dashboard</h1>
            <p className="welcome-msg">Olá, Caique!</p>
          </div>
          
          <div className="controls" style={{display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Calendar size={18} color="#64748b"/>
              <select 
                className="select-year" 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <CsvUploader onSuccess={fetchData} currentYear={year} />
          </div>
        </div>
        
        <Clock />
      </header>

      <div className="kpi-grid">
        <div className="card kpi-card">
          <span className="label">Total de chamados fechados</span>
          <span className="value font-mono">{totalClosedYear}</span>
        </div>
        <div className="card kpi-card">
          <span className="label">Fechados por mês</span>
          <span className="value font-mono">{avgClosedMonth}</span>
        </div>
        <div className="card kpi-card">
          <span className="label">NPS Médio</span>
          <span className="value font-mono" style={{color: 'var(--primary)'}}>{avgNpsYear}</span>
        </div>
        <div className="card kpi-card">
          <span className="label">SLA%</span>
          <span className="value font-mono" style={{
            color: Number(slaAccuracy) >= 95 ? 'var(--success)' : 
                   Number(slaAccuracy) <= 70 ? 'var(--error)' : 'var(--secondary)'
          }}>{slaAccuracy}%</span>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card">
          <span className="label">Total de chamados avaliados</span>
          <span className="value font-mono">{totalEvaluatedYear}</span>
        </div>
        <div className="card kpi-card">
          <span className="label">Avaliações por mês</span>
          <span className="value font-mono">{avgEvalMonth}</span>
        </div>
        <div className="card kpi-card">
          <span className="label">Índice de Avaliação</span>
          <span className="value font-mono" style={{color: 'var(--primary)'}}>{evalIndex}%</span>
        </div>
        <div className="card kpi-card">
          <span className="label">Perfect Fix</span>
          <span className="value font-mono" style={{
            color: Number(perfectFixRate) >= 80 ? 'var(--success)' : 
                   Number(perfectFixRate) <= 70 ? 'var(--error)' : 'var(--secondary)'
          }}>{perfectFixRate}%</span>
        </div>
      </div>

      <div className="charts-section">
        <div className="card chart-card">
          <span className="label" style={{marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
            <Users size={16}/> Comparação NPS
          </span>
          <div style={{width: '100%', height: '200px'}}>
            <ResponsiveContainer>
              <LineChart data={safeMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="shortMonth" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={(label, payload) => payload?.[0]?.payload?.month || label} contentStyle={{background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} />
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
          <div style={{width: '100%', height: '200px'}}>
            <ResponsiveContainer>
              <BarChart data={safeMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="shortMonth" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={(label, payload) => payload?.[0]?.payload?.month || label} cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} />
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
          <div style={{width: '100%', height: '200px'}}>
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
          <div style={{width: '100%', height: '200px'}}>
            <ResponsiveContainer>
              <LineChart data={slaChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="shortMonth" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip labelFormatter={(label, payload) => payload?.[0]?.payload?.month || label} contentStyle={{background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} formatter={(value) => `${Number(value).toFixed(1)}%`} />
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

      <div className="metrics-table-container">
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

            let prevMonthIdx = currentMonthIdx - 1;
            let prevYear = currentYear;
            if (prevMonthIdx < 0) {
              prevMonthIdx = 11;
              prevYear = currentYear - 1;
            }
            const prevMonthName = MONTHS[prevMonthIdx];

            const isEditable = (year === currentYear && month === currentMonthName) || 
                               (year === prevYear && month === prevMonthName);
            
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
  );
}

export default App;
