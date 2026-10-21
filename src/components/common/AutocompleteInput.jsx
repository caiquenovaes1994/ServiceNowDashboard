import React, { useState, useRef, useEffect } from 'react';

const AutocompleteInput = ({
  options = [],
  value = '',
  onChange,
  onSelect,
  placeholder = 'Digite para pesquisar...',
  displayKey = 'nome',
  secondaryKey = 'rid',
  idKey = 'id',
  disabled = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      setFilteredOptions(options.slice(0, 10));
    } else {
      const search = value.toLowerCase().trim();
      const filtered = options.filter(item => {
        const text = (item[displayKey] || '').toLowerCase();
        const sec = secondaryKey && item[secondaryKey] ? item[secondaryKey].toLowerCase() : '';
        return text.includes(search) || sec.includes(search);
      }).slice(0, 10);
      setFilteredOptions(filtered);
    }
  }, [value, options, displayKey, secondaryKey]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
    } else if (onChange) {
      onChange(item[displayKey]);
    }
    setIsOpen(false);
  };

  return (
    <div className="autocomplete-container" ref={containerRef}>
      <input
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        disabled={disabled}
        required={required}
        autoComplete="off"
      />

      {isOpen && filteredOptions.length > 0 && (
        <div className="autocomplete-list">
          {filteredOptions.map((item) => (
            <div
              key={item[idKey] || item[displayKey]}
              className="autocomplete-item"
              onMouseDown={() => handleSelect(item)}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', width: '100%', overflow: 'hidden' }}>
                {secondaryKey && item[secondaryKey] && (
                  <span className="badge-rid">{item[secondaryKey]}</span>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item[displayKey]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
