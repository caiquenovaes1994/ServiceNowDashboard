import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Plus, FileSpreadsheet, History, Edit2, Trash2, 
  Layers, GripVertical, Flame, X,
  Building2, Users, ChevronLeft, ChevronRight, RotateCw,
  CheckCircle2, RotateCcw
} from 'lucide-react';
import MajorIncidentBanner from './MajorIncidentBanner.jsx';
import IncidentModal from './IncidentModal.jsx';
import SituationHistoryModal from './SituationHistoryModal.jsx';
import LinkedTicketsModal from './LinkedTicketsModal.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import Pagination from '../common/Pagination.jsx';
import { parseDateToTimestamp, isIncidentStale, compareAlphanumeric } from '../../utils/incidentUtils.js';

const IncidentList = ({
  incidents = [],
  majorRecords = [],
  hotels = [],
  responsibles = [],
  activeSubTab = 'Aberto',
  onSubTabChange,
  onCreateIncident,
  onUpdateIncident,
  onDeleteIncident,
  onReorderIncidents,
  onToggleMajorResponsibility,
  onFetchHistory,
  onFetchChamados,
  onAddChamado,
  onRemoveChamado
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResponsible, setFilterResponsible] = useState('Todos');
  const [filterHotel, setFilterHotel] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Ref para o Search Box animado
  const searchInputRef = useRef(null);

  // Estados de Drag & Drop para reorganização
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragHandleRowId, setDragHandleRowId] = useState(null);

  // Garante que o estado de arrasto seja resetado ao soltar o mouse
  useEffect(() => {
    const handleGlobalMouseUp = () => setDragHandleRowId(null);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);

  const [historyModalIncident, setHistoryModalIncident] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  const [linkedModalIncident, setLinkedModalIncident] = useState(null);
  const [linkedTickets, setLinkedTickets] = useState([]);

  const [deletingIncidentId, setDeletingIncidentId] = useState(null);
  const [updatingTimestampId, setUpdatingTimestampId] = useState(null);
  const [statusChangingId, setStatusChangingId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Marcar chamado como Resolvido
  const handleResolveIncident = async (e, item) => {
    e.stopPropagation();
    if (!onUpdateIncident) return;
    try {
      setStatusChangingId(item.id);
      await onUpdateIncident(item.id, {
        ...item,
        status: 'Resolvido'
      });
    } catch (err) {
      console.error('Erro ao marcar incidente como resolvido:', err);
    } finally {
      setStatusChangingId(null);
    }
  };

  // Reabrir chamado (retornar para Aberto)
  const handleReopenIncident = async (e, item) => {
    e.stopPropagation();
    if (!onUpdateIncident) return;
    try {
      setStatusChangingId(item.id);
      await onUpdateIncident(item.id, {
        ...item,
        status: 'Aberto'
      });
    } catch (err) {
      console.error('Erro ao reabrir incidente:', err);
    } finally {
      setStatusChangingId(null);
    }
  };

  // Exportação para Excel (.xlsx) da listagem atual
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const { exportarIncidentesXLSX } = await import('../../utils/excelExport.js');
      await exportarIncidentesXLSX({
        incidents: filteredIncidents,
        activeSubTab,
        filterHotel,
        filterResponsible,
        onFetchChamados
      });
    } catch (err) {
      console.error('Erro ao exportar incidentes para Excel:', err);
      alert('Erro ao exportar incidentes: ' + (err.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  // Apenas atualiza a data/hora de última atualização para o momento atual
  const handleRefreshTimestamp = async (e, item) => {
    e.stopPropagation();
    if (!onUpdateIncident) return;
    try {
      setUpdatingTimestampId(item.id);
      await onUpdateIncident(item.id, {
        ...item,
        forcar_historico: true
      });
    } catch (err) {
      console.error('Erro ao atualizar horário da última atualização:', err);
    } finally {
      setUpdatingTimestampId(null);
    }
  };

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubTab, filterResponsible, filterHotel, searchQuery]);

  // Filtra incidentes conforme busca e filtros selecionados
  const filteredIncidents = useMemo(() => {
    const list = incidents.filter((item) => {
      // 1. Filtro da sub-aba (Aberto vs Resolvido)
      if (activeSubTab === 'Aberto') {
        if (item.status === 'Resolvido') return false;
      } else if (activeSubTab === 'Resolvido') {
        if (item.status !== 'Resolvido') return false;
      }

      // 2. Filtro de Responsável
      if (filterResponsible !== 'Todos') {
        if (item.responsavel_nome !== filterResponsible) return false;
      }

      // 3. Filtro de Hotel
      if (filterHotel !== 'Todos') {
        if (item.hotel_nome !== filterHotel) return false;
      }

      // 4. Busca textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const caso = (item.caso || '').toLowerCase();
        const inc = (item.incidente || '').toLowerCase();
        const hotel = (item.hotel_nome || '').toLowerCase();
        const rid = (item.hotel_rid || '').toLowerCase();
        const resp = (item.responsavel_nome || '').toLowerCase();
        const prob = (item.problema || '').toLowerCase();
        const sit = (item.situacao || '').toLowerCase();
        const ticket = (item.ticket || '').toLowerCase();

        return caso.includes(query) || inc.includes(query) || hotel.includes(query) ||
               rid.includes(query) || resp.includes(query) || prob.includes(query) ||
               sit.includes(query) || ticket.includes(query);
      }

      return true;
    });

    // Se estiver na aba de Resolvidos, ordenar por data de resolução/atualização (mais recente primeiro)
    if (activeSubTab === 'Resolvido') {
      return [...list].sort((a, b) => {
        const timeA = parseDateToTimestamp(a.ultima_atualizacao);
        const timeB = parseDateToTimestamp(b.ultima_atualizacao);
        if (timeB !== timeA) {
          return timeB - timeA; // Mais novo primeiro
        }
        return (b.id || 0) - (a.id || 0); // Desempate por ID decrescente
      });
    }

    return list;
  }, [incidents, activeSubTab, filterResponsible, filterHotel, searchQuery]);

  // Paginação
  const paginatedIncidents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredIncidents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredIncidents, currentPage, ITEMS_PER_PAGE]);

  // Incidentes da sub-aba atual para alimentar as estatísticas
  const currentSubTabIncidents = useMemo(() => {
    return incidents.filter((item) => {
      if (activeSubTab === 'Aberto') return item.status !== 'Resolvido';
      if (activeSubTab === 'Resolvido') return item.status === 'Resolvido';
      return true;
    });
  }, [incidents, activeSubTab]);

  // Estatísticas: Incidentes por Hotel
  const hotelStats = useMemo(() => {
    const map = {};
    currentSubTabIncidents.forEach((inc) => {
      const name = inc.hotel_nome || 'Não definido';
      const rid = inc.hotel_rid || '';
      const key = `${rid}|${name}`;
      if (!map[key]) {
        map[key] = { rid, name, count: 0 };
      }
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const labelA = a.rid ? `${a.rid} ${a.name}` : a.name;
      const labelB = b.rid ? `${b.rid} ${b.name}` : b.name;
      return compareAlphanumeric(labelA, labelB);
    });
  }, [currentSubTabIncidents]);

  // Estatísticas: Incidentes por Responsável
  const responsibleStats = useMemo(() => {
    const map = {};
    currentSubTabIncidents.forEach((inc) => {
      const name = inc.responsavel_nome || 'Não atribuído';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || compareAlphanumeric(a.name, b.name));
  }, [currentSubTabIncidents]);

  // Alterna filtro ao clicar nas estatísticas
  const handleToggleHotelFilter = (hotelName) => {
    if (filterHotel === hotelName) {
      setFilterHotel('Todos');
    } else {
      setFilterHotel(hotelName);
    }
  };

  const handleToggleResponsibleFilter = (respName) => {
    if (filterResponsible === respName) {
      setFilterResponsible('Todos');
    } else {
      setFilterResponsible(respName);
    }
  };

  // Abertura de Histórico
  const handleOpenHistory = async (item) => {
    setHistoryModalIncident(item);
    if (onFetchHistory) {
      const data = await onFetchHistory(item.id);
      setHistoryData(data || []);
    }
  };

  // Abertura de Chamados Vinculados
  const handleOpenLinkedTickets = async (item) => {
    setLinkedModalIncident(item);
    if (onFetchChamados) {
      const tickets = await onFetchChamados(item.id);
      setLinkedTickets(tickets || []);
    }
  };

  // Handlers de Drag & Drop (HTML5 nativo suave)
  const handleDragStart = (e, index) => {
    if (activeSubTab !== 'Aberto') return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    if (activeSubTab !== 'Aberto') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    setDragHandleRowId(null);
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const fromGlobal = (currentPage - 1) * ITEMS_PER_PAGE + draggedIndex;
    const toGlobal = (currentPage - 1) * ITEMS_PER_PAGE + targetIndex;

    const newOrder = [...filteredIncidents];
    const [movedItem] = newOrder.splice(fromGlobal, 1);
    newOrder.splice(toGlobal, 0, movedItem);

    setDraggedIndex(null);
    setDragOverIndex(null);

    if (onReorderIncidents) {
      await onReorderIncidents(newOrder.map(i => i.id));
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragHandleRowId(null);
  };

  return (
    <div className="incidents-module">
      {/* Banner de Major Incidents Ativos */}
      <MajorIncidentBanner
        majors={majorRecords}
        onToggleResponsibility={onToggleMajorResponsibility}
        onOpenLinkedTickets={handleOpenLinkedTickets}
      />

      {/* Toolbar Principal com Sub-abas e Filtros */}
      <div className="dashboard-toolbar">
        <div className="dashboard-toolbar-left">
          {/* Sub-abas Abertos / Resolvidos */}
          <div className="subtabs-container">
            <button
              type="button"
              className={`subtab-btn subtab-danger ${activeSubTab === 'Aberto' ? 'active' : ''}`}
              onClick={() => onSubTabChange('Aberto')}
            >
              Abertos ({incidents.filter(i => i.status !== 'Resolvido').length})
            </button>
            <button
              type="button"
              className={`subtab-btn subtab-success ${activeSubTab === 'Resolvido' ? 'active' : ''}`}
              onClick={() => onSubTabChange('Resolvido')}
            >
              Resolvidos ({incidents.filter(i => i.status === 'Resolvido').length})
            </button>
          </div>

          {/* Filtro por Responsável */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '160px', height: '40px', padding: '0 0.75rem' }}
            value={filterResponsible}
            onChange={(e) => setFilterResponsible(e.target.value)}
          >
            <option value="Todos">Todos</option>
            {responsibles.filter(r => r.ativo).map(r => (
              <option key={r.id} value={r.nome}>{r.nome}</option>
            ))}
          </select>

          {/* Animated Search Box (Inspirado no Search_Box) */}
          <div className={`animated-search-box ${searchQuery ? 'has-content' : ''}`}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Pesquisar incidentes, hotéis, tickets..."
              aria-label="Pesquisar incidentes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                title="Limpar pesquisa"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              className="search-submit-btn"
              onClick={() => searchInputRef.current?.focus()}
              aria-label="Pesquisar"
              title="Pesquisar"
            >
              <Search size={15} />
            </button>
          </div>
        </div>

        <div className="dashboard-toolbar-right">
          <button
            type="button"
            className="btn-export"
            onClick={handleExportExcel}
            disabled={isExporting}
            title="Exportar incidentes da visualização atual para Excel (.xlsx)"
          >
            <FileSpreadsheet size={16} />
            <span>{isExporting ? 'Exportando...' : 'Exportar'}</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditingIncident(null);
              setIsFormModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Novo Incidente</span>
          </button>
        </div>
      </div>

      {/* Tabela de Incidentes */}
      <div className="table-wrapper">
        {filteredIncidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-faint)' }}>
            Nenhum incidente encontrado para os filtros selecionados.
          </div>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th style={{ width: '100px' }}>Caso</th>
                <th style={{ width: '140px' }}>Incidente</th>
                <th style={{ minWidth: '220px' }}>Hotel</th>
                <th style={{ minWidth: '220px' }}>Problema</th>
                <th style={{ minWidth: '150px' }}>Responsável</th>
                <th style={{ width: '120px' }}>Ticket</th>
                <th style={{ minWidth: '240px' }}>Situação</th>
                <th style={{ width: '160px' }}>Atualizado</th>
                <th style={{ width: '90px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIncidents.map((item, idx) => {
                const isMajor = Boolean(item.is_major);
                const isStale = activeSubTab === 'Aberto' && isIncidentStale(item.ultima_atualizacao);

                return (
                  <tr
                    key={item.id}
                    draggable={activeSubTab === 'Aberto' && dragHandleRowId === item.id}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`draggable-row ${isMajor ? 'major-row' : ''} ${isStale ? 'stale-row' : ''} ${draggedIndex === idx ? 'dragging-row' : ''} ${dragOverIndex === idx ? 'dragover-row' : ''}`}
                  >
                    {/* Alça de Arrastar (Drag Handle) */}
                    <td>
                      <div
                        className="drag-handle-container"
                        title={activeSubTab === 'Aberto' ? 'Arrastar para reorganizar' : ''}
                        onMouseDown={() => {
                          if (activeSubTab === 'Aberto') setDragHandleRowId(item.id);
                        }}
                        onMouseUp={() => setDragHandleRowId(null)}
                      >
                        <GripVertical size={15} className="drag-handle" />
                      </div>
                    </td>

                    {/* Caso (Fonte padrão do sistema) */}
                    <td className="cell-selectable" style={{ fontSize: '0.8125rem' }}>
                      {item.caso ? (
                        <span className="selectable-code">{item.caso}</span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Incidente */}
                    <td className="cell-selectable">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        {isMajor && <Flame size={15} color="var(--error)" />}
                        <strong className="selectable-code" style={{ color: isMajor ? 'var(--error)' : 'var(--text-white)' }}>
                          {item.incidente}
                        </strong>
                      </div>
                    </td>

                    {/* Hotel */}
                    <td style={{ textAlign: 'left' }}>
                      {isMajor ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          {item.hotel_nome && item.hotel_nome !== 'Não definido' && (
                            <span>{item.hotel_nome}</span>
                          )}
                          <button
                            type="button"
                            className="btn-linked-cases-badge"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenLinkedTickets(item);
                            }}
                            title="Clique para visualizar e gerenciar chamados vinculados"
                          >
                            <Layers size={13} />
                            <span>
                              {item.total_chamados || 0} {(item.total_chamados || 0) === 1 ? 'caso vinculado' : 'casos'}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                          {item.hotel_rid && <span className="badge-rid">{item.hotel_rid}</span>}
                          <span>{item.hotel_nome || 'Não definido'}</span>
                        </div>
                      )}
                    </td>

                    {/* Problema */}
                    <td style={{ textAlign: 'left' }}>
                      <div className="cell-ellipsis" title={item.problema}>
                        {item.problema || '-'}
                      </div>
                    </td>

                    {/* Responsável */}
                    <td>
                      <span style={{ fontWeight: 600 }}>{item.responsavel_nome || '-'}</span>
                    </td>

                    {/* Ticket */}
                    <td>
                      {item.ticket ? (
                        item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ticket-link"
                            title="Abrir no ServiceNow"
                          >
                            {item.ticket}
                          </a>
                        ) : (
                          <span>{item.ticket}</span>
                        )
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Situação */}
                    <td style={{ textAlign: 'center' }}>
                      <div className="cell-wrap-center" title={item.situacao}>
                        {item.situacao || '-'}
                      </div>
                    </td>

                    {/* Última Atualização */}
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', width: '100%' }}>
                        <span>{item.ultima_atualizacao || '-'}</span>
                        <button
                          type="button"
                          className="btn-refresh-ts"
                          onClick={(e) => handleRefreshTimestamp(e, item)}
                          disabled={updatingTimestampId === item.id}
                          title="Atualizar horário da última atualização para agora"
                        >
                          <RotateCw size={12} className={updatingTimestampId === item.id ? 'spin' : ''} />
                        </button>
                      </div>
                    </td>

                    {/* Ações (Grid 2x2) */}
                    <td>
                      <div className="table-actions-grid">
                        {/* Linha 1, Coluna 1: Botão de Status (Resolver ou Reabrir) */}
                        {item.status === 'Resolvido' ? (
                          <button
                            type="button"
                            className="btn-table-action action-reopen"
                            onClick={(e) => handleReopenIncident(e, item)}
                            disabled={statusChangingId === item.id}
                            title="Reabrir chamado"
                            aria-label="Reabrir chamado"
                          >
                            {statusChangingId === item.id ? (
                              <RotateCw size={13} className="spin" />
                            ) : (
                              <RotateCcw size={14} />
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-table-action action-resolve"
                            onClick={(e) => handleResolveIncident(e, item)}
                            disabled={statusChangingId === item.id}
                            title="Marcar como Resolvido"
                            aria-label="Marcar como Resolvido"
                          >
                            {statusChangingId === item.id ? (
                              <RotateCw size={13} className="spin" />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                          </button>
                        )}

                        {/* Linha 1, Coluna 2: Excluir */}
                        <button
                          type="button"
                          className="btn-table-action action-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingIncidentId(item.id);
                          }}
                          title="Excluir incidente"
                          aria-label="Excluir incidente"
                        >
                          <Trash2 size={14} />
                        </button>

                        {/* Linha 2, Coluna 1: Editar */}
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingIncident(item);
                            setIsFormModalOpen(true);
                          }}
                          title="Editar incidente"
                          aria-label="Editar incidente"
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Linha 2, Coluna 2: Ver Histórico */}
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenHistory(item);
                          }}
                          title="Ver histórico de situações"
                          aria-label="Ver histórico de situações"
                        >
                          <History size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="record-count">
        {filteredIncidents.length === currentSubTabIncidents.length
          ? `Total: ${currentSubTabIncidents.length} registros.`
          : `Total: ${filteredIncidents.length} de ${currentSubTabIncidents.length} registros exibidos.`}
      </div>

      {/* Paginação Inteligente */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredIncidents.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* Estatísticas Agregadas (Incidentes por Hotel & Responsável) */}
      <div className="stats-footer">
        <div className="stats-section">
          <div className="stats-header-title">
            <Building2 size={18} color="var(--primary)" />
            <span>Incidentes por Hotel</span>
          </div>
          <div className="stats-grid">
            {hotelStats.length === 0 ? (
              <div style={{ color: 'var(--text-faint)', fontSize: '0.8rem', padding: '0.5rem' }}>
                Nenhum incidente registrado.
              </div>
            ) : (
              hotelStats.map((item) => {
                const total = currentSubTabIncidents.length || 1;
                const perc = (item.count / total) * 100;
                const isActive = filterHotel === item.name;

                return (
                  <div
                    key={`${item.rid}-${item.name}`}
                    className={`stat-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleToggleHotelFilter(item.name)}
                    title={isActive ? 'Clique para remover o filtro' : `Filtrar por ${item.name}`}
                  >
                    <div className="stat-bar" style={{ width: `${perc}%` }} />
                    <span className="stat-name">
                      {item.rid && <span className="badge-rid">{item.rid}</span>}
                      <span>{item.name}</span>
                    </span>
                    <span className="stat-count">{item.count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="stats-section">
          <div className="stats-header-title">
            <Users size={18} color="var(--primary)" />
            <span>Incidentes por Responsável</span>
          </div>
          <div className="stats-grid">
            {responsibleStats.length === 0 ? (
              <div style={{ color: 'var(--text-faint)', fontSize: '0.8rem', padding: '0.5rem' }}>
                Nenhum incidente registrado.
              </div>
            ) : (
              responsibleStats.map((item) => {
                const total = currentSubTabIncidents.length || 1;
                const perc = (item.count / total) * 100;
                const isActive = filterResponsible === item.name;

                return (
                  <div
                    key={item.name}
                    className={`stat-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleToggleResponsibleFilter(item.name)}
                    title={isActive ? 'Clique para remover o filtro' : `Filtrar por ${item.name}`}
                  >
                    <div className="stat-bar" style={{ width: `${perc}%` }} />
                    <span className="stat-name">
                      <span>{item.name}</span>
                    </span>
                    <span className="stat-count">{item.count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal de Formulário (Criar / Editar) */}
      <IncidentModal
        isOpen={isFormModalOpen}
        incident={editingIncident}
        hotels={hotels}
        responsibles={responsibles}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingIncident(null);
        }}
        onSave={async (data) => {
          if (editingIncident) {
            await onUpdateIncident(editingIncident.id, data);
          } else {
            await onCreateIncident(data);
          }
        }}
      />

      {/* Modal de Histórico de Situação */}
      <SituationHistoryModal
        isOpen={Boolean(historyModalIncident)}
        incident={historyModalIncident}
        history={historyData}
        onClose={() => setHistoryModalIncident(null)}
      />

      {/* Modal de Chamados Vinculados */}
      <LinkedTicketsModal
        isOpen={Boolean(linkedModalIncident)}
        incident={linkedModalIncident}
        tickets={linkedTickets}
        hotels={hotels}
        onClose={() => setLinkedModalIncident(null)}
        onExportTickets={async (incident, tickets) => {
          const { exportarChamadosMajorXLSX } = await import('../../utils/excelExport.js');
          await exportarChamadosMajorXLSX(incident, tickets);
        }}
        onAddTicket={async (ticketData) => {
          if (onAddChamado && linkedModalIncident) {
            await onAddChamado(linkedModalIncident.id, ticketData);
            const updated = await onFetchChamados(linkedModalIncident.id);
            setLinkedTickets(updated || []);
          }
        }}
        onRemoveTicket={async (idChamado) => {
          if (onRemoveChamado && linkedModalIncident) {
            await onRemoveChamado(idChamado);
            const updated = await onFetchChamados(linkedModalIncident.id);
            setLinkedTickets(updated || []);
          }
        }}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={Boolean(deletingIncidentId)}
        title="Excluir Incidente"
        message="Tem certeza que deseja excluir permanentemente este incidente?"
        subtext="O histórico e os chamados vinculados também serão removidos."
        confirmLabel="Sim, Excluir"
        confirmVariant="danger"
        onConfirm={async () => {
          if (onDeleteIncident && deletingIncidentId) {
            await onDeleteIncident(deletingIncidentId);
          }
          setDeletingIncidentId(null);
        }}
        onCancel={() => setDeletingIncidentId(null)}
      />
    </div>
  );
};

export default IncidentList;
