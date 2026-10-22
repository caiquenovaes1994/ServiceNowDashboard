import React from 'react';
import { BarChart3, AlertOctagon } from 'lucide-react';

// eslint-disable-next-line react-refresh/only-export-components
export const TABS = {
  METRICS: 'metrics',
  INCIDENTS: 'incidents',
  HOTELS: 'hotels',
  RESPONSIBLES: 'responsibles'
};

const NavigationTabs = ({ 
  activeTab, 
  onTabChange, 
  openIncidentsCount = 0,
  hasStaleIncidents = false 
}) => {
  return (
    <div className="nav-tabs-center-container">
      <nav className="nav-tabs-wrapper" aria-label="Navegação Principal">
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === TABS.METRICS ? 'active' : ''}`}
          onClick={() => onTabChange(TABS.METRICS)}
        >
          <BarChart3 size={18} />
          <span>Métricas & KPIs</span>
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeTab === TABS.INCIDENTS ? 'active' : ''}`}
          onClick={() => onTabChange(TABS.INCIDENTS)}
        >
          <AlertOctagon size={18} />
          <span className={hasStaleIncidents ? 'tab-text-stale-pulse' : ''}>
            Incidentes
          </span>
          {openIncidentsCount > 0 && (
            <span className={`nav-tab-badge badge-alert ${hasStaleIncidents ? 'badge-stale-pulse' : ''}`}>
              {openIncidentsCount}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
};

export default NavigationTabs;
