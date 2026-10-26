import React, { useState, useEffect } from 'react';
import { AlertOctagon, Flame, X, Plus, Trash2 } from 'lucide-react';
import AutocompleteInput from '../common/AutocompleteInput.jsx';

const IncidentModal = ({
  isOpen,
  incident = null,
  hotels = [],
  responsibles = [],
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    caso: '',
    incidente: '',
    id_hotel: null,
    hotel_nome: '',
    problema: '',
    id_responsavel: null,
    responsavel_nome: '',
    ticket: '',
    situacao: '',
    status: 'Aberto',
    link: '',
    is_major: false,
    chamados: []
  });

  const [novoFilhoHotel, setNovoFilhoHotel] = useState(null);
  const [novoFilhoHotelQuery, setNovoFilhoHotelQuery] = useState('');
  const [novoFilhoTicket, setNovoFilhoTicket] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (incident) {
      setFormData({
        caso: incident.caso || '',
        incidente: incident.incidente || '',
        id_hotel: incident.id_hotel || null,
        hotel_nome: incident.hotel_nome || '',
        problema: incident.problema || '',
        id_responsavel: incident.id_responsavel || null,
        responsavel_nome: incident.responsavel_nome || '',
        ticket: incident.ticket || '',
        situacao: incident.situacao || '',
        status: incident.status || 'Aberto',
        link: incident.link || '',
        is_major: Boolean(incident.is_major),
        chamados: []
      });
    } else {
      setFormData({
        caso: '',
        incidente: '',
        id_hotel: null,
        hotel_nome: '',
        problema: '',
        id_responsavel: null,
        responsavel_nome: '',
        ticket: '',
        situacao: '',
        status: 'Aberto',
        link: '',
        is_major: false,
        chamados: []
      });
    }
    setNovoFilhoHotel(null);
    setNovoFilhoHotelQuery('');
    setNovoFilhoTicket('');
  }, [incident, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.incidente.trim() ||
      !formData.responsavel_nome?.trim() ||
      !formData.situacao?.trim() ||
      !formData.problema?.trim()
    ) {
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        id: incident ? incident.id : undefined
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFilhoLocal = () => {
    if (!novoFilhoTicket.trim()) return;
    setFormData(prev => ({
      ...prev,
      chamados: [
        ...prev.chamados,
        {
          id_hotel: novoFilhoHotel?.id || null,
          hotel_texto: novoFilhoHotel ? `${novoFilhoHotel.rid} - ${novoFilhoHotel.nome}` : novoFilhoHotelQuery,
          ticket: novoFilhoTicket.trim()
        }
      ]
    }));
    setNovoFilhoHotel(null);
    setNovoFilhoHotelQuery('');
    setNovoFilhoTicket('');
  };

  const handleRemoveFilhoLocal = (index) => {
    setFormData(prev => ({
      ...prev,
      chamados: prev.chamados.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-container modal-lg"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {formData.is_major ? <Flame size={20} color="var(--error)" /> : <AlertOctagon size={20} />}
            <span>{incident ? 'Editar Incidente' : 'Novo Incidente'}</span>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body">
            {/* Opção Major Incident */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <label className="checkbox-container">
                <div
                  className={`checkbox-custom ${formData.is_major ? 'checked' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, is_major: !prev.is_major }))}
                >
                  {formData.is_major && '✓'}
                </div>
                <span style={{ fontWeight: 700, color: formData.is_major ? 'var(--error)' : 'var(--text-main)' }}>
                  Major Incident
                </span>
              </label>
            </div>

            {/* Linha 1: Caso & Incidente */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Caso</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: CS12345678"
                  value={formData.caso}
                  onChange={(e) => setFormData(prev => ({ ...prev, caso: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Incidente <span className="required-star" title="campo obrigatório">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: INC12345678"
                  value={formData.incidente}
                  onChange={(e) => setFormData(prev => ({ ...prev, incidente: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Linha 2: Responsável & Situação Atual */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Responsável <span className="required-star" title="campo obrigatório">*</span>
                </label>
                <AutocompleteInput
                  options={responsibles}
                  value={formData.responsavel_nome}
                  onChange={(val) => setFormData(prev => ({ ...prev, responsavel_nome: val, id_responsavel: null }))}
                  onSelect={(r) => setFormData(prev => ({ ...prev, responsavel_nome: r.nome, id_responsavel: r.id }))}
                  placeholder="Selecione o responsável..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Situação Atual <span className="required-star" title="campo obrigatório">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Investigação com equipe de redes, aguardando fornecedor..."
                  value={formData.situacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, situacao: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Linha 4: Descrição do Problema */}
            <div className="form-group">
              <label className="form-label">
                Problema / Descrição <span className="required-star" title="campo obrigatório">*</span>
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Breve descrição do problema ou falha..."
                value={formData.problema}
                onChange={(e) => setFormData(prev => ({ ...prev, problema: e.target.value }))}
                required
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--card-border)', margin: '1.25rem 0' }} />

            {/* Campos de Incidente Regular */}
            {!formData.is_major && (
              <div>
                <div className="form-group">
                  <label className="form-label">Hotel</label>
                  <AutocompleteInput
                    options={hotels}
                    value={formData.hotel_nome}
                    onChange={(val) => setFormData(prev => ({ ...prev, hotel_nome: val, id_hotel: null }))}
                    onSelect={(h) => setFormData(prev => ({ ...prev, hotel_nome: `${h.rid} - ${h.nome}`, id_hotel: h.id }))}
                    placeholder="Selecione o hotel..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Ticket</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Número do Ticket"
                      value={formData.ticket}
                      onChange={(e) => setFormData(prev => ({ ...prev, ticket: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Link do Ticket (URL)</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://exemplo.service-now.com/..."
                      value={formData.link}
                      onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Campos de Major Incident */}
            {formData.is_major && (
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Ticket Master</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Número do Ticket Master"
                      value={formData.ticket}
                      onChange={(e) => setFormData(prev => ({ ...prev, ticket: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Link do Ticket Master</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://exemplo.service-now.com/..."
                      value={formData.link}
                      onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                    />
                  </div>
                </div>

                {!incident && (
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-white)', margin: '1rem 0 0.5rem 0' }}>
                      Vincular Chamados Filhos Iniciais (Opcional)
                    </h4>
                    <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                      <div className="form-group" style={{ flex: 2, margin: 0 }}>
                        <AutocompleteInput
                          options={hotels}
                          value={novoFilhoHotelQuery}
                          onChange={(val) => {
                            setNovoFilhoHotelQuery(val);
                            setNovoFilhoHotel(null);
                          }}
                          onSelect={(h) => {
                            setNovoFilhoHotel(h);
                            setNovoFilhoHotelQuery(`${h.rid} - ${h.nome}`);
                          }}
                          placeholder="Buscar hotel..."
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1.2, margin: 0 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Chamado"
                          value={novoFilhoTicket}
                          onChange={(e) => setNovoFilhoTicket(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleAddFilhoLocal}
                        style={{ height: '38px', padding: '0 0.75rem' }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {formData.chamados.length > 0 && (
                      <div className="table-wrapper" style={{ maxHeight: '150px' }}>
                        <table className="app-table">
                          <thead>
                            <tr>
                              <th>Hotel</th>
                              <th>Chamado</th>
                              <th>Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.chamados.map((c, idx) => (
                              <tr key={idx}>
                                <td>{c.hotel_texto || '-'}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>{c.ticket}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn-table-action action-delete"
                                    onClick={() => handleRemoveFilhoLocal(idx)}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : incident ? 'Salvar Alterações' : 'Criar Incidente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentModal;
