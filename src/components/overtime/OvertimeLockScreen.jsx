import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Lock, KeyRound, Eye, EyeOff, User, DollarSign } from 'lucide-react';

const OvertimeLockScreen = ({ isConfigured, onUnlockSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [collaboratorName, setCollaboratorName] = useState('CAIQUE NOVAES');
  const [baseSalary, setBaseSalary] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isConfigured) {
      if (password.length < 4) {
        setError('A senha deve ter no mínimo 4 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }

      setLoading(true);
      try {
        const res = await axios.post('/api/overtime/auth/setup', {
          password,
          collaboratorName: collaboratorName.trim() || 'CAIQUE NOVAES',
          baseSalary: baseSalary ? parseFloat(baseSalary.replace(',', '.')) : 0
        });
        if (res.data.success) {
          onUnlockSuccess({
            collaboratorName: res.data.collaboratorName,
            baseSalary: res.data.baseSalary,
            salaryDivisor: res.data.salaryDivisor
          });
        }
      } catch (err) {
        if (!err.response) {
          setError('Não foi possível conectar ao servidor backend (Porta 5000). Verifique se o servidor está em execução.');
        } else {
          setError(err.response?.data?.error || 'Erro ao configurar a senha.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      if (!password) {
        setError('Por favor, informe a senha de acesso.');
        return;
      }

      setLoading(true);
      try {
        const res = await axios.post('/api/overtime/auth/verify', { password });
        if (res.data.success) {
          onUnlockSuccess({
            collaboratorName: res.data.collaboratorName,
            baseSalary: res.data.baseSalary,
            salaryDivisor: res.data.salaryDivisor
          });
        }
      } catch (err) {
        if (!err.response) {
          setError('Não foi possível conectar ao servidor backend (Porta 5000). Verifique se o servidor está em execução.');
        } else {
          setError(err.response?.data?.error || 'Senha incorreta.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="ot-lock-wrapper">
      <div className="ot-lock-card">
        <div className="ot-lock-icon">
          {isConfigured ? <Lock size={32} /> : <ShieldCheck size={32} />}
        </div>

        <h2 className="ot-lock-title">
          {isConfigured ? 'Controle de Horas Extras' : 'Configuração Inicial de Acesso'}
        </h2>

        <p className="ot-lock-desc">
          {isConfigured
            ? 'Este módulo contém registros de apontamento e dados privados. Digite sua senha para desbloquear.'
            : 'Como este é seu primeiro acesso, defina sua senha pessoal para proteger seus apontamentos e relatórios.'}
        </p>

        {error && (
          <div className="badge badge-alert" style={{ width: '100%', marginBottom: '1rem', padding: '0.65rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="ot-lock-form">
          {!isConfigured && (
            <>
              <div>
                <label className="form-label">
                  <User size={15} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Seu Nome Completo
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: CAIQUE NOVAES"
                  value={collaboratorName}
                  onChange={(e) => setCollaboratorName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  <DollarSign size={15} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Salário Base Mensal (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="Ex: 3500.00"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                />
                <span className="ot-field-hint">Usado nos cálculos de ganhos estimados.</span>
              </div>
            </>
          )}

          <div>
            <label className="form-label">
              <KeyRound size={15} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              {isConfigured ? 'Senha de Acesso' : 'Definir Senha'}
            </label>
            <div className="ot-password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Digite a senha..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isConfigured ? 'current-password' : 'new-password'}
                autoFocus
                required
              />
              <button
                type="button"
                className="ot-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isConfigured && (
            <div>
              <label className="form-label">Confirme a Senha</label>
              <div className="ot-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Repita a senha..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-wine"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Validando...' : isConfigured ? '🔓 Desbloquear Módulo' : '💾 Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OvertimeLockScreen;
