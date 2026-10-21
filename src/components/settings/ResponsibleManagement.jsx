import React, { useState, useMemo, useEffect } from 'react';
import { Users, Search, Plus, Edit2, Trash2, Power, X } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import Pagination from '../common/Pagination.jsx';

const ResponsibleManagement = ({
  responsibles = [],
  onCreateResponsible,
  onUpdateResponsible,
  onDeleteResponsible
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
  const [editingResp, setEditingResp] = useState(null);
  const [formData, setFormData] = useState({ nome: '', equipe: '', ativo: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Diálogo de confirmação
  const [deletingResp, setDeletingResp] = useState(null);

  const filteredResponsibles = useMemo(() => {
    return responsibles.filter((r) => {
      if (statusFilter === 'ativos' && !r.ativo) return false;
      if (statusFilter === 'inativos' && r.ativo) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nome = (r.nome || '').toLowerCase();
        const equipe = (r.equipe || '').toLowerCase();
        return nome.includes(query) || equipe.includes(query);
      }
      return true;
    });
  }, [responsibles, statusFilter, searchQuery]);

  const paginatedResponsibles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResponsibles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResponsibles, currentPage, ITEMS_PER_PAGE]);

  const handleOpenCreate = () => {
    setEditingResp(null);
    setFormData({ nome: '', equipe: '', ativo: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r) => {
    setEditingResp(r);
    setFormData({ nome: r.nome || '', equipe: r.equipe || '', ativo: Boolean(r.ativo) });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingResp) {
        await onUpdateResponsible(editingResp.id, formData);
      } else {
        await onCreateResponsible(formData);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="responsible-management-module">
      <div className="dashboard-toolbar">
        <div className="dashboard-toolbar-left">
          {/* Segmented Control */}
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${statusFilter === 'ativos' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ativos')}
            >
              Ativos ({responsibles.filter(r => r.ativo).length})
            </button>
            <button
              type="button"
              className={`segmented-btn ${statusFilter === 'inativos' ? 'active' : ''}`}
              onClick={() => setStatusFilter('inativos')}
            >
              Inativos ({responsibles.filter(r => !r.ativo).length})
            </button>
            <button
              type="button"
              className={`segmented-btn ${statusFilter === 'ambos' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ambos')}
            >
              Todos ({responsibles.length})
            </button>
          </div>

          {/* Barra de Pesquisa */}
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Pesquisar por nome ou equipe..."
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
            <span>Adicionar Responsável</span>
          </button>
        </div>
      </div>

      {/* Tabela de Responsáveis */}
      <div className="table-wrapper">
        {filteredResponsibles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
            Nenhum responsável encontrado.
          </div>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingLeft: '1.5rem', width: '45%' }}>Nome do Responsável</th>
                <th style={{ textAlign: 'left', width: '30%' }}>Equipe / Setor</th>
                <th style={{ width: '130px' }}>Status</th>
                <th style={{ width: '110px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResponsibles.map((r) => (
                <tr key={r.id}>
                  <td style={{ textAlign: 'left', paddingLeft: '1.5rem', fontWeight: 600 }}>
                    {r.nome}
                  </td>
                  <td style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                    {r.equipe || 'Geral'}
                  </td>
                  <td>
                    {r.ativo ? (
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
                        onClick={() => handleOpenEdit(r)}
                        title="Editar responsável"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        type="button"
                        className="btn-table-action action-delete"
                        onClick={() => setDeletingResp(r)}
                        title={r.ativo ? 'Inativar responsável' : 'Excluir responsável'}
                      >
                        {r.ativo ? <Power size={15} /> : <Trash2 size={15} />}
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
        {filteredResponsibles.length === responsibles.length
          ? `Total: ${responsibles.length} responsáveis cadastrados.`
          : `Total: ${filteredResponsibles.length} de ${responsibles.length} responsáveis listados.`}
      </div>

      {/* Paginação Inteligente */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredResponsibles.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* Modal de Criação / Edição de Responsável */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-container modal-sm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3 className="modal-title">
                <Users size={20} />
                <span>{editingResp ? 'Editar Responsável' : 'Novo Responsável'}</span>
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
                  <label className="form-label">Nome Completo (Obrigatório)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Caique Novaes"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Equipe / Setor (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Suporte N2, Redes, etc."
                    value={formData.equipe}
                    onChange={(e) => setFormData(prev => ({ ...prev, equipe: e.target.value }))}
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
                    <span>Responsável Ativo</span>
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
                  {isSubmitting ? 'Salvando...' : 'Salvar Responsável'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmação */}
      <ConfirmDialog
        isOpen={Boolean(deletingResp)}
        title="Inativar ou Excluir Responsável"
        message={`Deseja inativar ou excluir o responsável "${deletingResp?.nome}"?`}
        subtext="Se houver incidentes atribuídos a esta pessoa, o cadastro será inativado para manter o histórico dos chamados."
        confirmLabel="Confirmar"
        confirmVariant="danger"
        onConfirm={async () => {
          if (onDeleteResponsible && deletingResp) {
            await onDeleteResponsible(deletingResp.id);
          }
          setDeletingResp(null);
        }}
        onCancel={() => setDeletingResp(null)}
      />
    </div>
  );
};

export default ResponsibleManagement;
