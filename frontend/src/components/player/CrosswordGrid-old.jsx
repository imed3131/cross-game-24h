import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrosswordGame } from '../../hooks/useCrosswordGame';
import { getIntersectingWords } from '../../utils/helpers';

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
    showingSolution
  } = useCrosswordGame();

  const gridRef = useRef(null);
  const [cellRefs, setCellRefs] = useState({});
  const [hoveredCell, setHoveredCell] = useState({ row: -1, col: -1 });

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

  if (!puzzle || !currentGrid) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
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
    return highlightedCells.some(cell => cell.row === row && cell.col === col);
  };

  const isCellSelected = (row, col) => {
    return selectedCell.row === row && selectedCell.col === col;
  };

  const isCellHovered = (row, col) => {
    return hoveredCell.row === row && hoveredCell.col === col;
  };

  const getCellNumber = (row, col) => {
    // For the simplified grid system where:
    // - Horizontal clues are numbered by row (1-based)  
    // - Vertical clues are numbered by column (1-based)
    
    // Check if this position should have a number based on the grid structure
    // For now, we'll show numbers for positions that start words
    // This is a simplified version - in a full crossword, numbering would be more complex
    
    const rowNumber = row + 1; // Convert to 1-based
    const colNumber = col + 1; // Convert to 1-based
    
    // For the simplified system, show row number for leftmost cells (col 0)
    // and column number for topmost cells (row 0) 
    if (col === 0 && puzzle.cluesHorizontal && puzzle.cluesHorizontal[rowNumber]) {
      return rowNumber;
    }
    if (row === 0 && puzzle.cluesVertical && puzzle.cluesVertical[colNumber]) {
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
          Pas de parite 
        </div>
      </div>
    );
  }

  const gridSize = puzzle.gridSize || currentGrid.length;
  const isRTL = language === 'AR';

  return (
    <motion.div
      ref={gridRef}
      className={`p-4 bg-white rounded-2xl shadow-lg ${isRTL ? 'rtl' : ''} ${className}`}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Grid with numbered rows and columns */}
      <div className="flex flex-col items-center">
        {/* Column numbers header */}
        <div className="flex mb-2">
          <div className="w-8 h-8"></div> {/* Empty corner */}
          {Array.from({ length: puzzle.cols || gridSize }, (_, colIndex) => (
            <div 
              key={`col-header-${colIndex}`}
              className="w-8 h-8 flex items-center justify-center text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded"
            >
              {colIndex + 1}
            </div>
          ))}
        </div>

        {/* Main grid with row numbers */}
        <div className="flex">
          {/* Row numbers column */}
          <div className="flex flex-col mr-2">
            {Array.from({ length: puzzle.rows || gridSize }, (_, rowIndex) => (
              <div 
                key={`row-header-${rowIndex}`}
                className="w-8 h-8 flex items-center justify-center text-xs font-bold text-green-600 bg-green-50 border border-green-200 rounded mb-1"
              >
                {rowIndex + 1}
              </div>
            ))}
          </div>

          {/* Actual crossword grid */}
          <div 
            className="grid gap-1"
            style={{ 
              gridTemplateColumns: `repeat(${puzzle.cols || gridSize}, minmax(0, 1fr))`
            }}
          >
      {currentGrid?.map((row, rowIndex) => {
        if (!Array.isArray(row)) return null;
        return row.map((cell, colIndex) => {
          const isBlackCell = puzzle.solution?.[rowIndex]?.[colIndex] === '';
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
                crossword-cell cursor-pointer relative
                ${isBlackCell ? 'crossword-cell-black' : ''}
                ${isSelected ? 'crossword-cell-active ring-2 ring-primary-400' : ''}
                ${isHighlighted && !isSelected ? 'crossword-cell-highlighted' : ''}
                ${isHovered && !isSelected && !isHighlighted ? 'bg-gray-100' : ''}
                ${invalidInput && isSelected ? 'animate-shake bg-error-100 border-error-500' : ''}
                ${showingSolution ? 'bg-green-50 border-green-300' : ''}
              `}
              onClick={() => !isBlackCell && handleCellClick(rowIndex, colIndex)}
              onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
              onMouseLeave={handleCellMouseLeave}
              tabIndex={isBlackCell ? -1 : 0}
              whileHover={!isBlackCell ? { scale: 1.05 } : {}}
              whileTap={!isBlackCell ? { scale: 0.95 } : {}}
              animate={invalidInput && isSelected ? {
                x: [-2, 2, -2, 2, 0],
                transition: { duration: 0.4 }
              } : {}}
            >
              {/* Cell number */}
              {cellNumber && (
                <span className="crossword-cell-number">
                  {cellNumber}
                </span>
              )}
              
              {/* Cell content */}
              {!isBlackCell && (
                <AnimatePresence>
                  {cell && (
                    <motion.span
                      key={cell}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', duration: 0.2 }}
                      className={`text-center font-bold ${language === 'AR' ? 'font-arabic' : ''}`}
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
            {currentGrid?.map((row, rowIndex) => {
              if (!Array.isArray(row)) return null;
              return row.map((cell, colIndex) => {
                const isBlackCell = puzzle.solution?.[rowIndex]?.[colIndex] === '';
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
                      relative w-8 h-8 border-2 cursor-pointer font-bold text-sm
                      flex items-center justify-center transition-all duration-200
                      ${isBlackCell 
                        ? 'bg-gray-900 border-gray-900' 
                        : `bg-white border-gray-300 hover:border-primary-400 
                           ${isSelected ? 'border-primary-600 bg-primary-50' : ''}
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
      </div>
    </motion.div>
  );
};

export default CrosswordGrid;
