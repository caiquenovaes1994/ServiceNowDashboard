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
  const [statusFilter, setStatusFilter] = useState('ativos'); // 'ativos', 'inativos', 'ambos'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // Modal de edição / criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [formData, setFormData] = useState({ rid: '', nome: '', ativo: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Diálogo de confirmação
  const [deletingHotel, setDeletingHotel] = useState(null);

  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
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
  }, [hotels, statusFilter, searchQuery]);

  const paginatedHotels = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHotels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHotels, currentPage, ITEMS_PER_PAGE]);

  const handleOpenCreate = () => {
    setEditingHotel(null);
    setFormData({ rid: '', nome: '', ativo: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h) => {
    setEditingHotel(h);
    setFormData({ rid: h.rid || '', nome: h.nome || '', ativo: Boolean(h.ativo) });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingHotel) {
        await onUpdateHotel(editingHotel.id, formData);
      } else {
        await onCreateHotel(formData);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="hotel-management-module">
      <div className="dashboard-toolbar">
        <div className="dashboard-toolbar-left">
          {/* Segmented Control */}
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${statusFilter === 'ativos' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ativos')}
            >
              Ativos ({hotels.filter(h => h.ativo).length})
            </button>
            <button
              type="button"
              className={`segmented-btn ${statusFilter === 'inativos' ? 'active' : ''}`}
              onClick={() => setStatusFilter('inativos')}
            >
              Inativos ({hotels.filter(h => !h.ativo).length})
            </button>
            <button
              type="button"
              className={`segmented-btn ${statusFilter === 'ambos' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ambos')}
            >
              Todos ({hotels.length})
            </button>
          </div>

          {/* Barra de Pesquisa */}
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Pesquisar por RID ou Nome..."
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

      {/* Tabela de Hotéis */}
      <div className="table-wrapper">
        {filteredHotels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
            Nenhum hotel encontrado.
          </div>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>RID</th>
                <th style={{ textAlign: 'left', paddingLeft: '1.5rem' }}>Nome do Hotel</th>
                <th style={{ width: '130px' }}>Status</th>
                <th style={{ width: '110px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHotels.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 600 }}>
                    {h.rid || '-'}
                  </td>
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
        {filteredHotels.length === hotels.length
          ? `Total: ${hotels.length} hotéis cadastrados.`
          : `Total: ${filteredHotels.length} de ${hotels.length} hotéis listados.`}
      </div>

      {/* Paginação Inteligente */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredHotels.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* Modal de Criação / Edição de Hotel */}
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
                <div className="form-group">
                  <label className="form-label">RID (Código do Hotel)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: 0155"
                    value={formData.rid}
                    onChange={(e) => setFormData(prev => ({ ...prev, rid: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nome do Hotel (Obrigatório)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Novotel São Paulo Morumbi"
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

      {/* Diálogo de Confirmação */}
      <ConfirmDialog
        isOpen={Boolean(deletingHotel)}
        title="Inativar ou Excluir Hotel"
        message={`Deseja inativar ou excluir o hotel "${deletingHotel?.nome}"?`}
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
