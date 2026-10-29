import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Calendar, Building2, FileText, AlertCircle, Check, Search } from 'lucide-react';

const formatTimeMask = (val) => {
  if (!val) return '';
  const clean = String(val).replace(/\D/g, '');
  if (clean.length === 1) return `0${clean}:00`;
  if (clean.length === 2) return `${clean}:00`;
  if (clean.length === 3) return `0${clean[0]}:${clean.slice(1)}`;
  if (clean.length >= 4) {
    let h = parseInt(clean.slice(0, 2), 10);
    let m = parseInt(clean.slice(2, 4), 10);
    if (h > 23) h = 23;
    if (m > 59) m = 59;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return val;
};

const calculateDurationPreview = (inicio, termino) => {
  if (!inicio || !termino || !inicio.includes(':') || !termino.includes(':')) return null;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = termino.split(':').map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return null;

  let min1 = h1 * 60 + m1;
  let min2 = h2 * 60 + m2;
  const isOvernight = min2 < min1;
  if (isOvernight) min2 += 24 * 60;
  const gross = min2 - min1;

  const h = Math.floor(gross / 60);
  const m = gross % 60;
  return `${h}h ${String(m).padStart(2, '0')}m (${gross} min)${isOvernight ? ' (+1 dia)' : ''}`;
};

const getWeekdayLabel = (dateStr) => {
  if (!dateStr || !dateStr.includes('-')) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return '';
  const dt = new Date(y, m, d, 12, 0, 0);
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return dias[dt.getDay()];
};

const OvertimeRecordModal = ({ isOpen, onClose, onSave, record, isViewOnly = false, hotels = [] }) => {
  const [data, setData] = useState('');
  const [caso, setCaso] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('');
  const [hotelQuery, setHotelQuery] = useState('');
  const [isHotelOpen, setIsHotelOpen] = useState(false);
  const [inicio, setInicio] = useState('');
  const [termino, setTermino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [error, setError] = useState('');

  const hotelWrapperRef = useRef(null);

  useEffect(() => {
    if (record) {
      setData(record.data || '');
      setCaso(record.caso || '');
      const hStr = record.pms && record.hotel ? `${record.pms} - ${record.hotel}` : record.hotel || record.pms || '';
      setSelectedHotel(hStr);
      setHotelQuery(hStr);
      setInicio(record.inicio || '');
      setTermino(record.termino || '');
      setMotivo(record.motivo || '');
      setObservacoes(record.observacoes || '');
    } else {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const today = `${y}-${m}-${d}`;
      setData(today);
      setCaso('');
      setSelectedHotel('');
      setHotelQuery('');
      setInicio('');
      setTermino('');
      setMotivo('');
      setObservacoes('');
    }
    setIsHotelOpen(false);
    setError('');
  }, [record, isOpen]);

  // Fecha o dropdown de hotel ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (hotelWrapperRef.current && !hotelWrapperRef.current.contains(e.target)) {
        setIsHotelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const durationPreview = calculateDurationPreview(inicio, termino);
  const isTerminoOvernight = (() => {
    if (!inicio || !termino || !inicio.includes(':') || !termino.includes(':')) return false;
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = termino.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return false;
    return (h2 * 60 + m2) < (h1 * 60 + m1);
  })();

  const filteredHotels = hotels.filter((h) => {
    const q = (hotelQuery || '').trim().toLowerCase();
    if (!q) return true;
    const nome = (h.nome || '').toLowerCase();
    const rid = (h.rid || '').toLowerCase();
    return nome.includes(q) || rid.includes(q);
  }).slice(0, 25);

  const handleSelectHotel = (h) => {
    const val = h.rid ? `${h.rid} - ${h.nome}` : h.nome;
    setSelectedHotel(val);
    setHotelQuery(val);
    setIsHotelOpen(false);
  };

  const handleHotelChange = (e) => {
    const val = e.target.value;
    setHotelQuery(val);
    setSelectedHotel(val);
    setIsHotelOpen(true);
  };

  const handleClearHotel = () => {
    setHotelQuery('');
    setSelectedHotel('');
    setIsHotelOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!data) {
      setError('A data do atendimento é obrigatória.');
      return;
    }
    if (!inicio || !termino) {
      setError('Os horários de Início e Término são obrigatórios.');
      return;
    }
    if (!motivo.trim()) {
      setError('Por favor, informe o motivo do apontamento.');
      return;
    }

    let pms = '';
    let hotelNome = selectedHotel;
    if (selectedHotel.includes(' - ')) {
      const parts = selectedHotel.split(' - ');
      pms = parts[0].trim();
      hotelNome = parts.slice(1).join(' - ').trim();
    }

    onSave({
      id: record ? record.id : undefined,
      data,
      caso: caso.trim(),
      pms,
      hotel: hotelNome,
      inicio: formatTimeMask(inicio),
      intervalo: '',
      volta: '',
      termino: formatTimeMask(termino),
      motivo: motivo.trim(),
      observacoes: observacoes.trim()
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Clock size={20} style={{ color: '#ff6b6b' }} />
            {record ? (isViewOnly ? 'Visualizar Apontamento' : 'Editar Apontamento') : 'Novo Apontamento de Hora Extra'}
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

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Linha 1: Data + Caso INC */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Data do Atendimento *
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  disabled={isViewOnly}
                  required
                />
                {data && getWeekdayLabel(data) && (
                  <span className="ot-field-hint" style={{ color: '#ff8585', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                    📅 {getWeekdayLabel(data)}
                  </span>
                )}
              </div>

              <div>
                <label className="form-label">Caso / Incidente (INC)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: INC0123456"
                  value={caso}
                  onChange={(e) => setCaso(e.target.value)}
                  disabled={isViewOnly}
                />
              </div>
            </div>

            {/* Linha 2: Hotel com Dropdown Sensível à Escrita (Autocomplete) */}
            <div ref={hotelWrapperRef} className="ot-combobox-wrapper">
              <label className="form-label">
                <Building2 size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Hotel / PMS (digite para filtrar)
              </label>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Digite o nome ou código do hotel..."
                  value={hotelQuery}
                  onChange={handleHotelChange}
                  onFocus={() => !isViewOnly && setIsHotelOpen(true)}
                  disabled={isViewOnly}
                  style={{ paddingRight: hotelQuery && !isViewOnly ? '2.2rem' : '1rem' }}
                />

                {hotelQuery && !isViewOnly && (
                  <button
                    type="button"
                    onClick={handleClearHotel}
                    title="Limpar seleção"
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.2rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Menu dropdown com opções compatíveis */}
              {isHotelOpen && !isViewOnly && (
                <div className="ot-combobox-dropdown">
                  {filteredHotels.length > 0 ? (
                    filteredHotels.map((h) => {
                      const fullVal = h.rid ? `${h.rid} - ${h.nome}` : h.nome;
                      const isSelected = selectedHotel === fullVal;

                      return (
                        <div
                          key={h.id || h.rid || h.nome}
                          className={`ot-combobox-item ${isSelected ? 'active' : ''}`}
                          onMouseDown={() => handleSelectHotel(h)}
                        >
                          <span style={{ fontWeight: isSelected ? 700 : 500 }}>
                            {h.nome}
                          </span>
                          {h.rid && <span className="ot-combobox-rid">{h.rid}</span>}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Nenhum hotel encontrado. <br />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                        O texto digitado será salvo normalmente.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Linha 3: Horários (Apenas Início e Término/Fim) */}
            <div>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Horário do Atendimento (Início e Término) *</span>
                {durationPreview && (
                  <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '0.8rem' }}>
                    ⏱️ Duração: {durationPreview}
                  </span>
                )}
              </label>

              <div className="ot-times-row-2">
                <div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="08:00"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                    onBlur={(e) => setInicio(formatTimeMask(e.target.value))}
                    disabled={isViewOnly}
                    required
                  />
                  <span className="ot-field-hint">Horário de Início *</span>
                </div>

                <div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="18:00"
                    value={termino}
                    onChange={(e) => setTermino(e.target.value)}
                    onBlur={(e) => setTermino(formatTimeMask(e.target.value))}
                    disabled={isViewOnly}
                    required
                  />
                  <span className="ot-field-hint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Horário de Término / Fim *</span>
                    {isTerminoOvernight && (
                      <span style={{ color: '#f87171', fontWeight: 600 }}>+1 dia (pós meia-noite)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Linha 4: Motivo */}
            <div>
              <label className="form-label">
                <FileText size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Motivo do Atendimento *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Atendimento de chamado emergencial de virada de auditoria"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                disabled={isViewOnly}
                required
              />
            </div>

            {/* Linha 5: Observações */}
            <div>
              <label className="form-label">Observações Complementares</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Detalhes adicionais, procedimentos executados, etc."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                disabled={isViewOnly}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {isViewOnly ? 'Fechar' : 'Cancelar'}
            </button>
            {!isViewOnly && (
              <button type="submit" className="btn-wine">
                <Check size={16} />
                <span>Salvar Apontamento</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default OvertimeRecordModal;
