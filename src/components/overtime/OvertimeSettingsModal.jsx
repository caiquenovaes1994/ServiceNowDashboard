import React, { useState } from 'react';
import axios from 'axios';
import { X, Settings, User, DollarSign, KeyRound, Check, AlertCircle } from 'lucide-react';

const OvertimeSettingsModal = ({ isOpen, onClose, currentName, currentSalary, onConfigUpdated }) => {
  const [collaboratorName, setCollaboratorName] = useState(currentName || 'CAIQUE NOVAES');
  const [baseSalary, setBaseSalary] = useState(currentSalary !== undefined ? String(currentSalary) : '0');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword) {
      if (!currentPassword) {
        setError('Por favor, informe a senha atual para definir uma nova senha.');
        return;
      }
      if (newPassword.length < 4) {
        setError('A nova senha deve ter no mínimo 4 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('A nova senha e a confirmação não coincidem.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        collaboratorName: collaboratorName.trim().toUpperCase(),
        baseSalary: baseSalary ? parseFloat(baseSalary.replace(',', '.')) : 0
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await axios.put('/api/overtime/auth/config', payload);
      if (res.data.success) {
        setSuccess('Configurações salvas com sucesso!');
        if (onConfigUpdated) {
          onConfigUpdated({
            collaboratorName: payload.collaboratorName,
            baseSalary: payload.baseSalary
          });
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao atualizar configurações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Settings size={20} style={{ color: '#ff6b6b' }} />
            Configurações do Módulo de Horas Extras
          </h2>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="badge badge-alert" style={{ margin: '1rem 1.5rem 0 1.5rem', padding: '0.65rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="badge badge-success" style={{ margin: '1rem 1.5rem 0 1.5rem', padding: '0.65rem', color: '#4ade80' }}>
            <Check size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label className="form-label">
                <User size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Nome do Titular (Cabeçalho dos Relatórios)
              </label>
              <input
                type="text"
                className="form-input"
                value={collaboratorName}
                onChange={(e) => setCollaboratorName(e.target.value)}
                required
              />
              <span className="ot-field-hint">Aparecerá no campo "PLANTONISTA:" da Folha de Ponto gerada.</span>
            </div>

            <div>
              <label className="form-label">
                <DollarSign size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Salário Base Mensal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
              />
              <span className="ot-field-hint">
                Usado exclusivamente no cálculo do card privado de Ganhos Estimados (Divisor legal: 200h/mês). Não é impresso no PDF.
              </span>
            </div>

            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.08)', margin: '0.5rem 0' }} />

            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-white)' }}>
                <KeyRound size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Alterar Senha de Acesso
              </span>
              <p className="ot-field-hint" style={{ marginBottom: '0.75rem' }}>
                Deixe os campos abaixo em branco caso não deseje alterar sua senha.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Senha Atual</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Digite a senha atual..."
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label">Nova Senha</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Nova senha..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Confirmar Senha</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Confirmar..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-wine" disabled={loading}>
              <Check size={16} />
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OvertimeSettingsModal;
