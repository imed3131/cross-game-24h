// Language validation utilities
export const validateLanguage = (text, language) => {
  if (language === 'FR') {
    // French characters (including accented characters)
    const frenchRegex = /^[A-Za-zÀ-ÿ\s]*$/;
    return frenchRegex.test(text);
  } else if (language === 'AR') {
    // Arabic characters
    const arabicRegex = /^[\u0600-\u06FF\s]*$/;
    return arabicRegex.test(text);
  }
  return false;
};

// Date utilities
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateShort = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    month: 'short',
    day: 'numeric'
  });
};

export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return today.toDateString() === checkDate.toDateString();
};

export const isSameDay = (date1, date2) => {
  return new Date(date1).toDateString() === new Date(date2).toDateString();
};

// Crossword utilities
export const createEmptyGrid = (size) => {
  return Array(size).fill().map(() => Array(size).fill(''));
};

export const isValidPosition = (row, col, gridSize) => {
  return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
};

export const getWordPositions = (clue, grid) => {
  const positions = [];
  
  if (!clue || !grid || !Array.isArray(grid) || grid.length === 0) {
    return positions;
  }
  
  const { direction, number } = clue;
  const gridRows = grid.length;
  const gridCols = grid[0]?.length || 0;
  
  if (direction === 'horizontal') {
    // Horizontal clue number corresponds to row number (1-based to 0-based)
    const targetRow = number - 1;
    
    // Highlight entire row
    if (targetRow >= 0 && targetRow < gridRows) {
      for (let col = 0; col < gridCols; col++) {
        positions.push({ row: targetRow, col });
      }
    }
  } else if (direction === 'vertical') {
    // Vertical clue number corresponds to column number (1-based to 0-based)
    const targetCol = number - 1;
    
    // Highlight entire column  
    if (targetCol >= 0 && targetCol < gridCols) {
      for (let row = 0; row < gridRows; row++) {
        positions.push({ row, col: targetCol });
      }
    }
  }
  
  return positions;
};

export const getIntersectingWords = (row, col, cluesHorizontal, cluesVertical) => {
  const intersecting = [];
  
  // Check horizontal clues
  cluesHorizontal.forEach(clue => {
    if (row === clue.startRow && col >= clue.startCol && col < clue.startCol + clue.length) {
      intersecting.push({ ...clue, direction: 'horizontal' });
    }
  });
  
  // Check vertical clues
  cluesVertical.forEach(clue => {
    if (col === clue.startCol && row >= clue.startRow && row < clue.startRow + clue.length) {
      intersecting.push({ ...clue, direction: 'vertical' });
    }
  });
  
  return intersecting;
};

// Puzzle validation
export const validatePuzzleGrid = (grid, cluesHorizontal, cluesVertical) => {
  const errors = [];
  
  // Validate horizontal clues
  cluesHorizontal.forEach(clue => {
    const word = clue.answer.toUpperCase();
    for (let i = 0; i < clue.length; i++) {
      const row = clue.startRow;
      const col = clue.startCol + i;
      
      if (!isValidPosition(row, col, grid.length)) {
        errors.push(`Horizontal clue ${clue.number}: Position out of bounds`);
        continue;
      }
      
      const gridLetter = grid[row][col];
      const wordLetter = word[i];
      
      if (gridLetter !== '' && gridLetter !== wordLetter) {
        errors.push(`Horizontal clue ${clue.number}: Letter mismatch at position ${i + 1}`);
      }
    }
  });
  
  // Validate vertical clues
  cluesVertical.forEach(clue => {
    const word = clue.answer.toUpperCase();
    for (let i = 0; i < clue.length; i++) {
      const row = clue.startRow + i;
      const col = clue.startCol;
      
      if (!isValidPosition(row, col, grid.length)) {
        errors.push(`Vertical clue ${clue.number}: Position out of bounds`);
        continue;
      }
      
      const gridLetter = grid[row][col];
      const wordLetter = word[i];
      
      if (gridLetter !== '' && gridLetter !== wordLetter) {
        errors.push(`Vertical clue ${clue.number}: Letter mismatch at position ${i + 1}`);
      }
    }
  });
  
  return errors;
};

// Check if puzzle is solved
export const isPuzzleSolved = (currentGrid, solution) => {
  if (!currentGrid || !solution) return false;
  
  for (let i = 0; i < solution.length; i++) {
    for (let j = 0; j < solution[i].length; j++) {
      if (solution[i][j] !== '' && currentGrid[i][j] !== solution[i][j]) {
        return false;
      }
    }
  }
  
  return true;
};

// Get completion percentage
export const getCompletionPercentage = (currentGrid, solution) => {
  if (!currentGrid || !solution) return 0;
  
  let totalCells = 0;
  let filledCells = 0;
  
  for (let i = 0; i < solution.length; i++) {
    for (let j = 0; j < solution[i].length; j++) {
      if (solution[i][j] !== '') {
        totalCells++;
        if (currentGrid[i][j] === solution[i][j]) {
          filledCells++;
        }
      }
    }
  }
  
  return totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;
};

// Get next empty cell
export const getNextEmptyCell = (currentGrid, solution, currentRow, currentCol, direction = 'right') => {
  const gridSize = solution.length;
  
  if (direction === 'right') {
    // Look right first, then next row
    for (let col = currentCol + 1; col < gridSize; col++) {
      if (solution[currentRow][col] !== '' && currentGrid[currentRow][col] === '') {
        return { row: currentRow, col };
      }
    }
    
    // Look in next rows
    for (let row = currentRow + 1; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (solution[row][col] !== '' && currentGrid[row][col] === '') {
          return { row, col };
        }
      }
    }
  } else if (direction === 'down') {
    // Look down first, then next column
    for (let row = currentRow + 1; row < gridSize; row++) {
      if (solution[row][currentCol] !== '' && currentGrid[row][currentCol] === '') {
        return { row, col: currentCol };
      }
    }
    
    // Look in next columns
    for (let col = currentCol + 1; col < gridSize; col++) {
      for (let row = 0; row < gridSize; row++) {
        if (solution[row][col] !== '' && currentGrid[row][col] === '') {
          return { row, col };
        }
      }
    }
  }
  
  return null;
};

// Clue numbering utilities
export const generateClueNumbers = (cluesHorizontal, cluesVertical) => {
  const allClues = [
    ...cluesHorizontal.map(clue => ({ ...clue, direction: 'horizontal' })),
    ...cluesVertical.map(clue => ({ ...clue, direction: 'vertical' }))
  ];
  
  // Sort by position (row, then column)
  allClues.sort((a, b) => {
    if (a.startRow !== b.startRow) {
      return a.startRow - b.startRow;
    }
    return a.startCol - b.startCol;
  });
  
  // Group by starting position
  const positionMap = new Map();
  allClues.forEach(clue => {
    const key = `${clue.startRow}-${clue.startCol}`;
    if (!positionMap.has(key)) {
      positionMap.set(key, []);
    }
    positionMap.get(key).push(clue);
  });
  
  // Assign numbers
  let currentNumber = 1;
  const updatedClues = { horizontal: [], vertical: [] };
  
  positionMap.forEach(cluesAtPosition => {
    cluesAtPosition.forEach(clue => {
      const updatedClue = { ...clue, number: currentNumber };
      if (clue.direction === 'horizontal') {
        updatedClues.horizontal.push(updatedClue);
      } else {
        updatedClues.vertical.push(updatedClue);
      }
    });
    currentNumber++;
  });
  
  return updatedClues;
};

export default {
  validateLanguage,
  formatDate,
  formatDateShort,
  isToday,
  isSameDay,
  createEmptyGrid,
  isValidPosition,
  getWordPositions,
  getIntersectingWords,
  validatePuzzleGrid,
  isPuzzleSolved,
  getCompletionPercentage,
  getNextEmptyCell,
  generateClueNumbers,
};
