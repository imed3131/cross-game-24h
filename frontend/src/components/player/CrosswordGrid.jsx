import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrosswordGame } from '../../hooks/useCrosswordGame';

const CrosswordGrid = ({ puzzle, onCellSelect, onWordSelect, resetGame: externalResetGame, preventMobileFocus: externalPreventMobileFocus = false, className = '' }) => {
  const {
    currentGrid,
    selectedCell,
    selectedWord,
    highlightedCells,
    handleKeyInput,
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
  const mobileInputRef = useRef(null);
  const [cellRefs, setCellRefs] = useState({});
  const [hoveredCell, setHoveredCell] = useState({ row: -1, col: -1 });
  const [currentTime, setCurrentTime] = useState(0);
  const [localHighlightedCells, setLocalHighlightedCells] = useState([]);
  // Handle keyboard events - DESKTOP ONLY (mobile uses hidden input field)
  useEffect(() => {
    const handleDocumentKeyDown = (e) => {
      // Skip if mobile device to prevent duplicate input processing
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      if (isMobile) return;
      
      if (selectedCell.row !== -1 && selectedCell.col !== -1) {
        handleKeyInput(e.key);
      }
    };

    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => document.removeEventListener('keydown', handleDocumentKeyDown);
  }, [selectedCell.row, selectedCell.col, handleKeyInput]);

  // Auto-focus grid when cell is selected
  useEffect(() => {
    if (selectedCell.row !== -1 && selectedCell.col !== -1) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      
      if (isMobile && !externalPreventMobileFocus && mobileInputRef.current) {
        // Simple mobile focus without aggressive re-focusing
        setTimeout(() => {
          if (mobileInputRef.current) {
            mobileInputRef.current.value = ''; // Clear first
            mobileInputRef.current.focus({ preventScroll: true });
          }
        }, 100);
      }
    }
  }, [selectedCell.row, selectedCell.col, externalPreventMobileFocus]);

  // Update timer every second - use state callback to avoid function dependency
  useEffect(() => {
    const interval = setInterval(() => {
      // Use callback pattern to access current getElapsedTime without dependency
      setCurrentTime(() => getElapsedTime());
    }, 1000);

    // Initial update
    setCurrentTime(getElapsedTime());

    return () => clearInterval(interval);
  }, []); // Safe empty dependency - getElapsedTime accessed in callback

  const handleCellClick = (row, col) => {
    if (!puzzle || !currentGrid) return; // Guard clause instead of early return
    const cell = currentGrid[row][col];
    
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
        length: puzzle.cols || currentGrid[0]?.length || 15,
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
        length: puzzle.rows || currentGrid?.length || 15,
        direction: 'vertical'
      });
    }
    
    if (intersecting.length > 0) {
      // If same cell is clicked again, cycle through intersecting words
      if (selectedCell.row === row && selectedCell.col === col && intersecting.length > 1) {
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
        const word = { ...intersecting[0], direction: intersecting[0].direction || (intersecting[0].startRow === row ? 'horizontal' : 'vertical') };
        selectWord(word);
        onWordSelect?.(word);
      }
    }
  };

  const handleCellMouseEnter = (row, col) => {
    setHoveredCell({ row, col });
  };

  const handleCellMouseLeave = () => {
    setHoveredCell({ row: -1, col: -1 });
  };

  // Effect to update local highlighting when selectedWord changes
  useEffect(() => {
    if (!selectedWord || !puzzle) {
      setLocalHighlightedCells([]);
      return;
    }

    const positions = [];
    const { direction, number } = selectedWord;
    // Use stable puzzle dimensions instead of currentGrid
    const gridRows = puzzle.rows || 10;
    const gridCols = puzzle.cols || 10;

    if (direction === 'horizontal') {
      // Highlight entire row
      const targetRow = number - 1;
      if (targetRow >= 0 && targetRow < gridRows) {
        for (let col = 0; col < gridCols; col++) {
          positions.push({ row: targetRow, col });
        }
      }
    } else if (direction === 'vertical') {
      // Highlight entire column
      const targetCol = number - 1;
      if (targetCol >= 0 && targetCol < gridCols) {
        for (let row = 0; row < gridRows; row++) {
          positions.push({ row, col: targetCol });
        }
      }
    }

    setLocalHighlightedCells(positions);
  }, [selectedWord, puzzle?.rows, puzzle?.cols]);

  const isCellHighlighted = (row, col) => {
    return localHighlightedCells && localHighlightedCells.some(cell => cell && cell.row === row && cell.col === col);
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
    
    // For RTL (Arabic), show numbers on the right side and bottom
    // For LTR (French), show numbers on the left side and top
    const isRTLLanguage = language === 'AR';
    
    // Show row numbers on the appropriate side
    const showRowNumber = isRTLLanguage ? 
      (col === puzzle.cols - 1) : // Right side for Arabic
      (col === 0);                // Left side for French
      
    // Show column numbers on the appropriate side  
    const showColNumber = isRTLLanguage ?
      (row === puzzle.rows - 1) : // Bottom for Arabic
      (row === 0);                // Top for French
    
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

  const gridSize = puzzle?.gridSize || currentGrid?.length || 0;
  const isRTL = language === 'AR';

  // Conditional rendering AFTER all hooks have been called
  if (!puzzle) {
    return (
      <div className="grid gap-1 p-4 bg-white rounded-2xl shadow-lg">
        <p className="text-gray-500">No puzzle loaded</p>
      </div>
    );
  }

  return (
    <motion.div
      ref={gridRef}
      className={`p-2 sm:p-3 lg:p-4 bg-white rounded-xl lg:rounded-2xl shadow-lg ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* 
        Hidden input for mobile keyboard - positioned off-screen
        
        INPUT HANDLING STRATEGY:
        - MOBILE: Uses this hidden input field with onInput event only
        - DESKTOP: Uses global document keydown listener only  
        - This prevents duplicate processing of the same keystroke
        - Mobile keyboards can fire multiple events (keydown + input) for one keystroke
        - By separating mobile/desktop handling, each character is processed exactly once
      */}
      <input
        ref={mobileInputRef}
        type="text"
        className="absolute -left-[9999px] opacity-0 pointer-events-none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        inputMode="text"
        onInput={(e) => {
          // MOBILE INPUT ONLY - Desktop uses global keyboard listener
          e.preventDefault();
          e.stopPropagation();
          
          if (selectedCell.row !== -1 && selectedCell.col !== -1) {
            const value = e.target.value;
            if (value) {
              const char = value.charAt(0); // Take only first character
              if (char && char.match(/[a-zA-ZÀ-ÿ]/)) {
                handleKeyInput(char);
              }
            }
          }
          
          // Always clear input immediately
          e.target.value = '';
        }}
        onKeyDown={(e) => {
          // Prevent mobile keyboard events from bubbling to document listener
          e.preventDefault();
          e.stopPropagation();
        }}
        onFocus={() => {
          // Clear on focus to prevent old values
          if (mobileInputRef.current) {
            mobileInputRef.current.value = '';
          }
        }}
        onBlur={() => {
          // Clear on blur as well
          if (mobileInputRef.current) {
            mobileInputRef.current.value = '';
          }
        }}
        value="" // Always keep empty
      />
      {/* Display puzzle info */}
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-bold text-center mb-1 sm:mb-2">{puzzle.title}</h3>
        <div className="text-xs sm:text-sm text-gray-600 text-center">
          <span>Grille {puzzle.rows} × {puzzle.cols}</span>
          <span className="ml-4">Difficulté: {puzzle.difficulty === 'easy' ? 'Facile' : puzzle.difficulty === 'medium' ? 'Moyen' : 'Difficile'}</span>
        </div>
      </div>

      {/* Grid without numbered rows and columns */}
      <div className="flex justify-center mb-4">
        {/* Crossword grid */}
        <div 
          className="grid gap-0.5 sm:gap-1"
          style={{ 
            gridTemplateColumns: `repeat(${puzzle.cols || gridSize}, minmax(0, 1fr))`
          }}
        >
            {currentGrid?.map((row, rowIndex) => {
              if (!Array.isArray(row)) return null;
              return row.map((cell, colIndex) => {
                const isBlackCell = puzzle.solution?.[rowIndex]?.[colIndex] === '' || puzzle.solution?.[rowIndex]?.[colIndex] === '#';
                const isSelected = isCellSelected(rowIndex, colIndex);
                const isHighlighted = isCellHighlighted(rowIndex, colIndex);
                const isHovered = isCellHovered(rowIndex, colIndex);
                const cellNumber = getCellNumber(rowIndex, colIndex);
                const cellKey = `${rowIndex}-${colIndex}`;

                return (
                  <motion.div
                    key={cellKey}
                    ref={(el) => {
                      if (el) {
                        setCellRefs(prev => ({ ...prev, [cellKey]: el }));
                      }
                    }}
                    className={`
                      relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 border-2 cursor-pointer font-bold text-sm sm:text-base md:text-lg lg:text-xl
                      flex items-center justify-center transition-all duration-200 rounded-sm sm:rounded-md
                      ${isBlackCell 
                        ? 'bg-black border-black' 
                        : `bg-white border-gray-400 hover:border-primary-400 shadow-sm
                           ${isSelected ? 'border-primary-600 bg-primary-50 shadow-md' : ''}
                           ${isHighlighted ? 'bg-yellow-50 border-yellow-300' : ''}
                           ${isHovered ? 'bg-gray-100' : ''}
                           ${invalidInput ? 'animate-shake border-red-500' : ''}`
                      }
                    `}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                    onMouseLeave={handleCellMouseLeave}
                    whileHover={{ scale: isBlackCell ? 1 : 1.05 }}
                    whileTap={{ scale: isBlackCell ? 1 : 0.95 }}
                  >
                    {/* Cell number */}
                    {cellNumber && (
                      <span className="absolute top-0 left-0 text-xs font-bold text-primary-600 leading-none p-0.5">
                        {cellNumber}
                      </span>
                    )}
                    
                    {/* Cell content */}
                    {!isBlackCell && (
                      <AnimatePresence mode="wait">
                        {cell && (
                          <motion.span
                            key={cell}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', duration: 0.2 }}
                            className={`text-center font-bold ${language === 'AR' ? 'font-arabic' : ''}`}
                            style={{
                              direction: language === 'AR' ? 'rtl' : 'ltr',
                              unicodeBidi: 'plaintext'
                            }}
                          >
                            {cell}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    )}
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 bg-primary-200 opacity-20 rounded"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.2 }}
                      />
                    )}
                    
                    {/* Word highlight */}
                    {isHighlighted && !isSelected && (
                      <motion.div
                        className="absolute inset-0 bg-yellow-100 opacity-40 rounded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.div>
                );
              });
            })}
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
            onClick={resetTimer}
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
