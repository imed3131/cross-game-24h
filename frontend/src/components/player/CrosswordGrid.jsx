import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrosswordGame } from '../../hooks/useCrosswordGame';

const CrosswordGrid = ({ puzzle, onCellSelect, onWordSelect, className = '' }) => {
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
  const [cellRefs, setCellRefs] = useState({});
  const [hoveredCell, setHoveredCell] = useState({ row: -1, col: -1 });
  const [currentTime, setCurrentTime] = useState(0);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedCell.row !== -1 && selectedCell.col !== -1) {
        handleKeyInput(e.key);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, handleKeyInput]);

  // Auto-focus grid when cell is selected
  useEffect(() => {
    if (selectedCell.row !== -1 && selectedCell.col !== -1) {
      const cellKey = `${selectedCell.row}-${selectedCell.col}`;
      const cellRef = cellRefs[cellKey];
      if (cellRef) {
        cellRef.focus();
      }
    }
  }, [selectedCell, cellRefs]);

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getElapsedTime());
    }, 1000);

    // Initial update
    setCurrentTime(getElapsedTime());

    return () => clearInterval(interval);
  }, [getElapsedTime]);

  if (!puzzle) {
    return (
      <div className="grid gap-1 p-4 bg-white rounded-2xl shadow-lg">
        <p className="text-gray-500">No puzzle loaded</p>
      </div>
    );
  }

  const handleCellClick = (row, col) => {
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

  const isCellHighlighted = (row, col) => {
    return highlightedCells && Array.isArray(highlightedCells) && highlightedCells.some(cell => cell && cell.row === row && cell.col === col);
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

  // Debug logging
  console.log('CrosswordGrid Debug:');
  console.log('- currentGrid:', currentGrid, 'isArray:', Array.isArray(currentGrid), 'length:', currentGrid?.length);
  console.log('- puzzle:', puzzle);
  console.log('- puzzle.solution:', puzzle?.solution, 'isArray:', Array.isArray(puzzle?.solution));
  console.log('- puzzle.grid:', puzzle?.grid);
  console.log('- puzzle.rows:', puzzle?.rows, 'cols:', puzzle?.cols);

  // Early return if no valid grid data
  if (!currentGrid || !Array.isArray(currentGrid) || currentGrid.length === 0 || 
      !puzzle || !puzzle.solution || !Array.isArray(puzzle.solution)) {
    console.log('CrosswordGrid: Missing data, showing "Pas de partie disponible"');
    return (
      <div className="grid gap-1 p-4 bg-white rounded-2xl shadow-lg">
        <div className="text-center text-gray-500 p-8">
          Pas de partie disponible
          <br />
          <small className="text-xs">
            Debug: currentGrid={currentGrid ? 'OK' : 'MISSING'}, 
            puzzle={puzzle ? 'OK' : 'MISSING'}, 
            solution={puzzle?.solution ? 'OK' : 'MISSING'}
          </small>
        </div>
      </div>
    );
  }

  const gridSize = puzzle.gridSize || currentGrid.length;
  const isRTL = language === 'AR';

  return (
    <motion.div
      ref={gridRef}
      className={`p-4 bg-white rounded-2xl shadow-lg ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Display puzzle info */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-center mb-2">{puzzle.title}</h3>
        <div className="text-sm text-gray-600 text-center">
          <span>Grille {puzzle.rows} × {puzzle.cols}</span>
          <span className="ml-4">Difficulté: {puzzle.difficulty === 'easy' ? 'Facile' : puzzle.difficulty === 'medium' ? 'Moyen' : 'Difficile'}</span>
        </div>
      </div>

      {/* Grid without numbered rows and columns */}
      <div className="flex justify-center mb-4">
        {/* Crossword grid */}
        <div 
          className="grid gap-0.5"
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
                      relative w-14 h-14 border-2 cursor-pointer font-bold text-xl
                      flex items-center justify-center transition-all duration-200 rounded-md
                      ${isBlackCell 
                        ? 'bg-black border-black' 
                        : `bg-white border-gray-400 hover:border-primary-400 shadow-sm
                           ${isSelected ? 'border-primary-600 bg-primary-50 shadow-md' : ''}
                           ${isHighlighted ? 'bg-yellow-100 border-yellow-400' : ''}
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
                        className="absolute inset-0 bg-yellow-200 opacity-30 rounded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.div>
                );
              });
            })}
        </div>
      </div>
      
      {/* Timer Display with Pause/Play/Reset - Now outside the flex container */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
          <button
            onClick={() => isPaused ? resumeTimer() : pauseTimer()}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={isPaused ? "Reprendre" : "Pause"}
          >
            {isPaused ? (
              // Play icon
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            ) : (
              // Pause icon
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            )}
          </button>
          
          <button
            onClick={resetTimer}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Remettre à zéro"
          >
            {/* Reset icon */}
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12,6 12,12 16,14"></polyline>
          </svg>
          
          <span className={`text-sm font-medium ${isPaused ? 'text-orange-600' : 'text-gray-700'}`}>
            Temps: {(() => {
              const minutes = Math.floor(currentTime / 60);
              const seconds = currentTime % 60;
              return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            })()} {isPaused && '(Pause)'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default CrosswordGrid;
