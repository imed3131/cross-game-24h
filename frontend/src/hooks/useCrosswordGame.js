import { useState, useEffect, useCallback } from 'react';
import { useGameState, GAME_ACTIONS } from '../context/GameState';
import { 
  validateLanguage, 
  isPuzzleSolved, 
  getIntersectingWords, 
  getWordPositions 
} from '../utils/helpers';
import { toast } from 'react-hot-toast';

export const useCrosswordGame = () => {
  const { state, dispatch } = useGameState();
  const [invalidInput, setInvalidInput] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Initialize puzzle
  const initializePuzzle = useCallback((puzzle) => {
    dispatch({
      type: GAME_ACTIONS.SET_PUZZLE,
      payload: { puzzle },
    });
  }, [dispatch]);

  // Update grid cell
  const updateGridCell = useCallback((row, col, value) => {
    if (!state.currentGrid || !state.currentPuzzle) return;

    // Validate language
    if (value && !validateLanguage(value, state.language)) {
      setInvalidInput(true);
      toast.error(
        state.language === 'FR' 
          ? 'Only French letters are allowed'
          : 'Only Arabic letters are allowed'
      );
      setTimeout(() => setInvalidInput(false), 500);
      return false;
    }

    const newGrid = [...state.currentGrid];
    newGrid[row][col] = value.toUpperCase();

    dispatch({
      type: GAME_ACTIONS.UPDATE_GRID,
      payload: { grid: newGrid },
    });

    return true;
  }, [state.currentGrid, state.currentPuzzle, state.language, dispatch]);

  // Select cell
  const selectCell = useCallback((row, col) => {
    dispatch({
      type: GAME_ACTIONS.SELECT_CELL,
      payload: { cell: { row, col } },
    });

    // Find intersecting words and highlight them
    if (state.currentPuzzle) {
      const intersecting = getIntersectingWords(
        row, 
        col, 
        state.currentPuzzle.cluesHorizontal,
        state.currentPuzzle.cluesVertical
      );

      if (intersecting.length > 0) {
        const word = intersecting[0];
        selectWord(word);
      }
    }
  }, [dispatch, state.currentPuzzle]);

  // Select word
  const selectWord = useCallback((word) => {
    if (!word) {
      dispatch({
        type: GAME_ACTIONS.SELECT_WORD,
        payload: { word: null, highlightedCells: [] },
      });
      return;
    }

    const positions = getWordPositions(word, state.currentGrid);
    
    dispatch({
      type: GAME_ACTIONS.SELECT_WORD,
      payload: { 
        word, 
        highlightedCells: positions 
      },
    });
    
    // Sélectionner automatiquement la première cellule du mot
    if (positions.length > 0) {
      const firstPosition = positions[0];
      dispatch({
        type: GAME_ACTIONS.SELECT_CELL,
        payload: { cell: { row: firstPosition.row, col: firstPosition.col } },
      });
    }
  }, [state.currentGrid, dispatch]);

  // Handle keyboard input
  const handleKeyInput = useCallback((key) => {
    const { row, col } = state.selectedCell;
    
    if (row === -1 || col === -1 || !state.currentPuzzle) return;

    if (key === 'Backspace') {
      updateGridCell(row, col, '');
      return;
    }

    if (key === 'Delete') {
      updateGridCell(row, col, '');
      return;
    }

    // Handle letter input
    if (key.length === 1 && key.match(/[a-zA-ZÀ-ÿ\u0600-\u06FF]/)) {
      const success = updateGridCell(row, col, key);
      
      if (success && state.selectedWord) {
        // Move to next cell in the word
        const positions = getWordPositions(state.selectedWord, state.currentGrid);
        const currentIndex = positions.findIndex(pos => pos.row === row && pos.col === col);
        
        if (currentIndex >= 0 && currentIndex < positions.length - 1) {
          const nextPos = positions[currentIndex + 1];
          selectCell(nextPos.row, nextPos.col);
        }
      }
    }
  }, [state.selectedCell, state.currentPuzzle, state.selectedWord, state.currentGrid, updateGridCell, selectCell]);

  // Check if puzzle is completed
  useEffect(() => {
    if (state.currentGrid && state.currentPuzzle?.solution) {
      const solved = isPuzzleSolved(state.currentGrid, state.currentPuzzle.solution);
      
      if (solved && !state.isCompleted) {
        dispatch({
          type: GAME_ACTIONS.COMPLETE_PUZZLE,
        });
      }

      // Update completion percentage
      let totalCells = 0;
      let correctCells = 0;
      
      state.currentPuzzle.solution.forEach((row, i) => {
        row.forEach((cell, j) => {
          // Compter seulement les cellules non-bloquées (non vides dans la solution)
          if (cell !== '' && cell !== '#') {
            totalCells++;
            // Compter seulement les cellules avec les lettres CORRECTES
            if (state.currentGrid[i][j] && state.currentGrid[i][j].trim() !== '' && 
                state.currentGrid[i][j].toUpperCase() === cell.toUpperCase()) {
              correctCells++;
            }
          }
        });
      });
      
      setCompletionPercentage(totalCells > 0 ? Math.round((correctCells / totalCells) * 100) : 0);
    }
  }, [state.currentGrid, state.currentPuzzle, state.isCompleted, dispatch]);

  // Get elapsed time
  const getElapsedTime = useCallback(() => {
    if (!state.startTime) return 0;
    
    let currentTime = 0;
    if (state.isPaused) {
      // Si en pause, retourner seulement le temps pausé
      currentTime = state.pausedTime || 0;
    } else {
      // Si actif, ajouter le temps écoulé depuis le dernier démarrage
      const elapsedSinceStart = Math.floor((new Date() - new Date(state.startTime)) / 1000);
      currentTime = (state.pausedTime || 0) + elapsedSinceStart;
    }
    
    return currentTime;
  }, [state.startTime, state.isPaused, state.pausedTime]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    dispatch({
      type: GAME_ACTIONS.PAUSE_TIMER,
    });
  }, [dispatch]);

  // Resume timer
  const resumeTimer = useCallback(() => {
    dispatch({
      type: GAME_ACTIONS.RESUME_TIMER,
    });
  }, [dispatch]);

  // Reset timer
  const resetTimer = useCallback(() => {
    dispatch({
      type: GAME_ACTIONS.RESET_TIMER,
    });
  }, [dispatch]);

  // Reset game
  const resetGame = useCallback(() => {
    const currentPuzzle = state.currentPuzzle;
    
    dispatch({
      type: GAME_ACTIONS.RESET_GAME,
    });
    
    // Réinitialiser le puzzle si il y en avait un
    if (currentPuzzle) {
      setTimeout(() => {
        dispatch({
          type: GAME_ACTIONS.SET_PUZZLE,
          payload: { puzzle: currentPuzzle },
        });
      }, 50);
    }
  }, [dispatch, state.currentPuzzle]);

  // Show solution
  const toggleSolution = useCallback((show) => {
    dispatch({
      type: GAME_ACTIONS.SHOW_SOLUTION,
      payload: { show },
    });
  }, [dispatch]);

  return {
    // State
    currentPuzzle: state.currentPuzzle,
    currentGrid: state.currentGrid,
    selectedCell: state.selectedCell,
    selectedWord: state.selectedWord,
    highlightedCells: state.highlightedCells,
    isCompleted: state.isCompleted,
    showingSolution: state.showingSolution,
    language: state.language,
    isPaused: state.isPaused,
    completionPercentage,
    invalidInput,

    // Actions
    initializePuzzle,
    updateGridCell,
    selectCell,
    selectWord,
    handleKeyInput,
    resetGame,
    toggleSolution,
    getElapsedTime,
    pauseTimer,
    resumeTimer,
    resetTimer,
  };
};
