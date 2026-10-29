import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ShieldAlert, Loader2, RotateCcw } from 'lucide-react';
import OvertimeLockScreen from './OvertimeLockScreen.jsx';
import OvertimeDashboard from './OvertimeDashboard.jsx';

const MESES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutos (120.000 ms)

const OvertimeModule = () => {
  const [isConfigured, setIsConfigured] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    const unlocked = sessionStorage.getItem('ot_unlocked') === 'true';
    const lastAct = Number(sessionStorage.getItem('ot_last_activity') || 0);
    if (unlocked && lastAct > 0 && Date.now() - lastAct < INACTIVITY_TIMEOUT_MS) {
      return true;
    }
    sessionStorage.removeItem('ot_unlocked');
    sessionStorage.removeItem('ot_last_activity');
    return false;
  });
  const [collaboratorName, setCollaboratorName] = useState('CAIQUE NOVAES');
  const [baseSalary, setBaseSalary] = useState(0);
  const [salaryDivisor, setSalaryDivisor] = useState(200);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const currentMonthIdx = new Date().getMonth();
    return MESES[currentMonthIdx];
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const [chamados, setChamados] = useState([]);
  const [kpis, setKpis] = useState({});
  const [periodo, setPeriodo] = useState({});
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Escuta evento global de auto-lock disparado pelo monitor de inatividade (ex: quando usuário está em outra aba)
  useEffect(() => {
    const handleOtLock = () => {
      setIsUnlocked(false);
    };

    window.addEventListener('ot_lock', handleOtLock);
    return () => window.removeEventListener('ot_lock', handleOtLock);
  }, []);

  // Monitor de ações do usuário dentro da aba Horas Extras
  const handleLock = useCallback(() => {
    setIsUnlocked(false);
    sessionStorage.removeItem('ot_unlocked');
    sessionStorage.removeItem('ot_last_activity');
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;

    let lastRecorded = Date.now();
    sessionStorage.setItem('ot_last_activity', String(lastRecorded));

    const recordUserActivity = () => {
      const now = Date.now();
      if (now - lastRecorded >= 1000) {
        lastRecorded = now;
        sessionStorage.setItem('ot_last_activity', String(now));
      }
    };

    const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel', 'click'];
    ACTIVITY_EVENTS.forEach((evt) => {
      window.addEventListener(evt, recordUserActivity, { passive: true });
    });

    // Intervalo local para bloquear se o usuário ficar inativo 2 minutos nesta aba
    const checkInterval = setInterval(() => {
      const lastAct = Number(sessionStorage.getItem('ot_last_activity') || 0);
      if (!lastAct || Date.now() - lastAct >= INACTIVITY_TIMEOUT_MS) {
        handleLock();
      }
    }, 1000);

    return () => {
      clearInterval(checkInterval);
      ACTIVITY_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, recordUserActivity);
      });
    };
  }, [isUnlocked, handleLock]);

  // Verifica o status de configuração inicial do módulo
  const checkAuthStatus = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await axios.get('/api/overtime/auth/status');
      setIsConfigured(Boolean(res.data.isConfigured));
      setCollaboratorName(res.data.collaboratorName || 'CAIQUE NOVAES');
      setBaseSalary(res.data.baseSalary || 0);
      setSalaryDivisor(res.data.salaryDivisor || 200);
    } catch (err) {
      console.error('Erro ao verificar status de horas extras:', err);
      if (!err.response) {
        setAuthError('Não foi possível conectar ao servidor backend (Porta 5000). Verifique se o servidor está ativo.');
      } else {
        // Se o servidor respondeu, mas não encontrou config
        setIsConfigured(false);
      }
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Busca lista de hotéis para o dropdown de apontamento
  const fetchHotels = useCallback(async () => {
    try {
      const res = await axios.get('/api/hoteis');
      if (Array.isArray(res.data)) {
        setHotels(res.data);
      }
    } catch (err) {
      console.warn('Falha ao buscar hotéis:', err.message);
    }
  }, []);

  // Busca os chamados e KPIs do mês/ano selecionado
  const fetchChamados = useCallback(async () => {
    if (!isUnlocked) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/overtime/chamados?mes=${encodeURIComponent(selectedMonth)}&ano=${selectedYear}`
      );
      setChamados(res.data.chamados || []);
      setKpis(res.data.kpis || {});
      setPeriodo(res.data.periodo || {});
    } catch (err) {
      console.error('Erro ao buscar chamados de horas extras:', err);
    } finally {
      setLoading(false);
    }
  }, [isUnlocked, selectedMonth, selectedYear]);

  useEffect(() => {
    checkAuthStatus();
    fetchHotels();
  }, [checkAuthStatus, fetchHotels]);

  useEffect(() => {
    if (isUnlocked) {
      fetchChamados();
    }
  }, [isUnlocked, fetchChamados]);

  const handleUnlockSuccess = (config) => {
    setIsConfigured(true);
    setIsUnlocked(true);
    sessionStorage.setItem('ot_unlocked', 'true');
    sessionStorage.setItem('ot_last_activity', String(Date.now()));
    if (config?.collaboratorName) setCollaboratorName(config.collaboratorName);
    if (config?.baseSalary !== undefined) setBaseSalary(config.baseSalary);
    if (config?.salaryDivisor) setSalaryDivisor(config.salaryDivisor);
  };

  if (!isUnlocked) {
    if (authLoading) {
      return (
        <div className="ot-lock-wrapper">
          <div className="ot-lock-card">
            <div className="ot-lock-icon">
              <Loader2 size={32} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
            </div>
            <h2 className="ot-lock-title">Módulo de Horas Extras</h2>
            <p className="ot-lock-desc">Verificando status de segurança...</p>
          </div>
        </div>
      );
    }

    if (authError) {
      return (
        <div className="ot-lock-wrapper">
          <div className="ot-lock-card">
            <div className="ot-lock-icon" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}>
              <ShieldAlert size={32} />
            </div>
            <h2 className="ot-lock-title">Servidor Indisponível</h2>
            <p className="ot-lock-desc">{authError}</p>
            <button
              type="button"
              className="btn-wine"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={checkAuthStatus}
            >
              <RotateCcw size={16} />
              Tentar Conectar Novamente
            </button>
          </div>
        </div>
      );
    }

    return (
      <OvertimeLockScreen
        isConfigured={isConfigured}
        onUnlockSuccess={handleUnlockSuccess}
      />
    );
  }

  return (
    <OvertimeDashboard
      chamados={chamados}
      kpis={kpis}
      periodo={periodo}
      selectedMonth={selectedMonth}
      selectedYear={selectedYear}
      onMonthChange={setSelectedMonth}
      onYearChange={setSelectedYear}
      onRefresh={() => {
        checkAuthStatus();
        fetchChamados();
      }}
      onLock={handleLock}
      collaboratorName={collaboratorName}
      baseSalary={baseSalary}
      salaryDivisor={salaryDivisor}
      hotels={hotels}
      loading={loading}
    />
  );
};

export default OvertimeModule;

