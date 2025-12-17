import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrosswordGame } from '../../hooks/useCrosswordGame';
import CrosswordCell from './CrosswordCell';

const CrosswordGrid = ({ puzzle, onCellSelect, onWordSelect, resetGame: externalResetGame, className = '' }) => {
  const {
    currentGrid,
    selectedCell,
    selectedWord,
    highlightedCells,
    handleKeyInput,
    updateGridCell,
    selectCell,
    selectWord,
    invalidInput,
    language,
    showingSolution,
    getElapsedTime,
    isPaused,
    pauseTimer,
    resumeTimer,
    resetTimer
  } = useCrosswordGame();

  const gridRef = useRef(null);
  const scrollRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [cellRefs, setCellRefs] = useState({});
  const [hoveredCell, setHoveredCell] = useState({ row: -1, col: -1 });
  const [preferredDirection, setPreferredDirection] = useState('right');
  const [activeClueId, setActiveClueId] = useState(null);

  // Centralized close helper (and debug logging)
  const closeActiveClue = useCallback(() => {
    // eslint-disable-next-line no-console
    console.debug('closeActiveClue invoked', { activeClueId, stack: (new Error()).stack });
    setActiveClueId(null);
  }, [activeClueId]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('activeClueId changed ->', activeClueId);
  }, [activeClueId]);

  // Track overflow for horizontal scrolling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prevOverflowRef = { current: isOverflowing };
    let raf = null;
    let scrollTimer = null;
    let userScrolled = false;

    const onUserScroll = () => {
      userScrolled = true;
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => { userScrolled = false; }, 400);
    };

    const check = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const ov = el.scrollWidth > el.clientWidth;
        if (ov !== prevOverflowRef.current) {
          prevOverflowRef.current = ov;
          setIsOverflowing(ov);
          if (ov && !userScrolled) {
            try { el.scrollLeft = 0; } catch (e) { /* ignore */ }
          }
        }
      });
    };

    check();
    el.addEventListener('scroll', onUserScroll, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(check);
      ro.observe(el);
      window.addEventListener('orientationchange', check, { passive: true });
      return () => {
        ro.disconnect();
        el.removeEventListener('scroll', onUserScroll);
        window.removeEventListener('orientationchange', check);
        if (raf) cancelAnimationFrame(raf);
        if (scrollTimer) clearTimeout(scrollTimer);
      };
    }
    window.addEventListener('resize', check, { passive: true });
    return () => {
      window.removeEventListener('resize', check);
      el.removeEventListener('scroll', onUserScroll);
      if (raf) cancelAnimationFrame(raf);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [puzzle, currentGrid]);
  
  // Handle click outside to close clue
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeClueId && gridRef.current && !gridRef.current.contains(event.target)) {
        closeActiveClue();
        selectWord(null);
        onWordSelect?.(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && activeClueId) {
        closeActiveClue();
        selectWord(null);
        onWordSelect?.(null);
      }
    };

    if (activeClueId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeClueId, selectWord, onWordSelect]);

  const handleResetTimer = () => {
    resetTimer();
  };

  const numRows = puzzle?.rows || currentGrid?.length || 15;
  const numCols = puzzle?.cols || (currentGrid?.[0]?.length) || 15;

  // Handle navigation between cells
  const handleCellNavigation = useCallback((direction, currentRow, currentCol) => {
    if (!puzzle) return;
    
    let newRow = currentRow;
    let newCol = currentCol;

    switch (direction) {
      case 'right':
        if (currentCol < numCols - 1) newCol = currentCol + 1;
        break;
      case 'left':
        if (currentCol > 0) newCol = currentCol - 1;
        break;
      case 'up':
        if (currentRow > 0) newRow = currentRow - 1;
        break;
      case 'down':
        if (currentRow < numRows - 1) newRow = currentRow + 1;
        break;
    }

    // Skip black cells
    while (newRow >= 0 && newRow < numRows &&
           newCol >= 0 && newCol < numCols &&
           (puzzle.solution?.[newRow]?.[newCol] === '' || puzzle.solution?.[newRow]?.[newCol] === '#')) {

      switch (direction) {
        case 'right':
          if (newCol < numCols - 1) newCol++;
          else return;
          break;
        case 'left':
          if (newCol > 0) newCol--;
          else return;
          break;
        case 'up':
          if (newRow > 0) newRow--;
          else return;
          break;
        case 'down':
          if (newRow < numRows - 1) newRow++;
          else return;
          break;
      }
    }

    selectCell(newRow, newCol);
  }, [puzzle, selectCell, numRows, numCols]);

  // Handle cell value changes
  const handleCellChange = useCallback((value, row, col) => {
    if (!puzzle || !currentGrid) return;
    
    updateGridCell(row, col, value);
    
    if (value && value.trim() !== '') {
      setTimeout(() => {
        handleCellNavigation(preferredDirection, row, col);
      }, 10);
    }
  }, [puzzle, currentGrid, updateGridCell, preferredDirection, handleCellNavigation]);

  const handleCellClick = (row, col) => {
    if (!puzzle || !currentGrid) return;
    if (puzzle.solution[row][col] === '') return;
    
    selectCell(row, col);
    onCellSelect?.(row, col);
    
    const intersecting = [];
    const rowNumber = row + 1;
    const colNumber = col + 1;
    
    if (puzzle.cluesHorizontal && puzzle.cluesHorizontal[rowNumber]) {
      intersecting.push({
        number: rowNumber,
        clue: puzzle.cluesHorizontal[rowNumber],
        startRow: row,
        startCol: 0,
        length: numCols,
        direction: 'horizontal'
      });
    }
    
    if (puzzle.cluesVertical && puzzle.cluesVertical[colNumber]) {
      intersecting.push({
        number: colNumber,
        clue: puzzle.cluesVertical[colNumber],
        startRow: 0,
        startCol: col,
        length: numRows,
        direction: 'vertical'
      });
    }
    
    if (intersecting.length > 0) {
      const firstWord = { ...intersecting[0], direction: intersecting[0].direction || (intersecting[0].startRow === row ? 'horizontal' : 'vertical') };
      if (selectedWord && selectedWord.number === firstWord.number && (selectedWord.direction === firstWord.direction || intersecting.length === 1)) {
        selectWord(null);
        onWordSelect?.(null);
      } else if (selectedCell.row === row && selectedCell.col === col && intersecting.length > 1) {
        const currentWordIndex = intersecting.findIndex(word => 
          selectedWord && 
          word.number === selectedWord.number && 
          word.direction === selectedWord.direction
        );
        const nextIndex = (currentWordIndex + 1) % intersecting.length;
        const nextWord = { ...intersecting[nextIndex], direction: intersecting[nextIndex].direction || (intersecting[nextIndex].startRow === row ? 'horizontal' : 'vertical') };
        selectWord(nextWord);
        onWordSelect?.(nextWord);
      } else {
        selectWord(firstWord);
        onWordSelect?.(firstWord);
      }
    }
  };

  const handleCellMouseEnter = (row, col) => {
    setHoveredCell({ row, col });
  };

  const handleCellMouseLeave = () => {
    setHoveredCell({ row: -1, col: -1 });
  };

  const isCellSelected = (row, col) => {
    return selectedCell && selectedCell.row === row && selectedCell.col === col;
  };

  const isCellHovered = (row, col) => {
    return hoveredCell && hoveredCell.row === row && hoveredCell.col === col;
  };

  const getCellNumber = (row, col) => {
    const rowNumber = row + 1;
    const colNumber = col + 1;
    const isBlackCell = puzzle.solution?.[row]?.[col] === '' || puzzle.solution?.[row]?.[col] === '#';
    if (isBlackCell) return null;
    
    const showRowNumber = (col === 0);
    const showColNumber = (row === 0);
    
    if (showRowNumber && puzzle.cluesHorizontal && puzzle.cluesHorizontal[rowNumber]) {
      return rowNumber;
    }
    if (showColNumber && puzzle.cluesVertical && puzzle.cluesVertical[colNumber]) {
      return colNumber;
    }
    
    return null;
  };

  // Clue component that's rendered inside each wrapper
  const ClueTooltip = ({ clueId, clue, onClose }) => {
    const [position, setPosition] = useState({ side: 'bottom', arrowOffset: 0 });
    const clueRef = useRef(null);
    
    useLayoutEffect(() => {
      if (!clueRef.current) return;
      
      const clueEl = clueRef.current;
      const compute = () => {
        const wrapper = clueEl.closest('.clue-wrapper');
        const anchor = wrapper?.querySelector('.clue-anchor');
        if (!wrapper || !anchor) return;
        
        const wrapperRect = wrapper.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        const clueRect = clueEl.getBoundingClientRect();
        
        // Find nearest clipping ancestor
        let clipAncestor = wrapper.parentElement;
        while (clipAncestor && clipAncestor !== document.body) {
          const style = getComputedStyle(clipAncestor);
          if (style.overflow !== 'visible' || style.overflowX !== 'visible' || style.overflowY !== 'visible') {
            break;
          }
          clipAncestor = clipAncestor.parentElement;
        }
        const clipRect = clipAncestor ? clipAncestor.getBoundingClientRect() : { 
          top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth 
        };
        
        // For both columns and rows we render the clue above the anchor (side = 'top')
        const side = 'top';
        
        // Anchor center in viewport coords
        const anchorCenterX = anchorRect.left + anchorRect.width / 2;
        const anchorCenterY = anchorRect.top + anchorRect.height / 2;
        
        // Preferred clue left (relative to wrapper)
        let clueLeft = anchorCenterX - clueRect.width / 2 - wrapperRect.left;
        const minLeft = clipRect.left - wrapperRect.left + 8; // leave small margin
        const maxLeft = clipRect.right - wrapperRect.left - clueRect.width - 8;
        if (clueLeft < minLeft) clueLeft = minLeft;
        if (clueLeft > maxLeft) clueLeft = maxLeft;
        
        // Arrow offset relative to clue box (in px)
        let arrowOffset = anchorCenterX - (wrapperRect.left + clueLeft);
        const minOffset = 12;
        const maxOffset = Math.max(minOffset, clueRect.width - 12);
        if (arrowOffset < minOffset) arrowOffset = minOffset;
        if (arrowOffset > maxOffset) arrowOffset = maxOffset;
        
        setPosition({ side, arrowOffset, clueLeft });
      };
      
      compute();
      window.addEventListener('resize', compute);
      window.addEventListener('scroll', compute, true);
      return () => {
        window.removeEventListener('resize', compute);
        window.removeEventListener('scroll', compute, true);
      };
    }, [clueId]);
    
    const getPositionStyles = () => {
      const { side } = position;
      const base = { position: 'absolute', zIndex: 9999 };
      
      if (side === 'bottom') {
        // If a custom clueLeft was computed use that; otherwise center
        return position.clueLeft !== undefined ? { ...base, top: 'calc(100% + 8px)', left: `${position.clueLeft}px`, transform: 'none' } : { ...base, top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
      } else if (side === 'top') {
        return position.clueLeft !== undefined ? { ...base, bottom: 'calc(100% + 8px)', left: `${position.clueLeft}px`, transform: 'none' } : { ...base, bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
       } else if (side === 'right') {
         return { ...base, left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' };
       } else {
         return { ...base, right: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' };
       }
     };
    
    const arrowClassMap = { top: 'arrow-down', bottom: 'arrow-up', left: 'arrow-right', right: 'arrow-left' };
    const arrowClass = arrowClassMap[position.side] || 'arrow-down';
    const clueNumber = clueId.startsWith('col-') ? clueId.split('-')[1] : clueId.split('-')[1];
    
    return (
      <div 
        ref={clueRef}
        className={`floating-clue ${arrowClass} ${language === 'ar' ? 'rtl' : ''}`}
        data-visible="true"
        style={{
          ...getPositionStyles(),
          '--arrow-left': position.side === 'top' || position.side === 'bottom' ? `${position.arrowOffset}px` : undefined,
          '--arrow-top': position.side === 'left' || position.side === 'right' ? `${position.arrowOffset}px` : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={(e) => e.stopPropagation()}
        onMouseLeave={(e) => e.stopPropagation()}
        onMouseOver={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
        onBlur={(e) => e.stopPropagation()}
      >
        <button 
          className="clue-close" 
          onClick={onClose}
          aria-label="Fermer" 
          title="Fermer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" /><path d="M6 6l12 12" />
          </svg>
        </button>
        <div>
          <div className="clue-badge">Indice {clueNumber}</div>
          <div className={`clue-body ${language === 'ar' ? 'font-arabic' : ''}`}>{clue}</div>
        </div>
      </div>
    );
  };

  // Small timer component that updates itself so the grid doesn't re-render every second
  const TimerDisplay = ({ getElapsedTime, isPaused }) => {
    const [time, setTime] = useState(() => getElapsedTime());
    useEffect(() => {
      const tick = () => setTime(getElapsedTime());
      const id = setInterval(tick, 1000);
      tick();
      return () => clearInterval(id);
    }, [getElapsedTime]);

    const mm = String(Math.floor(time / 60)).padStart(2, '0');
    const ss = String(time % 60).padStart(2, '0');
    return (
      <span className={`text-sm font-medium ${isPaused ? 'text-orange-600' : 'text-gray-700'}`}>
        Temps: {mm}:{ss} {isPaused && '(Pause)'}
      </span>
    );
  };

  // Early return if no valid grid data
  if (!currentGrid || !Array.isArray(currentGrid) || currentGrid.length === 0 || 
      !puzzle || !puzzle.solution || !Array.isArray(puzzle.solution)) {
    return (
      <div className="grid gap-1 p-4 bg-white rounded-2xl shadow-lg">
        <div className="text-center text-gray-500 p-8">
          Pas de partie disponible pour le moment
        </div>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="grid gap-1 p-4 bg-white rounded-2xl shadow-lg">
        <p className="text-gray-500">Aucune grille chargée</p>
      </div>
    );
  }

  return (
    <motion.div
      ref={gridRef}
      className={`relative p-2 sm:p-3 lg:p-4 bg-white rounded-xl lg:rounded-2xl shadow-lg ${className}`}
      style={{ direction: 'ltr' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-bold text-center mb-1 sm:mb-2">{puzzle.title}</h3>
        <div className="text-xs sm:text-sm text-gray-600 text-center">
          <span>Grille {numRows} × {numCols}</span>
          <span className="ml-4">Difficulté: {puzzle.difficulty === 'easy' ? 'Facile' : puzzle.difficulty === 'medium' ? 'Moyen' : 'Difficile'}</span>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <div ref={scrollRef} className={`w-full overflow-visible flex ${isOverflowing ? 'justify-start' : 'justify-center'}`}>
          <div className="w-auto">
            <div className="player-grid-force-ltr" dir="ltr" style={{ direction: 'ltr', width: 'max-content' }}>
              {/* Top header row */}
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`, gap: '0.125rem' }}>
                  {Array.from({ length: numCols }).map((_, colIndex) => {
                    const colNumber = colIndex + 1;
                    const hasClue = puzzle.cluesVertical && puzzle.cluesVertical[colNumber];
                    const clueId = `col-${colNumber}`;
                    const isActive = activeClueId === clueId;
                    
                    return (
                      <div key={`col-head-${colIndex}`} className="clue-wrapper" style={{ position: 'relative', zIndex: isActive ? 9998 : undefined }}>
                        <button
                          className={`clue-anchor flex items-center justify-center text-xs text-gray-700 bg-gray-100/40 rounded-sm p-1 h-8 w-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-2 transition-colors ${hasClue ? `cursor-pointer ${selectedWord && selectedWord.number === colNumber && selectedWord.direction === 'vertical' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}` : 'border-gray-300 opacity-30 cursor-not-allowed'}`}
                          onClick={() => {
                            if (!hasClue) return;
                            const word = { number: colNumber, startRow: 0, startCol: colIndex, length: numRows, direction: 'vertical', clue: puzzle.cluesVertical[colNumber] };
                            setActiveClueId(prev => {
                              if (prev === clueId) {
                                selectWord(null);
                                onWordSelect?.(null);
                                return null;
                              }
                              selectWord(word, false);
                              onWordSelect?.(word);
                              return clueId;
                            });
                          }}
                        >
                          <span className="col-number">{colNumber}</span>
                        </button>
                        {isActive && hasClue && (
                          <ClueTooltip 
                            clueId={clueId}
                            clue={puzzle.cluesVertical[colNumber]}
                            onClose={() => {
                              closeActiveClue();
                              selectWord(null);
                              onWordSelect?.(null);
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Body row: row headers + cells */}
              <div style={{ display: 'flex' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                  {Array.from({ length: numRows }).map((_, rowIndex) => {
                    const rowNumber = rowIndex + 1;
                    const hasRowClue = puzzle.cluesHorizontal && puzzle.cluesHorizontal[rowNumber];
                    const clueId = `row-${rowNumber}`;
                    const isActive = activeClueId === clueId;
                    
                    return (
                      <div key={`row-head-${rowIndex}`} className="clue-wrapper" style={{ position: 'relative', zIndex: isActive ? 9998 : undefined }}>
                        <button
                          className={`clue-anchor flex items-center justify-center text-xs text-gray-700 bg-gray-100/40 rounded-sm p-1 h-8 w-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-2 transition-colors ${hasRowClue ? `cursor-pointer ${selectedWord && selectedWord.number === rowNumber && selectedWord.direction === 'horizontal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}` : 'border-gray-300 opacity-30 cursor-not-allowed'}`}
                          onClick={() => {
                            if (!hasRowClue) return;
                            const word = { number: rowNumber, startRow: rowIndex, startCol: 0, length: numCols, direction: 'horizontal', clue: puzzle.cluesHorizontal[rowNumber] };
                            setActiveClueId(prev => {
                              if (prev === clueId) {
                                selectWord(null);
                                onWordSelect?.(null);
                                return null;
                              }
                              selectWord(word, false);
                              onWordSelect?.(word);
                              return clueId;
                            });
                          }}
                        >
                          <span className="row-number">{hasRowClue ? rowNumber : ''}</span>
                        </button>
                        {isActive && hasRowClue && (
                          <ClueTooltip 
                            clueId={clueId}
                            clue={puzzle.cluesHorizontal[rowNumber]}
                            onClose={() => {
                              closeActiveClue();
                              selectWord(null);
                              onWordSelect?.(null);
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`, gap: '0.125rem' }}>
                  {Array.from({ length: numRows }).map((_, rowIndex) => {
                    return Array.from({ length: numCols }).map((_, colIndex) => {
                      const cell = currentGrid?.[rowIndex]?.[colIndex] || '';
                      const isBlackCell = puzzle.solution?.[rowIndex]?.[colIndex] === '' || puzzle.solution?.[rowIndex]?.[colIndex] === '#';
                      const isSelected = isCellSelected(rowIndex, colIndex);
                      const cellNumber = getCellNumber(rowIndex, colIndex);
                      const cellKey = `${rowIndex}-${colIndex}`;
                      return (
                        <CrosswordCell
                          key={cellKey}
                          value={cell || ''}
                          onChange={handleCellChange}
                          onNavigate={handleCellNavigation}
                          isSelected={isSelected}
                          isHovered={isCellHovered(rowIndex, colIndex)}
                          isBlackCell={isBlackCell}
                          language={language}
                          cellNumber={null}
                          selectedWord={selectedWord}
                          row={rowIndex}
                          col={colIndex}
                          activeClueId={activeClueId}
                          setActiveClueId={setActiveClueId}
                          closeActiveClue={closeActiveClue}
                          getClueForNumber={(r, c) => {
                            const rowNumber = r + 1;
                            const colNumber = c + 1;
                            const hasRowClue = puzzle.cluesHorizontal && puzzle.cluesHorizontal[rowNumber];
                            const hasColClue = puzzle.cluesVertical && puzzle.cluesVertical[colNumber];
                            if (hasRowClue && (!hasColClue || c === 0)) return puzzle.cluesHorizontal[rowNumber];
                            if (hasColClue) return puzzle.cluesVertical[colNumber];
                            return '';
                          }}
                          onClick={handleCellClick}
                          onNumberClick={(r, c) => {
                            const rowNumber = r + 1;
                            const colNumber = c + 1;
                            const hasRowClue = puzzle.cluesHorizontal && puzzle.cluesHorizontal[rowNumber];
                            const hasColClue = puzzle.cluesVertical && puzzle.cluesVertical[colNumber];

                            if (hasRowClue && (!hasColClue || c === 0)) {
                              const word = { number: rowNumber, startRow: r, startCol: 0, length: puzzle.cols || (currentGrid?.[r]?.length || 0), direction: 'horizontal', clue: puzzle.cluesHorizontal[rowNumber] };
                              if (selectedWord && selectedWord.number === word.number && selectedWord.direction === 'horizontal') {
                                selectWord(null);
                                onWordSelect?.(null);
                              } else {
                                selectWord(word);
                                onWordSelect?.(word);
                              }
                            } else if (hasColClue) {
                              const word = { number: colNumber, startRow: 0, startCol: c, length: puzzle.rows || (currentGrid?.length || 0), direction: 'vertical', clue: puzzle.cluesVertical[colNumber] };
                              if (selectedWord && selectedWord.number === word.number && selectedWord.direction === 'vertical') {
                                selectWord(null);
                                onWordSelect?.(null);
                              } else {
                                selectWord(word);
                                onWordSelect?.(word);
                              }
                            }
                          }}
                          onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                          onMouseLeave={handleCellMouseLeave}
                          className={`${invalidInput ? 'animate-shake' : ''}`}
                        />
                      );
                    });
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mt-4 space-y-3">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
          <button
            onClick={() => isPaused ? resumeTimer() : pauseTimer()}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title={isPaused ? "Reprendre" : "Pause"}
          >
            {isPaused ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/>
                <polygon fill="currentColor" points="10,8 16,12 10,16"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="10" y1="15" x2="10" y2="9"/>
                <line x1="14" y1="15" x2="14" y2="9"/>
              </svg>
            )}
          </button>
          
          <button
            onClick={handleResetTimer}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Remettre à zéro le chrono"
          >
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="12" cy="13" r="8"/>
            <path d="m12 9-2 3h4l-2-3"/>
            <path d="M12 7V2m0 0L9 5m3-3 3 3"/>
          </svg>
          
          <TimerDisplay getElapsedTime={getElapsedTime} isPaused={isPaused} />
        </div>
        
        {/* Navigation Controls */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-gray-600 font-medium">Direction automatique</div>
          <div className="text-xs text-gray-500 text-center">Cliquez pour définir la direction de navigation automatique</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (selectedCell) {
                  setPreferredDirection('up');
                  handleCellNavigation('up', selectedCell.row, selectedCell.col);
                }
              }}
              className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                preferredDirection === 'up' 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}isPaused
              disabled={!selectedCell}
              title="Définir direction automatique: haut"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m18 15-6-6-6 6"/>
              </svg>
            </button>
            <button
              onClick={() => {
                if (selectedCell) {
                  setPreferredDirection('left');
                  handleCellNavigation('left', selectedCell.row, selectedCell.col);
                }
              }}
              className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                preferredDirection === 'left' 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              disabled={!selectedCell}
              title="Définir direction automatique: gauche"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <button
              onClick={() => {
                if (selectedCell) {
                  setPreferredDirection('down');
                  handleCellNavigation('down', selectedCell.row, selectedCell.col);
                }
              }}
              className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                preferredDirection === 'down' 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              disabled={!selectedCell}
              title="Définir direction automatique: bas"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            <button
              onClick={() => {
                if (selectedCell) {
                  setPreferredDirection('right');
                  handleCellNavigation('right', selectedCell.row, selectedCell.col);
                }
              }}
              className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                preferredDirection === 'right' 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              disabled={!selectedCell}
              title="Définir direction automatique: droite"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Game Reset Button - separated and clearly labeled */}
        <div>
          <button
            onClick={() => externalResetGame && externalResetGame()}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
            title="Recommencer la partie depuis le début"
          >
            🔄 Recommencer la partie
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(CrosswordGrid);
