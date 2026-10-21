import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  title = 'Confirmação',
  message = 'Tem certeza que deseja executar esta ação?',
  subtext = '',
  confirmLabel = 'Confirmar',
  confirmVariant = 'danger',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-container modal-sm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body confirm-dialog-content">
          <div className="confirm-dialog-icon">
            <AlertTriangle size={28} />
          </div>
          <p className="confirm-dialog-text">{message}</p>
          {subtext && <p className="confirm-dialog-subtext">{subtext}</p>}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
