import React, { useState, useRef, useEffect } from 'react';
import { useClue } from '../../context/ClueContext';
import { useGameState } from '../../context/GameState';
import { t } from '../../i18n';

const CrosswordCell = ({ 
  value = '', 
  onChange, 
  onNavigate,
  isSelected,
  isHighlighted,
  isHovered,
  isBlackCell,
  cellNumber,
  selectedWord,
  onNumberClick,
  row,
  col,
  onClick,
  onMouseEnter,
  onMouseLeave,
  language = 'FR',
  className = ''
  , getClueForNumber, canOpenClueOnHover
  , isTouchDevice
}) => {
  const { state } = useGameState();
  const siteLang = state?.language || 'FR';
  const loc = (k) => t(k, siteLang);
  const { visibleClueId, persistentClueId, openClueHover, closeClueHover, closeClueUser } = useClue();
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState(value);

  // Sync input value with prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Auto-focus when selected
  useEffect(() => {
    if (isSelected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    let finalChar = '';
    if (newValue.length > 0) {
      finalChar = newValue.slice(-1); // Get the last character
      let allowed = false;
      
      if (language === 'AR') {
        // Accept only Arabic letters
        allowed = /[\u0600-\u06FF]/.test(finalChar);
      } else {
        // Accept only French/Latin letters
        allowed = /[A-ZÀ-ÿ]/i.test(finalChar);
        finalChar = finalChar.toUpperCase();
      }
      
      if (allowed) {
        setInputValue(finalChar);
        onChange(finalChar, row, col);
      }
    } else {
      setInputValue('');
      onChange('', row, col);
    }
  };  const handleKeyDown = (e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (inputValue) {
        // Clear current cell
        setInputValue('');
        onChange('', row, col);
      }
      // Navigation is now manual only through buttons
      return;
    }

    // Handle arrow key navigation (manual navigation, doesn't change auto-direction)
    if (e.key === 'ArrowLeft' && onNavigate) {
      e.preventDefault();
      onNavigate('left', row, col);
    } else if (e.key === 'ArrowRight' && onNavigate) {
      e.preventDefault();
      onNavigate('right', row, col);
    } else if (e.key === 'ArrowUp' && onNavigate) {
      e.preventDefault();
      onNavigate('up', row, col);
    } else if (e.key === 'ArrowDown' && onNavigate) {
      e.preventDefault();
      onNavigate('down', row, col);
    }

    // For letter keys and help symbols, let the input handle it
    if (e.key.length === 1 && (
      ['*', '#', '!', '@', '.'].includes(e.key) || 
      (language === 'AR' && /[\u0600-\u06FF]/.test(e.key)) || 
      (language !== 'AR' && e.key.match(/[A-ZÀ-ÿ]/i))
    )) {
      // Clear current content to allow new character
      setInputValue('');
    }
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(row, col);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      // Take only the last alphabetic character from pasted text, using language-aware regex
      const letters = language === 'AR' ? pastedText.match(/[\u0600-\u06FF]/g) : pastedText.match(/[A-ZÀ-ÿ]/gi);
      if (letters && letters.length > 0) {
        const raw = letters[letters.length - 1];
        const lastLetter = language === 'AR' ? raw : raw.toUpperCase();
        setInputValue(lastLetter);
        onChange(lastLetter, row, col);
        
        if (onNavigate) {
          setTimeout(() => {
            onNavigate(language === 'AR' ? 'left' : 'right', row, col);
          }, 50); // Adjust navigation based on language
        }
      }
    }
  };

  if (isBlackCell) {
    return (
      <div 
        className={`crossword-cell crossword-cell-black ${className}`}
      />
    );
  }

  const isStartingCellOfSelectedWord = !!(selectedWord && selectedWord.startRow === row && selectedWord.startCol === col);

  return (
    <div 
      className={`crossword-cell relative border transition-all duration-150 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} ${isHovered ? 'bg-gray-50' : 'bg-white'} ${className}`}
      /* Do not attach click on whole cell to avoid toggling clue when typing */
      onMouseEnter={() => onMouseEnter && onMouseEnter(row, col)}
      onMouseLeave={() => onMouseLeave && onMouseLeave()}
    >
      {/* Number button: clicking this toggles the clue. It's separate from the input area. */}
      {cellNumber && (
        <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (typeof onNumberClick === 'function') onNumberClick(row, col);
          }}
          onMouseEnter={(e) => {
            e.stopPropagation();
            if (isTouchDevice) return;
            const canOpen = typeof canOpenClueOnHover === 'function' ? (canOpenClueOnHover() || (typeof window !== 'undefined' && window.__DEBUG_SHOW_HOVER)) : true;
            // eslint-disable-next-line no-console
            console.debug('[ClueHover] cell hover', { row, col, canOpen });
            if (!canOpen) return;
            const clueText = getClueForNumber ? getClueForNumber(row, col) : '';
            if (!clueText) return;
            const id = `cell-${row}-${col}`;
            openClueHover(id);
          }}
          className={`absolute top-0 left-0 text-xs leading-none p-0.5 text-gray-600 font-medium w-5 h-5 flex items-center justify-center rounded ${isTouchDevice ? 'border border-blue-400 bg-white hover:bg-blue-50' : 'border border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors'}`}
        >
          {cellNumber}
        </button>
        {/* inline clue for this cell number */}
        {visibleClueId === `cell-${row}-${col}` && (
          <div data-visible="true" className={`floating-clue ${language === 'AR' ? 'rtl' : ''}`} dir={language === 'AR' ? 'rtl' : 'ltr'} style={{ top: 'calc(100% + 6px)', left: '0' }} onClick={(e) => e.stopPropagation()} onMouseEnter={(e) => e.stopPropagation()} onMouseLeave={(e) => e.stopPropagation()} onMouseOver={(e) => e.stopPropagation()} onFocus={(e) => e.stopPropagation()} onBlur={(e) => e.stopPropagation()}>
            <button className="clue-close" onClick={() => {
              const id = `cell-${row}-${col}`;
              if (persistentClueId === id) closeClueUser({ force: true }); else closeClueHover();
            }} aria-label={loc('close')} title={loc('close')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
            </button>
            <div className={`clue-body ${language === 'AR' ? 'font-arabic' : ''}`}>{getClueForNumber ? getClueForNumber(row, col) : ''}</div>
          </div>
        )}
        </>
      )}

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        maxLength={1}
        className={`
          w-full h-full 
          text-center font-bold crossword-input
          bg-transparent border-0 outline-0
          ${cellNumber ? 'pt-1' : 'pt-0'}
          focus:ring-0 focus:outline-none
          ${isSelected ? 'text-blue-700' : 'text-black'}
        `}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck="false"
      />
    </div>
  );
};

export default CrosswordCell;
