import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Game state context
const GameStateContext = createContext();

// Initial state
const initialState = {
  currentPuzzle: null,
  currentGrid: null,
  selectedCell: { row: -1, col: -1 },
  selectedWord: null,
  highlightedCells: [],
  startTime: null,
  pausedTime: 0,
  isPaused: false,
  isCompleted: false,
  showingSolution: false,
  language: 'FR', // Default language
};

// Game actions
export const GAME_ACTIONS = {
  SET_PUZZLE: 'SET_PUZZLE',
  UPDATE_GRID: 'UPDATE_GRID',
  SELECT_CELL: 'SELECT_CELL',
  SELECT_WORD: 'SELECT_WORD',
  HIGHLIGHT_CELLS: 'HIGHLIGHT_CELLS',
  START_TIMER: 'START_TIMER',
  PAUSE_TIMER: 'PAUSE_TIMER',
  RESUME_TIMER: 'RESUME_TIMER',
  RESET_TIMER: 'RESET_TIMER',
  COMPLETE_PUZZLE: 'COMPLETE_PUZZLE',
  SHOW_SOLUTION: 'SHOW_SOLUTION',
  RESET_GAME: 'RESET_GAME',
  SET_LANGUAGE: 'SET_LANGUAGE',
};

// Game reducer
const gameReducer = (state, action) => {
  switch (action.type) {
    case GAME_ACTIONS.SET_PUZZLE:
      const { puzzle } = action.payload;
      
      // Clear any existing saved state when loading a new puzzle
      if (puzzle) {
        const currentSavedState = localStorage.getItem('gameState');
        if (currentSavedState) {
          try {
            const parsedState = JSON.parse(currentSavedState);
            // If different puzzle ID, clear saved state
            if (!parsedState.currentPuzzle || parsedState.currentPuzzle.id !== puzzle.id) {
              localStorage.removeItem('gameState');
              localStorage.removeItem('gameVersion');
            }
          } catch (error) {
            localStorage.removeItem('gameState');
            localStorage.removeItem('gameVersion');
          }
        }
      }
      
      return {
        ...state,
        currentPuzzle: puzzle,
        currentGrid: puzzle ? JSON.parse(JSON.stringify(puzzle.grid)) : null,
        language: puzzle?.language || 'FR',
        isCompleted: false,
        showingSolution: false,
        selectedCell: { row: -1, col: -1 },
        selectedWord: null,
        highlightedCells: [],
        startTime: new Date(),
      };
      
    case GAME_ACTIONS.UPDATE_GRID:
      return {
        ...state,
        currentGrid: action.payload.grid,
      };
      
    case GAME_ACTIONS.SELECT_CELL:
      return {
        ...state,
        selectedCell: action.payload.cell,
      };
      
    case GAME_ACTIONS.SELECT_WORD:
      return {
        ...state,
        selectedWord: action.payload.word,
        highlightedCells: action.payload.highlightedCells || [],
      };
      
    case GAME_ACTIONS.HIGHLIGHT_CELLS:
      return {
        ...state,
        highlightedCells: action.payload.cells,
      };
      
    case GAME_ACTIONS.START_TIMER:
      return {
        ...state,
        startTime: new Date(),
        isPaused: false,
      };
      
    case GAME_ACTIONS.PAUSE_TIMER:
      return {
        ...state,
        isPaused: true,
        pausedTime: state.pausedTime + (state.startTime ? Math.floor((new Date() - new Date(state.startTime)) / 1000) : 0),
      };
      
    case GAME_ACTIONS.RESUME_TIMER:
      return {
        ...state,
        isPaused: false,
        startTime: new Date(),
      };
      
    case GAME_ACTIONS.RESET_TIMER:
      return {
        ...state,
        startTime: new Date(),
        pausedTime: 0,
        isPaused: false,
      };
      
    case GAME_ACTIONS.COMPLETE_PUZZLE:
      return {
        ...state,
        isCompleted: true,
      };
      
    case GAME_ACTIONS.SHOW_SOLUTION:
      return {
        ...state,
        showingSolution: action.payload.show,
        currentGrid: action.payload.show && state.currentPuzzle 
          ? JSON.parse(JSON.stringify(state.currentPuzzle.solution))
          : state.currentGrid,
      };
      
    case GAME_ACTIONS.RESET_GAME:
      // Clear localStorage when resetting game
      localStorage.removeItem('gameState');
      localStorage.removeItem('gameVersion');
      
      return {
        ...initialState,
        language: state.language,
        currentPuzzle: state.currentPuzzle,
        currentGrid: state.currentPuzzle 
          ? Array(state.currentPuzzle.rows).fill().map(() => 
              Array(state.currentPuzzle.cols).fill('')
            )
          : null,
        startTime: new Date(), // Reset start time for new game
      };
      
    case GAME_ACTIONS.SET_LANGUAGE:
      return {
        ...state,
        language: action.payload.language,
      };
      
    default:
      return state;
  }
};

// Utility function to clear all game-related localStorage
const clearGameStorage = () => {
  try {
    localStorage.removeItem('gameState');
    localStorage.removeItem('gameVersion');
    console.log('Game storage cleared successfully');
  } catch (error) {
    console.error('Failed to clear game storage:', error);
  }
};

// Game state provider
export const GameStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Clear storage on app initialization (ensures fresh start)
  useEffect(() => {
    const handleAppLoad = () => {
      // Check if this is a fresh app load (not just a component remount)
      const isInitialLoad = !sessionStorage.getItem('appLoaded');
      if (isInitialLoad) {
        clearGameStorage();
        sessionStorage.setItem('appLoaded', 'true');
      }
    };
    
    handleAppLoad();
  }, []);
  
  // Load saved game state from localStorage with version control
  useEffect(() => {
    // Only attempt to load if we have a current puzzle
    if (!state.currentPuzzle?.id) return;
    
    const savedState = localStorage.getItem('gameState');
    const gameVersion = localStorage.getItem('gameVersion');
    const currentPuzzleId = state.currentPuzzle.id;
    
    if (savedState && gameVersion && currentPuzzleId) {
      try {
        const parsedState = JSON.parse(savedState);
        
        // Only restore if it's the same puzzle and version is recent (within 24 hours)
        const versionTimestamp = parseInt(gameVersion.split('_')[1]);
        const isRecentVersion = versionTimestamp && (Date.now() - versionTimestamp < 24 * 60 * 60 * 1000);
        
        if (parsedState.currentPuzzle && 
            parsedState.currentGrid && 
            parsedState.currentPuzzle.id === currentPuzzleId &&
            isRecentVersion &&
            Array.isArray(parsedState.currentGrid)) {
          
          // Validate grid structure before restoring
          const expectedRows = state.currentPuzzle.rows || parsedState.currentGrid.length;
          const expectedCols = state.currentPuzzle.cols || parsedState.currentGrid[0]?.length;
          
          if (parsedState.currentGrid.length === expectedRows &&
              parsedState.currentGrid.every(row => Array.isArray(row) && row.length === expectedCols)) {
            // Only restore the grid, not the entire state
            dispatch({
              type: GAME_ACTIONS.UPDATE_GRID,
              payload: { grid: parsedState.currentGrid }
            });
          } else {
            // Grid structure mismatch, clear saved state
            localStorage.removeItem('gameState');
            localStorage.removeItem('gameVersion');
          }
        } else {
          // Clear old/invalid saved state
          localStorage.removeItem('gameState');
          localStorage.removeItem('gameVersion');
        }
      } catch (error) {
        console.error('Failed to load saved game state:', error);
        localStorage.removeItem('gameState');
        localStorage.removeItem('gameVersion');
      }
    }
  }, [state.currentPuzzle?.id, state.currentPuzzle?.rows, state.currentPuzzle?.cols]);

  // Save game state to localStorage with version control
  useEffect(() => {
    if (state.currentPuzzle && state.currentGrid && !state.isCompleted) {
      const stateToSave = {
        currentPuzzle: state.currentPuzzle,
        currentGrid: state.currentGrid,
        startTime: state.startTime,
        language: state.language,
        sessionId: `${state.currentPuzzle.id}_${Date.now()}`
      };
      
      const gameVersion = `${state.currentPuzzle.id}_${Date.now()}`;
      
      localStorage.setItem('gameState', JSON.stringify(stateToSave));
      localStorage.setItem('gameVersion', gameVersion);
    }
  }, [state.currentGrid, state.currentPuzzle, state.isCompleted]);

  // Clear saved state when puzzle is completed or changed
  useEffect(() => {
    if (state.isCompleted) {
      localStorage.removeItem('gameState');
      localStorage.removeItem('gameVersion');
    }
  }, [state.isCompleted]);  return (
    <GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GameStateContext.Provider>
  );
};

// Custom hook to use game state
export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

export default GameStateContext;
