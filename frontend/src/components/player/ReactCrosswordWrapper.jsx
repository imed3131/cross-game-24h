import React, { useMemo, useCallback, Suspense } from 'react';
import { transformPuzzleToReactCrossword } from '../../utils/transformPuzzle';
import { useCrosswordGame } from '../../hooks/useCrosswordGame';
import './ReactCrosswordWrapper.css';

// Lightweight shim shown when the real library cannot be loaded
function CrosswordShim({ data }) {
  return (
    <div style={{ padding: 12, border: '1px dashed #cbd5e1', borderRadius: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Crossword library not installed</div>
      <div>Install <code>@jaredreisinger/react-crossword</code> to enable the interactive grid.</div>
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: 'pointer' }}>Show transformed data</summary>
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8, fontSize: '0.875rem' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}

// Try to lazy-load the real Crossword component; fall back to shim on import error
const LazyCrossword = React.lazy(async () => {
  if (typeof window === 'undefined') return { default: CrosswordShim };

  const candidates = ['react-crossword', '@jaredreisinger/react-crossword'];
  for (const lib of candidates) {
    try {
      // runtime import; avoid Vite pre-bundling by passing variable
      // eslint-disable-next-line no-await-in-loop
      const m = await import(lib);
      const Comp = m && (m.default || m.ReactCrossword || m.Crossword || m);
      if (Comp) {
        // eslint-disable-next-line no-console
        console.debug('[ReactCrosswordWrapper] using crossword library:', lib);
        return { default: Comp };
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.debug('[ReactCrosswordWrapper] failed to import', lib, err && err.message);
    }
  }

  // fallback
  // eslint-disable-next-line no-console
  console.warn('[ReactCrosswordWrapper] no compatible crossword library found; using shim.');
  return { default: CrosswordShim };
});

export default function ReactCrosswordWrapper({ puzzle, onCellSelect, onWordSelect, resetGame }) {
  const { getElapsedTime, pauseTimer, resumeTimer, isPaused, resetTimer } = useCrosswordGame();

  // Transform puzzle data to library format
  const data = useMemo(() => {
    const transformed = transformPuzzleToReactCrossword(puzzle);
    console.log('Transformed puzzle data:', transformed);
    return transformed;
  }, [puzzle]);

  // Handle when a word is completed correctly
  const handleCorrect = useCallback((direction, number, answer) => {
    console.log('Word completed:', { direction, number, answer });
    // You can add completion logic here (e.g., celebration animation)
  }, []);

  // Handle when entire crossword is completed
  const handleCrosswordComplete = useCallback(() => {
    console.log('Crossword completed!');
    // You can show completion modal here
  }, []);

  // Handle cell changes (if the library supports it)
  const handleCellChange = useCallback((row, col, char) => {
    console.log('Cell changed:', { row, col, char });
    // Note: Library uses 0-based indexing
    onCellSelect?.(row, col);
  }, [onCellSelect]);

  return (
    <div className="rcw-wrapper">
      {/* Header with puzzle info */}
      <div className="rcw-header">
        <h3 className="rcw-title">{puzzle?.title || 'Puzzle du jour'}</h3>
        <div className="rcw-meta">
          <span className="rcw-info">
            Grille {puzzle?.rows || 0} × {puzzle?.cols || 0}
          </span>
          <span className="rcw-difficulty">
            Difficulté: {puzzle?.difficulty === 'easy' ? 'Facile' : 
                        puzzle?.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
          </span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="rcw-timer-bar">
        <div className="rcw-timer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="13" r="8"/>
            <path d="m12 9-2 3h4l-2-3"/>
            <path d="M12 7V2m0 0L9 5m3-3 3 3"/>
          </svg>
          <span className={isPaused ? 'paused' : ''}>
            Temps: {String(Math.floor(getElapsedTime() / 60)).padStart(2, '0')}:
            {String(getElapsedTime() % 60).padStart(2, '0')}
            {isPaused && ' (Pause)'}
          </span>
        </div>
        <button 
          className="rcw-timer-btn" 
          onClick={() => isPaused ? resumeTimer() : pauseTimer()}
          title={isPaused ? "Reprendre" : "Pause"}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
        <button 
          className="rcw-timer-btn" 
          onClick={resetTimer}
          title="Réinitialiser le chrono"
        >
          🔄
        </button>
      </div>

      {/* Crossword Grid */}
      <div className="rcw-body">
        <Suspense fallback={
          <div className="rcw-loading">
            <div className="spinner"></div>
            <p>Chargement de la grille...</p>
          </div>
        }>
          <LazyCrossword
            data={data}
            onCorrect={handleCorrect}
            onCrosswordComplete={handleCrosswordComplete}
            // onCellChange is not a standard prop - remove if library doesn't support it
            // onCellChange={handleCellChange}
          />
        </Suspense>
      </div>

      {/* Controls */}
      <div className="rcw-controls">
        <button 
          className="rcw-btn rcw-btn-reset" 
          onClick={() => { 
            if (window.confirm('Êtes-vous sûr de vouloir recommencer ?')) {
              resetGame?.(); 
              resetTimer?.(); 
            }
          }}
        >
          🔄 Recommencer la partie
        </button>
      </div>
    </div>
  );
}