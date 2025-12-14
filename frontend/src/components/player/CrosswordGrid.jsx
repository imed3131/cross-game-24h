import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const [cellRefs, setCellRefs] = useState({});
  const [hoveredCell, setHoveredCell] = useState({ row: -1, col: -1 });
  const [currentTime, setCurrentTime] = useState(0);
  // Update timer every second - use state callback to avoid function dependency

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getElapsedTime());
    }, 1000);
    setCurrentTime(getElapsedTime());
    return () => clearInterval(interval);
  }, [getElapsedTime]);

  // Update timer immediately after reset
  const handleResetTimer = () => {
    resetTimer();
    setCurrentTime(0);
  };

  // Handle cell value changes
  const handleCellChange = useCallback((value, row, col) => {
    if (!puzzle || !currentGrid) return;
    updateGridCell(row, col, value);
  }, [puzzle, currentGrid, updateGridCell]);

  // Handle navigation between cells
  const handleCellNavigation = useCallback((direction, currentRow, currentCol) => {
    if (!puzzle) return;

    let newRow = currentRow;
    let newCol = currentCol;

    switch (direction) {
      case 'next':
      case 'right':
        if (currentCol < (puzzle.cols || currentGrid[0]?.length || 0) - 1) {
          newCol = currentCol + 1;
        } else if (currentRow < (puzzle.rows || currentGrid?.length || 0) - 1) {
          newRow = currentRow + 1;
          newCol = 0;
        }
        break;
      case 'previous':
      case 'left':
        if (currentCol > 0) {
          newCol = currentCol - 1;
        } else if (currentRow > 0) {
          newRow = currentRow - 1;
          newCol = (puzzle.cols || currentGrid[0]?.length || 0) - 1;
        }
        break;
      case 'up':
        if (currentRow > 0) {
          newRow = currentRow - 1;
        }
        break;
      case 'down':
        if (currentRow < (puzzle.rows || currentGrid?.length || 0) - 1) {
          newRow = currentRow + 1;
        }
        break;
    }

    // Skip black cells
    while (newRow >= 0 && newRow < (puzzle.rows || currentGrid?.length || 0) &&
           newCol >= 0 && newCol < (puzzle.cols || currentGrid[0]?.length || 0) &&
           (puzzle.solution?.[newRow]?.[newCol] === '' || puzzle.solution?.[newRow]?.[newCol] === '#')) {
      
      if (direction === 'next' || direction === 'right') {
        if (newCol < (puzzle.cols || currentGrid[0]?.length || 0) - 1) {
          newCol++;
        } else if (newRow < (puzzle.rows || currentGrid?.length || 0) - 1) {
          newRow++;
          newCol = 0;
        } else {
          break;
        }
      } else if (direction === 'previous' || direction === 'left') {
        if (newCol > 0) {
          newCol--;
        } else if (newRow > 0) {
          newRow--;
          newCol = (puzzle.cols || currentGrid[0]?.length || 0) - 1;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    selectCell(newRow, newCol);
  }, [puzzle, currentGrid, selectCell]);

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
  const isRTLLanguage = language === 'AR';

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

  const gridSize = puzzle?.gridSize || currentGrid?.length || 0;
  // Always render grid LTR, even for Arabic
  const isRTL = false;

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
      style={{ direction: 'ltr' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >

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
          className="grid gap-0.5 sm:gap-1 player-grid-force-ltr"
          dir="ltr"
          style={{ 
            direction: 'ltr',
            gridTemplateColumns: `repeat(${puzzle.cols || gridSize}, minmax(0, 1fr))`
          }}
        >
            {currentGrid?.map((row, rowIndex) => {
              if (!Array.isArray(row)) return null;
              return row.map((cell, colIndex) => {
                const isBlackCell = puzzle.solution?.[rowIndex]?.[colIndex] === '' || puzzle.solution?.[rowIndex]?.[colIndex] === '#';
                const isSelected = isCellSelected(rowIndex, colIndex);
                const isHovered = isCellHovered(rowIndex, colIndex);
                const cellNumber = getCellNumber(rowIndex, colIndex);
                const cellKey = `${rowIndex}-${colIndex}`;

                return (
                  <CrosswordCell
                    key={cellKey}
                    value={cell || ''}
                    onChange={handleCellChange}
                    onNavigate={handleCellNavigation}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    isBlackCell={isBlackCell}
                    language={language}
                    cellNumber={cellNumber}
                    row={rowIndex}
                    col={colIndex}
                    onClick={handleCellClick}
                    onMouseEnter={handleCellMouseEnter}
                    onMouseLeave={handleCellMouseLeave}
                    className={`
                      ${invalidInput ? 'animate-shake' : ''}
                    `}
                  />
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
