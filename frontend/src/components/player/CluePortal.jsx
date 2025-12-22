import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGameState } from '../../context/GameState';
import { t } from '../../i18n';

export default function CluePortal({ activeClueId, puzzle, onClose }) {
  const content = useMemo(() => {
    if (!activeClueId) return null;
    const parts = activeClueId.split('-');
    const kind = parts[0];

    if (kind === 'cell') {
      const r = parseInt(parts[1], 10);
      const c = parseInt(parts[2], 10);
      const rowNumber = r + 1;
      const colNumber = c + 1;
      const hasRowClue = puzzle?.cluesHorizontal && puzzle.cluesHorizontal[rowNumber];
      const hasColClue = puzzle?.cluesVertical && puzzle.cluesVertical[colNumber];
      if (hasRowClue && (!hasColClue || c === 0)) {
        return { number: rowNumber, direction: 'horizontal', clueText: puzzle.cluesHorizontal[rowNumber] };
      }
      if (hasColClue) {
        return { number: colNumber, direction: 'vertical', clueText: puzzle.cluesVertical[colNumber] };
      }
      return { number: '', direction: 'cell', clueText: '' };
    }

    const number = parts[1];
    const clueText = kind === 'col' ? puzzle?.cluesVertical?.[number] : puzzle?.cluesHorizontal?.[number];
    const direction = kind === 'col' ? 'vertical' : 'horizontal';
    return { number, direction, clueText };
  }, [activeClueId, puzzle]);

  const { state } = useGameState();
  const siteLang = state?.language || 'FR';
  const loc = (k) => t(k, siteLang);

  if (!activeClueId || !content) return null;

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    zIndex: 2147483647,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px'
  };

  const cardStyle = {
    position: 'relative',
    width: 'min(420px, 90vw)',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    padding: '18px 20px',
    zIndex: 2147483648
  };

  const badgeStyle = {
    fontSize: '12px',
    fontWeight: 700,
    marginBottom: '6px'
  };

  const node = (
    <div style={overlayStyle} role="presentation" onClick={() => onClose?.()}>
      <div style={cardStyle} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={badgeStyle}>{loc('clue')} {content.number} • {content.direction}</div>
          <button aria-label={loc('close')} onClick={() => onClose?.()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ color: '#374151', fontSize: 14, lineHeight: 1.4 }}>{content.clueText}</div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
