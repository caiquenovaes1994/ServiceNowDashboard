import React, { useState, useRef, useEffect } from 'react';
import { Settings, Building2, Users } from 'lucide-react';
import { TABS } from './NavigationTabs.jsx';

const SettingsDropdown = ({ activeTab, onSelectTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const isSettingsActive = activeTab === TABS.HOTELS || activeTab === TABS.RESPONSIBLES;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (tab) => {
    onSelectTab(tab);
    setIsOpen(false);
  };

  return (
    <div className="settings-menu-container" ref={containerRef}>
      <button
        type="button"
        className={`settings-icon-btn ${isSettingsActive ? 'is-active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Configurações e Cadastros"
        title="Configurações e Cadastros"
      >
        <Settings size={20} className={isOpen ? 'spin-slow' : ''} />
      </button>

      {isOpen && (
        <div className="settings-menu-dropdown">
          <div className="settings-menu-header">Cadastros Base</div>
          
          <button
            type="button"
            className={`settings-menu-item ${activeTab === TABS.HOTELS ? 'selected' : ''}`}
            onClick={() => handleSelect(TABS.HOTELS)}
          >
            <Building2 size={16} />
            <span>Hotéis</span>
          </button>

          <button
            type="button"
            className={`settings-menu-item ${activeTab === TABS.RESPONSIBLES ? 'selected' : ''}`}
            onClick={() => handleSelect(TABS.RESPONSIBLES)}
          >
            <Users size={16} />
            <span>Responsáveis</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsDropdown;
