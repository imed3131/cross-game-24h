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
      return {
        ...initialState,
        language: state.language,
        currentPuzzle: state.currentPuzzle,
        currentGrid: state.currentPuzzle 
          ? Array(state.currentPuzzle.rows).fill().map(() => 
              Array(state.currentPuzzle.cols).fill('')
            )
          : null,
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

// Game state provider
export const GameStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Load saved game state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Only restore certain parts of the state
        if (parsedState.currentPuzzle && parsedState.currentGrid) {
          dispatch({
            type: GAME_ACTIONS.SET_PUZZLE,
            payload: { puzzle: parsedState.currentPuzzle }
          });
          dispatch({
            type: GAME_ACTIONS.UPDATE_GRID,
            payload: { grid: parsedState.currentGrid }
          });
        }
      } catch (error) {
        console.error('Failed to load saved game state:', error);
      }
    }
  }, []);
  
  // Save game state to localStorage
  useEffect(() => {
    if (state.currentPuzzle && state.currentGrid && !state.isCompleted) {
      const stateToSave = {
        currentPuzzle: state.currentPuzzle,
        currentGrid: state.currentGrid,
        startTime: state.startTime,
        language: state.language,
      };
      localStorage.setItem('gameState', JSON.stringify(stateToSave));
    }
  }, [state.currentGrid, state.currentPuzzle, state.isCompleted]);
  
  // Clear saved state when puzzle is completed
  useEffect(() => {
    if (state.isCompleted) {
      localStorage.removeItem('gameState');
    }
  }, [state.isCompleted]);
  
  return (
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
