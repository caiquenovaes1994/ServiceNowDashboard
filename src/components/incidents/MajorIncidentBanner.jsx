import React from 'react';
import { Flame, Layers, CheckSquare, Square } from 'lucide-react';

const MajorIncidentBanner = ({
  majors = [],
  onToggleResponsibility,
  onOpenLinkedTickets
}) => {
  if (!majors || majors.length === 0) return null;

  return (
    <div className="major-incidents-wrapper">
      {majors.map((item) => {
        const isMyResp = Boolean(item.minha_responsabilidade);

        return (
          <div key={item.numero} className="major-incident-banner">
            <div className="major-incident-info">
              <div className="major-incident-icon-pulse">
                <Flame size={22} />
              </div>

              <div>
                <div className="major-incident-title">
                  <span>Major Incident: <strong>{item.numero}</strong></span>
                  <span className="badge-major">
                    {item.ocorrencias} {item.ocorrencias === 1 ? 'chamado' : 'chamados'}
                  </span>
                </div>
                <div className="major-incident-subtitle">
                  Hotel: {item.hotel || 'Não definido'} • Atualizado em: {item.ultima_atualizacao || '-'}
                </div>
              </div>
            </div>

            <div className="major-incident-actions">
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                onClick={() => onOpenLinkedTickets(item)}
              >
                <Layers size={15} />
                <span>Chamados Vinculados</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.8rem',
                  borderColor: isMyResp ? 'var(--primary)' : undefined,
                  color: isMyResp ? 'var(--primary)' : undefined
                }}
                onClick={() => onToggleResponsibility(item.numero, !isMyResp)}
                title="Marcar/desmarcar como minha responsabilidade direta"
              >
                {isMyResp ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>Minha Responsabilidade</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MajorIncidentBanner;
