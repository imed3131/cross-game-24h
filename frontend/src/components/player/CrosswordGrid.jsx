import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrosswordGame } from '../../hooks/useCrosswordGame';
import CrosswordCell from './CrosswordCell';
import { useClue } from '../../context/ClueContext';
import { useGameState } from '../../context/GameState';
import { t } from '../../i18n';

const CrosswordGrid = ({ puzzle, onCellSelect, onWordSelect, resetGame: externalResetGame, className = '' }) => {
  const { state: gameState } = useGameState ? useGameState() : { state: { language: 'FR' } };
  const siteLang = gameState?.language || 'FR';
  const loc = (k) => t(k, siteLang);
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

  // Normalize language values used in puzzle objects and UI (handles 'fr','FR','french','العربية', etc.)
  const normalizeLang = (l) => {
    if (!l) return '';
    const s = String(l).trim();
    const up = s.toUpperCase();
    if (up === 'FR' || up.startsWith('F') || up === 'FRENCH' || up === 'FRANCAIS' || up === 'FRANÇAIS') return 'FR';
    if (up === 'AR' || up.startsWith('A') || up === 'ARABIC' || s === 'العربية') return 'AR';
    return up;
  };

  const {
    visibleClueId,
    persistentClueId,
    openClueHover,
    closeClueHover,
    openClueUser,
    closeClueUser
  } = useClue();

  const gridRef = useRef(null);
  const scrollRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [cellRefs, setCellRefs] = useState({});
  const anchorRefs = useRef({});
  const [hoveredCell, setHoveredCell] = useState({ row: -1, col: -1 });
  const [preferredDirection, setPreferredDirection] = useState('right');
  const lastCloseRef = useRef(0);
  const lastKeypressRef = useRef(0);
  // Detect touch / mobile environment (used to switch hover -> tap behaviour)
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Helper to decide if hovering should open a clue. Blocks opens while user is typing
  // (an input inside the grid has focus) and avoids immediate reopen after a close.
  const canOpenClueOnHover = useCallback(() => {
    // For hover behaviour we want it to be responsive: always allow opening on hover.
    // If you want to debounce or block during typing, adjust this function.
    return true;
  }, []);

  // Centralized close helper is provided by context; keep local helper for convenience
  const closeActiveClue = useCallback(() => {
    // prefer closing hover first; fallback to closing persistent
    if (persistentClueId) {
      closeClueUser({ force: true });
    } else {
      closeClueHover();
    }
    lastCloseRef.current = Date.now();
  }, [persistentClueId, closeClueHover, closeClueUser]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('visibleClueId changed ->', visibleClueId);
  }, [visibleClueId]);

  // Update touch-capable / no-hover detection. Uses matchMedia('(hover: none)') and fallbacks.
  useEffect(() => {
    const updateIsTouch = () => {
      if (typeof window === 'undefined') return;
      let touch = false;
      try {
        const mq = window.matchMedia && window.matchMedia('(hover: none)');
        const hasTouchPoints = typeof navigator !== 'undefined' && ((navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0));
        if (mq) {
          // If the UA explicitly reports no-hover, prefer that (this handles hybrid devices correctly)
          touch = mq.matches;
        } else {
          touch = hasTouchPoints || ('ontouchstart' in window);
        }
      } catch (e) {
        touch = ('ontouchstart' in window);
      }
      setIsTouchDevice(Boolean(touch));
    };

    updateIsTouch();
    const mql = window.matchMedia && window.matchMedia('(hover: none)');
    if (mql && typeof mql.addEventListener === 'function') mql.addEventListener('change', updateIsTouch);
    window.addEventListener('resize', updateIsTouch, { passive: true });
    window.addEventListener('orientationchange', updateIsTouch, { passive: true });
    return () => {
      if (mql && typeof mql.removeEventListener === 'function') mql.removeEventListener('change', updateIsTouch);
      window.removeEventListener('resize', updateIsTouch);
      window.removeEventListener('orientationchange', updateIsTouch);
    };
  }, []);

  // Close any open clue when focus moves to an input inside the grid (typing started)
  useEffect(() => {
    const onFocusIn = (e) => {
      const target = e.target;
      if (gridRef.current && gridRef.current.contains(target) && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (visibleClueId) {
          closeActiveClue();
          selectWord(null);
          onWordSelect?.(null);
        }
      }
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [visibleClueId, closeActiveClue, selectWord, onWordSelect]);

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
      if (!visibleClueId) return;
      let target = event.target;
      // If the target is a text node, use its parent element
      if (target && target.nodeType === 3) target = target.parentElement;
      const clickedInsideGrid = gridRef.current && target && gridRef.current.contains(target);
      const clickedOnClue = target && target.closest && target.closest('.floating-clue');
      const clickedOnAnchor = target && target.closest && target.closest('.clue-anchor');

      if (isTouchDevice) {
        // On touch devices, close when tapping anywhere except the clue itself or an anchor
        if (!clickedOnClue && !clickedOnAnchor) {
          closeActiveClue();
          selectWord(null);
          onWordSelect?.(null);
        }
      } else {
        // Desktop: close when clicking outside the whole grid
        if (!clickedInsideGrid) {
          closeActiveClue();
          selectWord(null);
          onWordSelect?.(null);
        }
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && visibleClueId) {
        closeActiveClue();
        selectWord(null);
        onWordSelect?.(null);
      }
    };

    if (visibleClueId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visibleClueId, selectWord, onWordSelect, isTouchDevice, closeActiveClue]);

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

  const handleCellMouseLeave = (row, col) => {
    setHoveredCell({ row: -1, col: -1 });
    if (!isTouchDevice) {
      const id = `cell-${row}-${col}`;
      if (visibleClueId === id) {
        closeActiveClue();
      }
    }
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

  // Clue component that's rendered inside each wrapper — rendered via portal so it isn't clipped by scrollable ancestors
  const ClueTooltip = ({ clueId, clue, buttonRef, onClose }) => {
    const [pos, setPos] = useState({ x: 0, y: 0, side: 'top', arrowOffset: 0 });
    const clueRef = useRef(null);
    const posRef = useRef(null);

    useLayoutEffect(() => {
      if (!clueRef.current || !buttonRef || !buttonRef.current) return;

      const clueEl = clueRef.current;

      const compute = () => {
        const anchor = buttonRef.current;
        if (!anchor) return;

        // Limit tooltip width so long clues wrap and we can measure reliably
        clueEl.style.maxWidth = 'min(90vw, 520px)';
        clueEl.style.boxSizing = 'border-box';

        const anchorRect = anchor.getBoundingClientRect();
        let clueRect = clueEl.getBoundingClientRect();

        const anchorCenterX = anchorRect.left + anchorRect.width / 2;

        // Space available above / below the anchor
        const availableAbove = anchorRect.top;
        const availableBelow = window.innerHeight - anchorRect.bottom;

        const margin = 12; // viewport margin
        // Prefer showing above and attach to the anchor from the top
        let side = 'top';

        // If it fits fully above, keep it above
        if (availableAbove >= clueRect.height + 16) {
          side = 'top';
        } else if (availableBelow >= clueRect.height + 16) {
          // If it doesn't fit above but fits below, use bottom
          side = 'bottom';
        } else {
          // If neither side fits fully, prefer top but clamp height to available space
          side = 'top';
        }

        // Determine maximum available vertical space on chosen side and clamp height
        const availableSpace = side === 'top' ? Math.max(40, availableAbove - margin) : Math.max(40, availableBelow - margin);
        const maxHeight = Math.max(80, Math.min(availableSpace, window.innerHeight - 40));

        // Apply height constraint and allow scrolling if needed (scrollbars are visually hidden)
        clueEl.style.maxHeight = `${maxHeight}px`;
        clueEl.style.overflowY = 'auto';

        // Re-measure after applying constraints
        clueRect = clueEl.getBoundingClientRect();

        // Calculate X (anchor-centric) and prefer staying near the anchor within maxShift
        const halfWidth = clueRect.width / 2;
        const minX = halfWidth + 8;
        const maxX = Math.max(minX, window.innerWidth - halfWidth - 8);

        const maxShift = 80; // px, adjust to taste
        const desiredX = anchorCenterX;
        const leftLimit = Math.max(minX, desiredX - maxShift);
        const rightLimit = Math.min(maxX, desiredX + maxShift);

        // Prefer to position tooltip centered over anchor, but clamp its left edge to the viewport so it never goes off-screen
        let left = anchorCenterX - clueRect.width / 2;
        const minLeft = 8;
        const maxLeft = Math.max(minLeft, window.innerWidth - clueRect.width - 8);
        left = Math.min(maxLeft, Math.max(minLeft, left));
        let x = left + halfWidth;

        // Calculate Y: attach to top of anchor when possible
        let y;
        if (side === 'top') {
          // bottom edge of the tooltip should be 8px above anchor
          let bottomY = anchorRect.top - 8;
          // ensure tooltip top doesn't go beyond viewport; if it does and there's more space below, flip
          const topEdge = bottomY - clueRect.height;
          if (topEdge < 8) {
            // try flipping if bottom has more room to show full tooltip
            if (availableBelow >= clueRect.height + 16) {
              side = 'bottom';
              y = anchorRect.bottom + 8;
            } else {
              // keep it on top but clamp by reducing maxHeight (already applied) and position so top is at 8
              bottomY = clueRect.height + 8;
              y = bottomY;
            }
          } else {
            y = bottomY;
          }
        } else {
          // bottom
          y = anchorRect.bottom + 8;
        }

        // Arrow offset inside the clue box — allow it to come closer to the edge for small anchors
        let arrowOffset = anchorCenterX - (x - clueRect.width / 2);
        const minOffset = 8; // allow arrow to be closer to edge for small header buttons
        const maxOffset = Math.max(minOffset, clueRect.width - 8);
        if (arrowOffset < minOffset) arrowOffset = minOffset;
        if (arrowOffset > maxOffset) arrowOffset = maxOffset;

        // Ensure tooltip stays within viewport horizontally (snap to edge if necessary)
        left = Math.min(window.innerWidth - clueRect.width - 8, Math.max(8, anchorCenterX - clueRect.width / 2));
        const xFinal = left + halfWidth;
        // Recompute arrow offset after horizontal clamp
        arrowOffset = anchorCenterX - (xFinal - clueRect.width / 2);
        if (arrowOffset < minOffset) arrowOffset = minOffset;
        if (arrowOffset > maxOffset) arrowOffset = maxOffset;

        posRef.current = { left, x: xFinal, y, side, arrowOffset, maxHeight };
        setPos(posRef.current);
      };

      // Lightweight scroll handler: only update vertical position and arrow offset to avoid horizontal jumps
      const computeYOnly = () => {
        const anchor = buttonRef.current;
        if (!anchor || !clueRef.current) return;
        const anchorRect = anchor.getBoundingClientRect();
        const clueEl = clueRef.current;
        let clueRect = clueEl.getBoundingClientRect();

        const anchorCenterX = anchorRect.left + anchorRect.width / 2;

        // Recompute side preference but keep horizontal x fixed
        const availableAbove = anchorRect.top;
        const availableBelow = window.innerHeight - anchorRect.bottom;
        let side = posRef.current && posRef.current.side ? posRef.current.side : 'top';

        if (side === 'top') {
          if (availableAbove >= clueRect.height + 16) {
            side = 'top';
          } else if (availableBelow >= clueRect.height + 16) {
            side = 'bottom';
          }
        }

        let y = side === 'top' ? anchorRect.top - 8 : anchorRect.bottom + 8;
        if (side === 'top') {
          const topEdge = y - clueRect.height;
          if (topEdge < 8) {
            if (availableBelow >= clueRect.height + 16) {
              side = 'bottom';
              y = anchorRect.bottom + 8;
            } else {
              y = clueRect.height + 8;
            }
          }
        }

        // Recompute arrow offset but keep horizontal left unchanged
        const prevLeft = posRef.current ? posRef.current.left : (anchorCenterX - clueRect.width / 2);
        let arrowOffset = anchorCenterX - prevLeft;
        const minOffset = 8;
        const maxOffset = Math.max(minOffset, clueRect.width - 8);
        if (arrowOffset < minOffset) arrowOffset = minOffset;
        if (arrowOffset > maxOffset) arrowOffset = maxOffset;

        const newPos = { ...(posRef.current || {}), y, side, arrowOffset };
        posRef.current = newPos;
        setPos(newPos);
      };

      // Initial compute and listeners
      compute();
      window.addEventListener('resize', compute);
      window.addEventListener('scroll', computeYOnly, true);
      return () => {
        window.removeEventListener('resize', compute);
        window.removeEventListener('scroll', computeYOnly, true);
      };
    }, [clueId]);

    // Nothing server-side
    if (typeof document === 'undefined') return null;

    const arrowClassMap = { top: 'arrow-down', bottom: 'arrow-up', left: 'arrow-right', right: 'arrow-left' };
    const arrowClass = arrowClassMap[pos.side] || 'arrow-down';
    const clueNumber = clueId.startsWith('col-') ? clueId.split('-')[1] : clueId.split('-')[1];
    // Normalize language codes (accept FR, fr, french, العربية, arabic, etc.)
    const normalizeLang = (l) => {
      if (!l) return '';
      const s = String(l).trim();
      const up = s.toUpperCase();
      if (up === 'FR' || up.startsWith('F') || up === 'FRENCH' || up === 'FRANCAIS' || up === 'FRANÇAIS') return 'FR';
      if (up === 'AR' || up.startsWith('A') || up === 'ARABIC' || s === 'العربية') return 'AR';
      return up;
    };
    const clueLang = normalizeLang(puzzle && puzzle.language ? puzzle.language : language);

    return createPortal(
      <div
        ref={clueRef}
        className={`floating-clue ${arrowClass} ${clueLang === 'AR' ? 'rtl' : ''}`}
        dir={clueLang === 'AR' ? 'rtl' : 'ltr'}
        data-visible="true"
        style={{
          position: 'fixed',
          left: `${pos.left}px`,
          top: `${pos.y}px`,
          transform: pos.side === 'top' ? 'translateY(-100%)' : 'translateY(0)',
          zIndex: 9999,
          maxWidth: 'min(90vw, 520px)',
          maxHeight: pos.maxHeight ? `${pos.maxHeight}px` : undefined,
          overflowY: 'auto',
          '--arrow-left': pos.side === 'top' || pos.side === 'bottom' ? `${pos.arrowOffset}px` : undefined,
          '--arrow-top': pos.side === 'left' || pos.side === 'right' ? `${pos.arrowOffset}px` : undefined,
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
          aria-label={loc('close')}
          title={loc('close')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" /><path d="M6 6l12 12" />
          </svg>
        </button>
        <div>
          <div className="clue-badge">{loc('clue')} {clueNumber}</div>
          <div className={`clue-body ${clueLang === 'AR' ? 'font-arabic' : ''}`}>{clue}</div>
        </div>
      </div>,
      document.body
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
        {loc('time_label')}: {mm}:{ss} {isPaused && `(${loc('pause_text')})`}
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
        <p className="text-gray-500">{loc('loading_grid')}</p>
      </div>
    );
  }

  const handleHeaderHover = useCallback((kind, number) => {
    const ok = canOpenClueOnHover() || (typeof window !== 'undefined' && window.__DEBUG_SHOW_HOVER);
    // eslint-disable-next-line no-console
    console.debug('[ClueHover] hovering', { kind, number, ok });
    if (!ok) return;
    const id = kind === 'col' ? `col-${number}` : `row-${number}`;
    openClueHover(id);
  }, [canOpenClueOnHover, openClueHover]);

  // Normalized puzzle language for header and UI
  const puzzleLang = normalizeLang(puzzle && puzzle.language ? puzzle.language : language);

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
          <span>{loc('grid_label')} {numRows} × {numCols}</span>
          <span className="mr-2">| الصعوبة : </span>
          <span className="ml-2">{loc(`difficulty.${puzzle.difficulty === 'easy' ? 'easy' : puzzle.difficulty === 'medium' ? 'medium' : 'hard'}`)}</span>
          <span className="mr-1">| اللغة : </span>
          <span className="ml-4 font-semibold">{puzzleLang === 'FR' ? loc('french') : puzzleLang === 'AR' ? loc('arabic') : puzzle.language}</span>
        </div>

      </div>

      <div className="flex justify-center mb-4">
        <div ref={scrollRef} className={`w-full grid-scroll-container flex ${isOverflowing ? 'justify-start' : 'justify-center'}`}>
          <div className="w-auto">
            <div className="player-grid-force-ltr" dir="ltr" style={{ direction: 'ltr', width: 'max-content' }}>
              {/* Top header row */}
              <div className="flex items-center">
                { /* Render blank corner either left or right depending on puzzleLang */ }
                {puzzleLang !== 'AR' && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
                )}

                {/* Column headers — reverse order for Arabic (render right-to-left numbering) */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`, gap: '0.125rem' }}>
                  {(() => {
                    const indices = Array.from({ length: numCols }).map((_, i) => i);
                    const renderOrder = puzzleLang === 'AR' ? indices.slice().reverse() : indices;
                    return renderOrder.map((colIndex) => {
                      const colNumber = colIndex + 1; // display number (1..numCols)
                      const hasClue = puzzle.cluesVertical && puzzle.cluesVertical[colNumber];
                      const clueId = `col-${colNumber}`;
                      const isActive = visibleClueId === clueId;

                      return (
                        <div
                          key={`col-head-${colIndex}`}
                          className="clue-wrapper"
                          style={{ position: 'relative', zIndex: isActive ? 9998 : undefined }}
                          onMouseEnter={() => (!isTouchDevice && typeof handleHeaderHover === 'function' ? handleHeaderHover('col', colNumber) : null)}
                          onMouseLeave={() => { if (!isTouchDevice) closeActiveClue(); }}
                          onPointerEnter={() => (!isTouchDevice && typeof handleHeaderHover === 'function' ? handleHeaderHover('col', colNumber) : null)}
                          onPointerLeave={() => { if (!isTouchDevice) closeActiveClue(); }}
                        >
                          <button
                            ref={(el) => { anchorRefs.current[clueId] = el; }}
                            className={`clue-anchor flex items-center justify-center text-xs text-gray-700 bg-gray-100/40 rounded-sm p-1 h-8 w-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-2 transition-colors ${hasClue ? `cursor-pointer ${isTouchDevice ? (selectedWord && selectedWord.number === colNumber && selectedWord.direction === 'vertical' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50') : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700'}` : 'border-gray-300 opacity-30 cursor-not-allowed'}`}
                            aria-label={`${loc('clue')} ${loc('column')} ${colNumber}`}
                            aria-expanded={isActive}
                            onClick={() => {
                              if (!hasClue) return;
                              const word = { number: colNumber, startRow: 0, startCol: colIndex, length: numRows, direction: 'vertical', clue: puzzle.cluesVertical[colNumber] };
                              selectWord(word, false);
                              onWordSelect?.(word);
                              // On touch devices open the clue on tap (instead of hover)
                              if (isTouchDevice) openClueUser(clueId);
                            }}
                          >
                            <span className="col-number">{colNumber}</span>
                          </button>
                          {isActive && hasClue && (
                            <ClueTooltip 
                              clueId={clueId}
                              clue={puzzle.cluesVertical[colNumber]}
                              buttonRef={{ current: anchorRefs.current[clueId] }}
                              onClose={() => {
                                if (persistentClueId === clueId) {
                                  closeClueUser({ force: true });
                                } else {
                                  closeClueHover();
                                }
                                selectWord(null);
                                onWordSelect?.(null);
                              }}
                            />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {puzzleLang === 'AR' && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
                )}
              </div>

              {/* Body row: row headers + cells */}
              <div style={{ display: 'flex' }}>
                {puzzleLang === 'AR' ? (
                  <>
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
                              // Pass the normalized puzzle language to the cell so validation and clue direction are puzzle-specific
                              language={normalizeLang(puzzle && puzzle.language ? puzzle.language : language)}
                              cellNumber={null}
                              selectedWord={selectedWord}
                              isTouchDevice={isTouchDevice}
                              row={rowIndex}
                              col={colIndex}
                              getClueForNumber={(r, c) => {
                                const rowNumber = r + 1;
                                const colNumber = c + 1;
                                const hasRowClue = puzzle.cluesHorizontal && puzzle.cluesHorizontal[rowNumber];
                                const hasColClue = puzzle.cluesVertical && puzzle.cluesVertical[colNumber];
                                if (hasRowClue && (!hasColClue || c === 0)) return puzzle.cluesHorizontal[rowNumber];
                                if (hasColClue) return puzzle.cluesVertical[colNumber];
                                return '';
                              }}
                              canOpenClueOnHover={canOpenClueOnHover}
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
                                  if (isTouchDevice) openClueUser(`row-${rowNumber}`);
                                } else if (hasColClue) {
                                  const word = { number: colNumber, startRow: 0, startCol: c, length: puzzle.rows || (currentGrid?.length || 0), direction: 'vertical', clue: puzzle.cluesVertical[colNumber] };
                                  if (selectedWord && selectedWord.number === word.number && selectedWord.direction === 'vertical') {
                                    selectWord(null);
                                    onWordSelect?.(null);
                                  } else {
                                    selectWord(word);
                                    onWordSelect?.(word);
                                  }
                                  if (isTouchDevice) openClueUser(`col-${colNumber}`);
                                }
                              }}
                              onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                              onMouseLeave={() => handleCellMouseLeave(rowIndex, colIndex)}
                              className={`${invalidInput ? 'animate-shake' : ''}`}
                            />
                           );
                         });
                       })}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                      {Array.from({ length: numRows }).map((_, rowIndex) => {
                        const rowNumber = rowIndex + 1;
                        const hasRowClue = puzzle.cluesHorizontal && puzzle.cluesHorizontal[rowNumber];
                        const clueId = `row-${rowNumber}`;
                        const isActive = visibleClueId === clueId;

                        return (
                          <div
                            key={`row-head-${rowIndex}`}
                            className="clue-wrapper"
                            style={{ position: 'relative', zIndex: isActive ? 9998 : undefined }}
                            onMouseEnter={() => (!isTouchDevice && typeof handleHeaderHover === 'function' ? handleHeaderHover('row', rowNumber) : null)}
                            onMouseLeave={() => { if (!isTouchDevice) closeActiveClue(); }}
                            onPointerEnter={() => (!isTouchDevice && typeof handleHeaderHover === 'function' ? handleHeaderHover('row', rowNumber) : null)}
                            onPointerLeave={() => { if (!isTouchDevice) closeActiveClue(); }}
                          >
                            <button
                              ref={(el) => { anchorRefs.current[clueId] = el; }}
                              className={`clue-anchor flex items-center justify-center text-xs text-gray-700 bg-gray-100/40 rounded-sm p-1 h-8 w-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-2 transition-colors ${hasRowClue ? `cursor-pointer ${isTouchDevice ? (selectedWord && selectedWord.number === rowNumber && selectedWord.direction === 'horizontal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50') : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700'}` : 'border-gray-300 opacity-30 cursor-not-allowed'}`}
                              aria-label={`${loc('clue')} ${loc('row')} ${rowNumber}`}
                              aria-expanded={isActive}
                              onClick={() => {
                                if (!hasRowClue) return;
                                const word = { number: rowNumber, startRow: rowIndex, startCol: 0, length: numCols, direction: 'horizontal', clue: puzzle.cluesHorizontal[rowNumber] };
                                selectWord(word, false);
                                onWordSelect?.(word);
                                // On touch devices open the clue on tap (instead of hover)
                                if (isTouchDevice) openClueUser(clueId);
                              }}
                            >
                              <span className="row-number">{hasRowClue ? rowNumber : ''}</span>
                            </button>
                            {isActive && hasRowClue && (
                              <ClueTooltip 
                                clueId={clueId}
                                clue={puzzle.cluesHorizontal[rowNumber]}
                                buttonRef={{ current: anchorRefs.current[clueId] }}
                                onClose={() => {
                                  if (persistentClueId === clueId) {
                                    closeClueUser({ force: true });
                                  } else {
                                    closeClueHover();
                                  }
                                  selectWord(null);
                                  onWordSelect?.(null);
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                      {Array.from({ length: numRows }).map((_, rowIndex) => {
                        const rowNumber = rowIndex + 1;
                        const hasRowClue = puzzle.cluesHorizontal && puzzle.cluesHorizontal[rowNumber];
                        const clueId = `row-${rowNumber}`;
                        const isActive = visibleClueId === clueId;
                        
                        return (
                          <div
                            key={`row-head-${rowIndex}`}
                            className="clue-wrapper"
                            style={{ position: 'relative', zIndex: isActive ? 9998 : undefined }}
                            onMouseEnter={() => (!isTouchDevice && typeof handleHeaderHover === 'function' ? handleHeaderHover('row', rowNumber) : null)}
                            onMouseLeave={() => { if (!isTouchDevice) closeActiveClue(); }}
                            onPointerEnter={() => (!isTouchDevice && typeof handleHeaderHover === 'function' ? handleHeaderHover('row', rowNumber) : null)}
                            onPointerLeave={() => { if (!isTouchDevice) closeActiveClue(); }}
                          >
                            <button
                              ref={(el) => { anchorRefs.current[clueId] = el; }}
                              className={`clue-anchor flex items-center justify-center text-xs text-gray-700 bg-gray-100/40 rounded-sm p-1 h-8 w-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-2 transition-colors ${hasRowClue ? `cursor-pointer ${isTouchDevice ? (selectedWord && selectedWord.number === rowNumber && selectedWord.direction === 'horizontal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50') : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700'}` : 'border-gray-300 opacity-30 cursor-not-allowed'}`}
                              aria-label={`${loc('clue')} ${loc('row')} ${rowNumber}`}
                              aria-expanded={isActive}
                              onClick={() => {
                                if (!hasRowClue) return;
                                const word = { number: rowNumber, startRow: rowIndex, startCol: 0, length: numCols, direction: 'horizontal', clue: puzzle.cluesHorizontal[rowNumber] };
                                selectWord(word, false);
                                onWordSelect?.(word);
                                // On touch devices open the clue on tap (instead of hover)
                                if (isTouchDevice) openClueUser(clueId);
                              }}
                            >
                              <span className="row-number">{hasRowClue ? rowNumber : ''}</span>
                            </button>
                            {isActive && hasRowClue && (
                              <ClueTooltip 
                                clueId={clueId}
                                clue={puzzle.cluesHorizontal[rowNumber]}
                                buttonRef={{ current: anchorRefs.current[clueId] }}
                                onClose={() => {
                                  if (persistentClueId === clueId) {
                                    closeClueUser({ force: true });
                                  } else {
                                    closeClueHover();
                                  }
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
                              // Pass the normalized puzzle language to the cell so validation and clue direction are puzzle-specific
                              language={normalizeLang(puzzle && puzzle.language ? puzzle.language : language)}
                              cellNumber={null}
                              selectedWord={selectedWord}
                              isTouchDevice={isTouchDevice}
                              row={rowIndex}
                              col={colIndex}
                              getClueForNumber={(r, c) => {
                                const rowNumber = r + 1;
                                const colNumber = c + 1;
                                const hasRowClue = puzzle.cluesHorizontal && puzzle.cluesHorizontal[rowNumber];
                                const hasColClue = puzzle.cluesVertical && puzzle.cluesVertical[colNumber];
                                if (hasRowClue && (!hasColClue || c === 0)) return puzzle.cluesHorizontal[rowNumber];
                                if (hasColClue) return puzzle.cluesVertical[colNumber];
                                return '';
                              }}
                              canOpenClueOnHover={canOpenClueOnHover}
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
                                  if (isTouchDevice) openClueUser(`row-${rowNumber}`);
                                } else if (hasColClue) {
                                  const word = { number: colNumber, startRow: 0, startCol: c, length: puzzle.rows || (currentGrid?.length || 0), direction: 'vertical', clue: puzzle.cluesVertical[colNumber] };
                                  if (selectedWord && selectedWord.number === word.number && selectedWord.direction === 'vertical') {
                                    selectWord(null);
                                    onWordSelect?.(null);
                                  } else {
                                    selectWord(word);
                                    onWordSelect?.(word);
                                  }
                                  if (isTouchDevice) openClueUser(`col-${colNumber}`);
                                }
                              }}
                              onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                              onMouseLeave={() => handleCellMouseLeave(rowIndex, colIndex)}
                              className={`${invalidInput ? 'animate-shake' : ''}`}
                            />
                           );
                         });
                       })}
                     </div>
                  </>
                )}
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
            title={isPaused ? loc('resume') : loc('pause')}
          >
            {isPaused ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon fill="currentColor" points="10,8 16,12 10,16"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="10" y1="15" x2="10" y2="9"/>
                <line x1="14" y1="15" x2="14" y2="9"/>
              </svg>
            )}
          </button>
          
          <button
            onClick={handleResetTimer}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title={loc('reset_timer')}
          >
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <circle cx="12" cy="13" r="8"/>
            <path d="m12 9-2 3h4l-2-3"/>
            <path d="M12 7V2m0 0L9 5m3-3 3 3"/>
          </svg>
          
          <TimerDisplay getElapsedTime={getElapsedTime} isPaused={isPaused} />
        </div>
        
        {/* Navigation Controls */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-gray-600 font-medium">{loc('auto_nav_title')}</div>
          <div className="text-xs text-gray-500 text-center">{loc('auto_direction_help')}</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPreferredDirection('up')}
               className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                 preferredDirection === 'up' 
                   ? 'bg-green-500 hover:bg-green-600 text-white' 
                   : 'bg-blue-500 hover:bg-blue-600 text-white'
               }`}
               disabled={!selectedCell}
               title={loc('dir_up')}
             >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m18 15-6-6-6 6"/>
              </svg>
            </button>
            <button
              onClick={() => setPreferredDirection('left')}
               className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                 preferredDirection === 'left' 
                   ? 'bg-green-500 hover:bg-green-600 text-white' 
                   : 'bg-blue-500 hover:bg-blue-600 text-white'
               }`}
               disabled={!selectedCell}
               title={loc('dir_left')}
             >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <button
              onClick={() => setPreferredDirection('down')}
               className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                 preferredDirection === 'down' 
                   ? 'bg-green-500 hover:bg-green-600 text-white' 
                   : 'bg-blue-500 hover:bg-blue-600 text-white'
               }`}
               disabled={!selectedCell}
               title={loc('dir_down')}
             >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            <button
              onClick={() => setPreferredDirection('right')}
               className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                 preferredDirection === 'right' 
                   ? 'bg-green-500 hover:bg-green-600 text-white' 
                   : 'bg-blue-500 hover:bg-blue-600 text-white'
               }`}
               disabled={!selectedCell}
               title={loc('dir_right')}
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
            title={loc('reset_game_title')}
          >
            🔄 {loc('reset_game_label')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(CrosswordGrid);
