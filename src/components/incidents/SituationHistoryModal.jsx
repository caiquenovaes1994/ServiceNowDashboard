import React from 'react';
import { History, X } from 'lucide-react';

const SituationHistoryModal = ({
  isOpen,
  incident,
  history = [],
  onClose
}) => {
  if (!isOpen || !incident) return null;

  return (
    <div className="modal-backdrop">
      <div
        className="modal-container"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">
            <History size={20} />
            <span>Histórico de Situação — {incident.incidente}</span>
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-faint)' }}>
              Nenhum histórico de alteração registrado para este incidente.
            </div>
          ) : (
            <div className="table-wrapper" style={{ maxHeight: '350px' }}>
              <table className="app-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Data / Hora</th>
                    <th style={{ width: '60%' }}>Situação Registrada</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--primary)' }}>
                        {h.timestamp}
                      </td>
                      <td style={{ textAlign: 'left', fontWeight: 500 }}>
                        {h.situacao || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SituationHistoryModal;
