import React, { useState } from 'react';
import { Layers, Plus, Trash2, X, FileSpreadsheet } from 'lucide-react';
import AutocompleteInput from '../common/AutocompleteInput.jsx';

const LinkedTicketsModal = ({
  isOpen,
  incident,
  tickets = [],
  hotels = [],
  onClose,
  onAddTicket,
  onRemoveTicket,
  onExportTickets
}) => {
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelQuery, setHotelQuery] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !incident) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!ticketNumber.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddTicket({
        id_hotel: selectedHotel?.id || null,
        hotel_texto: selectedHotel ? `${selectedHotel.rid} - ${selectedHotel.nome}` : hotelQuery,
        ticket: ticketNumber.trim()
      });
      setTicketNumber('');
      setHotelQuery('');
      setSelectedHotel(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container modal-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 className="modal-title">
              <Layers size={20} />
              <span>Chamados Vinculados — {incident.incidente || incident.numero}</span>
            </h3>
            <span className="badge-major">
              {tickets.length} {tickets.length === 1 ? 'chamado' : 'chamados'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onExportTickets && (
              <button
                type="button"
                className="btn-export"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                onClick={() => onExportTickets(incident, tickets)}
                title="Exportar chamados vinculados para Excel (.xlsx)"
              >
                <FileSpreadsheet size={15} />
                <span>Exportar</span>
              </button>
            )}
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Formulário de Inclusão Rápida */}
          <form onSubmit={handleAdd} className="form-row" style={{ alignItems: 'flex-end', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ flex: 2, margin: 0 }}>
              <label className="form-label">Hotel</label>
              <AutocompleteInput
                options={hotels}
                value={hotelQuery}
                onChange={(val) => {
                  setHotelQuery(val);
                  setSelectedHotel(null);
                }}
                onSelect={(h) => {
                  setSelectedHotel(h);
                  setHotelQuery(`${h.rid} - ${h.nome}`);
                }}
                placeholder="Pesquisar hotel por RID ou Nome..."
              />
            </div>

            <div className="form-group" style={{ flex: 1.2, margin: 0 }}>
              <label className="form-label">Número do Chamado</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: INC123456"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !ticketNumber.trim()}
              style={{ height: '38px', padding: '0 1rem' }}
            >
              <Plus size={16} />
              <span>Adicionar</span>
            </button>
          </form>

          {/* Listagem de Chamados Filhos */}
          <div className="table-wrapper" style={{ maxHeight: '320px' }}>
            {tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-faint)' }}>
                Nenhum chamado vinculado a este incidente no momento.
              </div>
            ) : (
              <table className="app-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>RID</th>
                    <th style={{ width: '45%' }}>Hotel</th>
                    <th style={{ width: '25%' }}>Chamado / Ticket</th>
                    <th style={{ width: '15%' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 600 }}>
                        {t.hotel_rid || '-'}
                      </td>
                      <td style={{ textAlign: 'left' }}>
                        {t.hotel_nome || t.hotel_texto || 'Hotel não especificado'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {t.ticket}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-table-action action-delete"
                          onClick={() => onRemoveTicket(t.id)}
                          title="Remover chamado vinculado"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkedTicketsModal;
