import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [currentTime, setCurrentTime] = useState(0);
  const [preferredDirection, setPreferredDirection] = useState('right'); // Default to right
  const [floatingClue, setFloatingClue] = useState({ show: false, clue: '', type: '', index: -1, top: 0, left: 0, transform: '', arrowClass: '', position: undefined, width: undefined, measuring: false, anchorRect: null });
  const tooltipRef = useRef(null);
  // Update timer every second - use state callback to avoid function dependency

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getElapsedTime());
    }, 1000);
    setCurrentTime(getElapsedTime());
    return () => clearInterval(interval);
  }, [getElapsedTime]);

  // Track whether the horizontal container is overflowing so we can left-align when needed
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
          // Only force scroll to left when overflow first appears and user is not actively scrolling
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
  
  // Handle click outside to close floating clue
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (floatingClue.show && gridRef.current && !gridRef.current.contains(event.target)) {
  setFloatingClue({ show: false, clue: '', type: '', index: -1, top: 0, left: 0, transform: '', arrowClass: '', position: undefined, width: undefined });
        selectWord(null);
        onWordSelect?.(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && floatingClue.show) {
        setFloatingClue({ show: false, clue: '', type: '', index: -1, top: 0, left: 0, transform: '', arrowClass: '' });
        selectWord(null);
        onWordSelect?.(null);
      }
    };

    if (floatingClue.show) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [floatingClue.show, selectWord, onWordSelect]);

  // Update timer immediately after reset
  const handleResetTimer = () => {
    resetTimer();
    setCurrentTime(0);
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
        if (currentCol < numCols - 1) {
          newCol = currentCol + 1;
        }
        break;
      case 'left':
        if (currentCol > 0) {
          newCol = currentCol - 1;
        }
        break;
      case 'up':
        if (currentRow > 0) {
          newRow = currentRow - 1;
        }
        break;
      case 'down':
        if (currentRow < numRows - 1) {
          newRow = currentRow + 1;
        }
        break;
    }

    // Skip black cells
    while (newRow >= 0 && newRow < numRows &&
           newCol >= 0 && newCol < numCols &&
           (puzzle.solution?.[newRow]?.[newCol] === '' || puzzle.solution?.[newRow]?.[newCol] === '#')) {

      switch (direction) {
        case 'right':
          if (newCol < numCols - 1) {
            newCol++;
          } else {
            return; // Can't move further right
          }
          break;
        case 'left':
          if (newCol > 0) {
            newCol--;
          } else {
            return; // Can't move further left
          }
          break;
        case 'up':
          if (newRow > 0) {
            newRow--;
          } else {
            return; // Can't move further up
          }
          break;
        case 'down':
          if (newRow < numRows - 1) {
            newRow++;
          } else {
            return; // Can't move further down
          }
          break;
      }
    }

    selectCell(newRow, newCol);
  }, [puzzle, selectCell, numRows, numCols]);

  // Handle cell value changes
  const handleCellChange = useCallback((value, row, col) => {
    if (!puzzle || !currentGrid) return;
    
    updateGridCell(row, col, value);
    
    // Auto-navigate in preferred direction after typing a letter
    if (value && value.trim() !== '') {
      setTimeout(() => {
        handleCellNavigation(preferredDirection, row, col);
      }, 10); // Small delay to ensure the cell update completes
    }
  }, [puzzle, currentGrid, updateGridCell, preferredDirection, handleCellNavigation]);

  // Prepare floating clue element. We render it via a portal to document.body when position is 'fixed'
  const renderFloatingClue = () => {
    if (!floatingClue.show) return null;

    const style = {
      position: floatingClue.position === 'fixed' ? 'fixed' : 'absolute',
      top: floatingClue.top + 'px',
      left: floatingClue.left + 'px',
      // set transform only when explicitly provided (otherwise rely on absolute left/top)
      ...(floatingClue.transform ? { transform: floatingClue.transform } : {}),
      width: floatingClue.width ? floatingClue.width + 'px' : undefined,
      maxWidth: 'min(300px, 80vw)',
      zIndex: 1000
    };

    const element = (
      <div
        ref={tooltipRef}
        className={`floating-clue ${floatingClue.arrowClass} ${language === 'ar' ? 'rtl' : ''}`}
        data-visible="true"
        role="dialog"
        aria-modal="false"
        aria-label={`Indice ${floatingClue.type === 'row' ? 'ligne' : 'colonne'} ${floatingClue.index + 1}`}
        style={{
          ...style,
          // During the first render pass we keep the tooltip visually hidden while measuring
          opacity: floatingClue.measuring ? 0 : style.opacity,
          pointerEvents: floatingClue.measuring ? 'none' : undefined,
          // expose arrow offset variables if present
          ['--arrow-left']: floatingClue.arrowLeft !== undefined ? `${floatingClue.arrowLeft}px` : undefined,
          ['--arrow-top']: floatingClue.arrowTop !== undefined ? `${floatingClue.arrowTop}px` : undefined
          , ['--arrow-size']: floatingClue.width ? '14px' : '14px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="clue-close"
          onClick={() => setFloatingClue({ show: false, clue: '', type: '', index: -1, top: 0, left: 0, transform: '', arrowClass: '', position: undefined, width: undefined })}
          aria-label="Fermer indice"
          title="Fermer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
        <div>
          <div className="clue-badge">Indice {floatingClue.index + 1}</div>
          <div className={`clue-body ${language === 'ar' ? 'font-arabic' : ''}`}>{floatingClue.clue}</div>
        </div>
      </div>
    );

    if (floatingClue.position === 'fixed' && typeof document !== 'undefined') {
      return createPortal(element, document.body);
    }

    return element;
  };

  const handleCellClick = (row, col) => {
    if (!puzzle || !currentGrid) return;
    
    // Don't select black cells
    if (puzzle.solution[row][col] === '') return;
    
    selectCell(row, col);
    onCellSelect?.(row, col);
    
    // Find intersecting words (adapted for simplified object format)
    const intersecting = [];
    
    // For simplified system: check if current position intersects with row/column clues
    const rowNumber = row + 1; // Convert to 1-based
    const colNumber = col + 1; // Convert to 1-based
    
    // Check horizontal clue (entire row)
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
    
    // Check vertical clue (entire column)  
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
      // If the same numbered word is already selected, toggle it off
      const firstWord = { ...intersecting[0], direction: intersecting[0].direction || (intersecting[0].startRow === row ? 'horizontal' : 'vertical') };
      if (selectedWord && selectedWord.number === firstWord.number && (selectedWord.direction === firstWord.direction || intersecting.length === 1)) {
        selectWord(null);
        onWordSelect?.(null);
      } else if (selectedCell.row === row && selectedCell.col === col && intersecting.length > 1) {
        // If same cell clicked and multiple intersecting words, cycle to next
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

  // Measure tooltip and reposition precisely when in measuring mode
  useLayoutEffect(() => {
    if (!floatingClue.show || !floatingClue.measuring || !tooltipRef.current || !floatingClue.anchorRect) return;

    const tipEl = tooltipRef.current;
    const anchor = floatingClue.anchorRect;
    const tipRect = tipEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = floatingClue.top;
    let left = floatingClue.left;
    let arrowLeft = undefined;
    let arrowTop = undefined;

    if (floatingClue.type === 'col') {
      // Compute absolute tooltip left (no translate) so positioning is deterministic
      const anchorCenterX = anchor.left + anchor.width / 2;
      // Default above the anchor
      if (anchor.top >= tipRect.height + 24) {
        top = anchor.top - tipRect.height - 10;
      } else {
        top = anchor.bottom + 10;
      }
      // desired left so tooltip is centered on anchor
      let desiredLeft = anchorCenterX - tipRect.width / 2;
      // Clamp horizontally
      const minLeft = 8;
      const maxLeft = viewportWidth - 8 - tipRect.width;
      if (desiredLeft < minLeft) desiredLeft = minLeft;
      if (desiredLeft > maxLeft) desiredLeft = maxLeft;
      left = desiredLeft;
      // Arrow offset relative to tooltip left
      arrowLeft = anchorCenterX - left;
    } else if (floatingClue.type === 'row') {
      // Center vertically on anchor and place left or right of it
      const anchorCenterY = anchor.top + anchor.height / 2;
      // desired top so tooltip is centered on anchor vertically
      let desiredTop = anchorCenterY - tipRect.height / 2;
      // Clamp vertically and leave a safe bottom margin for controls
      const minTop = 8;
      const bottomSafe = 80; // leave room for footer controls
      const maxTop = viewportHeight - bottomSafe - tipRect.height;
      if (desiredTop < minTop) desiredTop = minTop;
      if (desiredTop > maxTop) desiredTop = maxTop;
      top = desiredTop;
      // Prefer left side if space available (with small padding)
      const padding = 12;
      const preferLeft = anchor.left >= tipRect.width + padding * 2;
      if (preferLeft) {
        left = anchor.left - padding - tipRect.width;
      } else {
        left = anchor.right + padding;
      }
      // Clamp horizontally so tooltip stays visible
      const minLeft = 8;
      const maxLeft = viewportWidth - 8 - tipRect.width;
      if (left < minLeft) left = minLeft;
      if (left > maxLeft) left = maxLeft;
      // Arrow vertical offset relative to tooltip top
      arrowTop = anchorCenterY - top;
    }

    // Normalize arrow offsets to be within the tooltip box (padding 12px)
    if (arrowLeft !== undefined) {
      const maxLeft = tipRect.width - 12;
      if (arrowLeft < 12) arrowLeft = 12;
      if (arrowLeft > maxLeft) arrowLeft = maxLeft;
    }
    if (arrowTop !== undefined) {
      const maxTop = tipRect.height - 12;
      if (arrowTop < 12) arrowTop = 12;
      if (arrowTop > maxTop) arrowTop = maxTop;
    }

    // Update state to show the tooltip (measuring done)
    setFloatingClue(prev => ({
      ...prev,
      top,
      left,
      transform: '',
      measuring: false,
      arrowLeft,
      arrowTop
    }));
  }, [floatingClue.show, floatingClue.measuring, floatingClue.anchorRect]);

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
    // For the simplified grid system where:
    // - Horizontal clues are numbered by row (1-based)  
    // - Vertical clues are numbered by column (1-based)
    
    const rowNumber = row + 1; // Convert to 1-based
    const colNumber = col + 1; // Convert to 1-based
    
    // Show numbers in appropriate positions based on language
    const isBlackCell = puzzle.solution?.[row]?.[col] === '' || puzzle.solution?.[row]?.[col] === '#';
    if (isBlackCell) return null;
    
  // For Arabic we want the grid to appear like the French layout but
  // with numbers located as follows:
  // - Row numbers on the right side
  // - Column numbers on the top
  // For French (LTR) we keep: row numbers on the left, column numbers on the top
  // Show row numbers on the leftmost column for both languages
  const showRowNumber = (col === 0);

  // Show column numbers: always on the top row for both languages
  const showColNumber = (row === 0);
    
    if (showRowNumber && puzzle.cluesHorizontal && puzzle.cluesHorizontal[rowNumber]) {
      return rowNumber;
    }
    if (showColNumber && puzzle.cluesVertical && puzzle.cluesVertical[colNumber]) {
      return colNumber;
    }
    
    return null;
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

  // Always render grid LTR, even for Arabic
  const isRTL = false;

  // Handle navigation between cells


  // Conditional rendering AFTER all hooks have been called
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

  {/* arrow pseudo-elements are defined in CSS (`src/index.css`) to avoid duplication */}

  {/* Floating clue (rendered via portal when fixed) */}
  {renderFloatingClue()}
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-bold text-center mb-1 sm:mb-2">{puzzle.title}</h3>
        <div className="text-xs sm:text-sm text-gray-600 text-center">
          <span>Grille {numRows} × {numCols}</span>
          <span className="ml-4">Difficulté: {puzzle.difficulty === 'easy' ? 'Facile' : puzzle.difficulty === 'medium' ? 'Moyen' : 'Difficile'}</span>
        </div>
      </div>

      {/* Grid with separate top column headers and left row headers (Option A) */}
      <div className="flex justify-center mb-4">
        <div ref={scrollRef} className={`w-full overflow-x-auto overflow-y-visible flex ${isOverflowing ? 'justify-start' : 'justify-center'}`}>
          <div className="w-auto">
            <div className="player-grid-force-ltr" dir="ltr" style={{ direction: 'ltr', width: 'max-content' }}>
              {/* Top header row */}
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`, gap: '0.125rem' }}>
                  {Array.from({ length: numCols }).map((_, colIndex) => {
                    const colNumber = colIndex + 1;
                    const hasClue = puzzle.cluesVertical && puzzle.cluesVertical[colNumber];
                    return (
                      <div key={`col-head-${colIndex}`} className="relative">
                        <button
                          onClick={(e) => {
                            if (!hasClue) return;
                            
                            // Toggle floating clue visibility
                            if (floatingClue.show && floatingClue.type === 'col' && floatingClue.index === colIndex) {
                              // Hide if same clue is clicked
                              setFloatingClue({ show: false, clue: '', type: '', index: -1, top: 0, left: 0, transform: '', arrowClass: '' });
                              selectWord(null);
                              onWordSelect?.(null);
                            } else {
                              // Show new clue
                              const word = { number: colNumber, startRow: 0, startCol: colIndex, length: numRows, direction: 'vertical', clue: puzzle.cluesVertical[colNumber] };
                              selectWord(word,false);
                              onWordSelect?.(word);
                              
                              // Prefer anchoring to the visible number inside the header for better alignment
                              let rect = e.currentTarget.getBoundingClientRect();
                              const numEl = e.currentTarget.querySelector('.col-number');
                              if (numEl) rect = numEl.getBoundingClientRect();
                              const gridRect = gridRef.current.getBoundingClientRect();
                              const anchorRect = (numEl ? numEl.getBoundingClientRect() : e.currentTarget.getBoundingClientRect());
                              const viewportWidth = window.innerWidth;
                              const viewportHeight = window.innerHeight;
                              
                              // Compute viewport-fixed position so tooltip stays next to the clicked header
                              // Use rect (viewport coordinates) directly and render tooltip with position: fixed
                              let clueTopV = rect.top - 48; // place above by default
                              let clueLeftV = rect.left + rect.width / 2;
                              let transform = 'translateX(-50%)';
                              let arrowClass = 'arrow-down';

                              // If not enough space above, position below
                              if (rect.top < 80) {
                                clueTopV = rect.bottom + 10;
                                arrowClass = 'arrow-up';
                                transform = 'translateX(-50%)';
                              }

                              // Clamp horizontally to viewport
                              const cw = Math.min(300, Math.max(140, rect.width * 3));
                              if (clueLeftV - cw / 2 < 8) clueLeftV = 8 + cw / 2;
                              if (clueLeftV + cw / 2 > viewportWidth - 8) clueLeftV = viewportWidth - 8 - cw / 2;

                              setFloatingClue({ 
                                show: true, 
                                clue: word.clue, 
                                type: 'col', 
                                index: colIndex, 
                                top: clueTopV, 
                                left: clueLeftV, 
                                transform,
                                arrowClass,
                                position: 'fixed',
                                width: cw,
                                measuring: true,
                                anchorRect
                              });
                            }
                          }}
                          className={`flex items-center justify-center text-xs text-gray-700 bg-gray-100/40 rounded-sm p-1 h-8 w-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-2 transition-colors ${hasClue ? `cursor-pointer ${selectedWord && selectedWord.number === colNumber && selectedWord.direction === 'vertical' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}` : 'border-gray-300 opacity-30 cursor-not-allowed'}`}
                        >
                          <span className="col-number">{colNumber}</span>
                        </button>
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
                    return (
                      <div key={`row-head-${rowIndex}`} className="relative">
                        <button
                          onClick={(e) => {
                            if (!hasRowClue) return;
                            
                            // Toggle floating clue visibility
                            if (floatingClue.show && floatingClue.type === 'row' && floatingClue.index === rowIndex) {
                              // Hide if same clue is clicked
                              setFloatingClue({ show: false, clue: '', type: '', index: -1, top: 0, left: 0, transform: '', arrowClass: '' });
                              selectWord(null);
                              onWordSelect?.(null);
                            } else {
                              // Show new clue
                              const word = { number: rowNumber, startRow: rowIndex, startCol: 0, length: numCols, direction: 'horizontal', clue: puzzle.cluesHorizontal[rowNumber] };
                              selectWord(word, false);
                              onWordSelect?.(word);
                              
                              // Prefer anchoring to the visible number inside the header for better alignment
                              let rect = e.currentTarget.getBoundingClientRect();
                              const numEl = e.currentTarget.querySelector('.row-number');
                              if (numEl) rect = numEl.getBoundingClientRect();
                              const gridRect = gridRef.current.getBoundingClientRect();
                              const anchorRect = (numEl ? numEl.getBoundingClientRect() : e.currentTarget.getBoundingClientRect());
                              const viewportWidth = window.innerWidth;
                              const viewportHeight = window.innerHeight;
                              
                              // Compute viewport-fixed position for row clue
                              // center vertically on the number element
                              const estTooltipH = 120; // estimated tooltip height for centering
                              let clueTopV = rect.top + rect.height / 2 - estTooltipH / 2;
                              let clueLeftV = rect.left - 12; // try left by default
                              let transform = 'translateY(-50%)';
                              let arrowClass = 'arrow-right';

                              // If no room on the left, put it on the right
                              if (rect.left < 160) {
                                clueLeftV = rect.right + 12;
                                arrowClass = 'arrow-left';
                                transform = 'translateY(-50%)';
                              }

                              // Clamp vertically within viewport
                              const minTop = 8;
                              const maxTop = viewportHeight - 8 - estTooltipH;
                              if (clueTopV < minTop) clueTopV = minTop;
                              if (clueTopV > maxTop) clueTopV = maxTop;

                              setFloatingClue({
                                show: true,
                                clue: word.clue,
                                type: 'row',
                                index: rowIndex,
                                top: clueTopV,
                                left: clueLeftV,
                                transform,
                                arrowClass,
                                position: 'fixed',
                                width: 300,
                                measuring: true,
                                anchorRect
                              });
                            }
                          }}
                          className={`flex items-center justify-center text-xs text-gray-700 bg-gray-100/40 rounded-sm p-1 h-8 w-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-2 transition-colors ${hasRowClue ? `cursor-pointer ${selectedWord && selectedWord.number === rowNumber && selectedWord.direction === 'horizontal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}` : 'border-gray-300 opacity-30 cursor-not-allowed'}`}
                        >
                          <span className="row-number">{hasRowClue ? rowNumber : ''}</span>
                        </button>
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
                          onClick={handleCellClick}
                          onNumberClick={(r, c) => {
                            // Determine if this number corresponds to a row or column clue
                            const rowNumber = r + 1;
                            const colNumber = c + 1;
                            const hasRowClue = puzzle.cluesHorizontal && puzzle.cluesHorizontal[rowNumber];
                            const hasColClue = puzzle.cluesVertical && puzzle.cluesVertical[colNumber];

                            // Prefer row clue if this cell is in the first column header position, otherwise column clue
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
            {/* Timer Display - separated from game controls */}
      <div className="text-center mt-4 space-y-3">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
          <button
            onClick={() => isPaused ? resumeTimer() : pauseTimer()}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title={isPaused ? "Reprendre" : "Pause"}
          >
            {isPaused ? (
              // Modern Play icon - triangle in circle
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/>
                <polygon fill="currentColor" points="10,8 16,12 10,16"/>
              </svg>
            ) : (
              // Modern Pause icon - two bars in circle
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
            {/* Modern Reset/Refresh icon */}
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          
          {/* Modern Timer icon */}
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="12" cy="13" r="8"/>
            <path d="m12 9-2 3h4l-2-3"/>
            <path d="M12 7V2m0 0L9 5m3-3 3 3"/>
          </svg>
          
          <span className={`text-sm font-medium ${isPaused ? 'text-orange-600' : 'text-gray-700'}`}>
            Temps: {(() => {
              const minutes = Math.floor(currentTime / 60);
              const seconds = currentTime % 60;
              return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            })()} {isPaused && '(Pause)'}
          </span>
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
              }`}
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
