import React, { useState, useMemo, useEffect } from 'react';
import { Building2, Search, Plus, Edit2, Trash2, Power, X } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import Pagination from '../common/Pagination.jsx';

const HotelManagement = ({
  hotels = [],
  onCreateHotel,
  onUpdateHotel,
  onDeleteHotel
}) => {
  // Rede selecionada: 'Accor', 'Intercity' ou 'Emiliano'
  const [selectedRede, setSelectedRede] = useState('Accor');
  const [statusFilter, setStatusFilter] = useState('ativos'); // 'ativos', 'inativos', 'ambos'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const accorHotels = useMemo(() => {
    return hotels.filter(h => (h.rede || 'Accor') === 'Accor');
  }, [hotels]);

  const intercityHotels = useMemo(() => {
    return hotels.filter(h => h.rede === 'Intercity');
  }, [hotels]);

  const emilianoHotels = useMemo(() => {
    return hotels.filter(h => h.rede === 'Emiliano');
  }, [hotels]);

  const activeChainHotels = useMemo(() => {
    if (selectedRede === 'Intercity') return intercityHotels;
    if (selectedRede === 'Emiliano') return emilianoHotels;
    return accorHotels;
  }, [selectedRede, accorHotels, intercityHotels, emilianoHotels]);

  // Resetar página quando rede ou filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRede, statusFilter, searchQuery]);

  // Estado do formulário modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [formData, setFormData] = useState({ rid: '', nome: '', ativo: true, rede: 'Accor' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingHotel, setDeletingHotel] = useState(null);

  const filteredHotels = useMemo(() => {
    return activeChainHotels.filter((h) => {
      if (statusFilter === 'ativos' && !h.ativo) return false;
      if (statusFilter === 'inativos' && h.ativo) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const rid = (h.rid || '').toLowerCase();
        const nome = (h.nome || '').toLowerCase();
        return rid.includes(query) || nome.includes(query);
      }
      return true;
    });
  }, [activeChainHotels, statusFilter, searchQuery]);

  const paginatedHotels = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHotels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHotels, currentPage, ITEMS_PER_PAGE]);

  const handleOpenCreate = () => {
    setEditingHotel(null);
    setFormData({ rid: '', nome: '', ativo: true, rede: selectedRede });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h) => {
    setEditingHotel(h);
    setFormData({
      rid: h.rid || '',
      nome: h.nome || '',
      ativo: Boolean(h.ativo),
      rede: h.rede || 'Accor'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        rid: formData.rede !== 'Accor' ? null : (formData.rid ? formData.rid.trim() : null)
      };

      if (editingHotel) {
        await onUpdateHotel(editingHotel.id, payload);
      } else {
        await onCreateHotel(payload);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="hotel-management-module">
      {/* Seletor de redes */}
      <div className="hotel-network-selector">
        <button
          type="button"
          className={`network-tab-btn accor ${selectedRede === 'Accor' ? 'active' : ''}`}
          onClick={() => setSelectedRede('Accor')}
          title="Exibir catálogo de hotéis da Rede Accor"
        >
          <img src="/accor_logo.png" alt="Accor" className="network-logo" />
          <span className="network-name">Accor</span>
          <span className="network-badge">{accorHotels.length}</span>
        </button>

        <button
          type="button"
          className={`network-tab-btn intercity ${selectedRede === 'Intercity' ? 'active' : ''}`}
          onClick={() => setSelectedRede('Intercity')}
          title="Exibir catálogo de hotéis da Rede Intercity"
        >
          <img src="/intercity_logo.png" alt="Intercity" className="network-logo" />
          <span className="network-name">Intercity</span>
          <span className="network-badge">{intercityHotels.length}</span>
        </button>

        <button
          type="button"
          className={`network-tab-btn emiliano ${selectedRede === 'Emiliano' ? 'active' : ''}`}
          onClick={() => setSelectedRede('Emiliano')}
          title="Exibir catálogo de hotéis da Rede Emiliano"
        >
          <img src="/Hotel_Emiliano_Logo.png" alt="Emiliano" className="network-logo emiliano-logo" />
          <span className="network-badge">{emilianoHotels.length}</span>
        </button>
      </div>

      <div className="dashboard-toolbar">
        <div className="dashboard-toolbar-left">
          {/* Filtro de status */}
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${statusFilter === 'ativos' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ativos')}
            >
              Ativos ({activeChainHotels.filter(h => h.ativo).length})
            </button>
            <button
              type="button"
              className={`segmented-btn ${statusFilter === 'inativos' ? 'active' : ''}`}
              onClick={() => setStatusFilter('inativos')}
            >
              Inativos ({activeChainHotels.filter(h => !h.ativo).length})
            </button>
            <button
              type="button"
              className={`segmented-btn ${statusFilter === 'ambos' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ambos')}
            >
              Todos ({activeChainHotels.length})
            </button>
          </div>

          {/* Barra de Pesquisa */}
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={
                selectedRede === 'Accor'
                  ? 'Pesquisar por RID ou Nome na Accor...'
                  : `Pesquisar por Nome na ${selectedRede}...`
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="dashboard-toolbar-right">
          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            <span>Adicionar Hotel</span>
          </button>
        </div>
      </div>

      {/* Tabela de hotéis */}
      <div className="table-wrapper">
        {filteredHotels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
            Nenhum hotel encontrado para a rede {selectedRede}.
          </div>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                {selectedRede === 'Accor' && (
                  <th style={{ width: '120px' }}>RID</th>
                )}
                <th style={{ textAlign: 'left', paddingLeft: '1.5rem' }}>Nome do Hotel</th>
                <th style={{ width: '130px' }}>Status</th>
                <th style={{ width: '110px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHotels.map((h) => (
                <tr key={h.id}>
                  {selectedRede === 'Accor' && (
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 600 }}>
                      {h.rid || '-'}
                    </td>
                  )}
                  <td style={{ textAlign: 'left', paddingLeft: '1.5rem', fontWeight: 500 }}>
                    {h.nome}
                  </td>
                  <td>
                    {h.ativo ? (
                      <span className="badge-active">Ativo</span>
                    ) : (
                      <span className="badge-inactive">Inativo</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions-cell">
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => handleOpenEdit(h)}
                        title="Editar hotel"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        type="button"
                        className="btn-table-action action-delete"
                        onClick={() => setDeletingHotel(h)}
                        title={h.ativo ? 'Inativar/Excluir hotel' : 'Excluir hotel'}
                      >
                        {h.ativo ? <Power size={15} /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="record-count">
        {filteredHotels.length === activeChainHotels.length
          ? `Total: ${activeChainHotels.length} hotéis da rede ${selectedRede} cadastrados.`
          : `Total: ${filteredHotels.length} de ${activeChainHotels.length} hotéis listados da rede ${selectedRede}.`}
      </div>

      {/* Paginação */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredHotels.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* Modal de criação / edição */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-container modal-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3 className="modal-title">
                <Building2 size={20} />
                <span>{editingHotel ? 'Editar Hotel' : 'Novo Hotel'}</span>
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Campo de RID (exclusivo Accor) */}
                {formData.rede === 'Accor' && (
                  <div className="form-group">
                    <label className="form-label">
                      RID <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: 0155"
                      value={formData.rid}
                      onChange={(e) => setFormData(prev => ({ ...prev, rid: e.target.value }))}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Nome do Hotel <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={
                      formData.rede === 'Intercity'
                        ? 'Ex: Intercity Berrini'
                        : formData.rede === 'Emiliano'
                          ? 'Ex: Emiliano SP'
                          : 'Ex: Novotel São Paulo Morumbi'
                    }
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="checkbox-container">
                    <div
                      className={`checkbox-custom ${formData.ativo ? 'checked' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, ativo: !prev.ativo }))}
                    >
                      {formData.ativo && '✓'}
                    </div>
                    <span>Hotel Ativo</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Hotel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo de confirmação */}
      <ConfirmDialog
        isOpen={Boolean(deletingHotel)}
        title="Inativar ou Excluir Hotel"
        message={`Deseja inativar ou excluir o hotel "${deletingHotel?.nome}" (${deletingHotel?.rede || 'Accor'})?`}
        subtext="Se houver incidentes ou chamados associados a este hotel, ele será inativado para proteger o histórico operacional."
        confirmLabel="Confirmar"
        confirmVariant="danger"
        onConfirm={async () => {
          if (onDeleteHotel && deletingHotel) {
            await onDeleteHotel(deletingHotel.id);
          }
          setDeletingHotel(null);
        }}
        onCancel={() => setDeletingHotel(null)}
      />
    </div>
  );
};

export default HotelManagement;
