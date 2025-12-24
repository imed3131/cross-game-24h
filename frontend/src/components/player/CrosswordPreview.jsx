import React from 'react';

/**
 * Compact visual preview of a crossword grid.
 * Props:
 *  - grid: 2D array where '#' marks black/blocked cells, otherwise letter or ''
 *  - rows, cols: optional numbers (falls back to grid size)
 *  - maxSize: maximum width/height in px (optional)
 */
const CrosswordPreview = ({ grid = [], rows = 0, cols = 0, maxSize = 120 }) => {
  const r = rows || grid.length || 0;
  const c = cols || (grid[0]?.length || 0);

  // Avoid division by zero
  const cellCount = Math.max(r, c, 1);
  // Compute cell size so grid fits within maxSize
  const cellSize = Math.max(6, Math.floor(maxSize / cellCount));

  // Compute grid style with small gaps so it looks compact
  const style = {
    display: 'inline-grid',
    gridTemplateColumns: `repeat(${c}, ${cellSize}px)`,
    gridAutoRows: `${cellSize}px`,
    gap: '1px',
    width: c * cellSize + (c - 1) * 1,
    height: r * cellSize + (r - 1) * 1,
  };

  return (
    <div className="mb-2 w-full flex justify-center" style={{}}>
      <div className="rounded-md overflow-hidden p-1" style={{ ...style, backgroundColor: 'transparent' }} aria-hidden>
        {(grid && grid.length > 0) ? (
          <>
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: cell === '#' ? '#334155' : '#fff',
                    border: cell === '#' ? 'none' : '1px solid rgba(0,0,0,0.06)',
                    boxSizing: 'border-box'
                  }}
                />
              ))
            )}
          </>
        ) : (
          <>
            {/* Fallback empty boxes if no grid */}
            {Array.from({ length: r }).map((_, i) =>
              Array.from({ length: c }).map((_, j) => (
                <div key={`${i}-${j}`} style={{ width: cellSize, height: cellSize, backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.06)' }} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CrosswordPreview;
