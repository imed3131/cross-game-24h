import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { useGameState } from '../../context/GameState';
import { t } from '../../i18n';

const CluesPanel = ({ 
  puzzle, 
  selectedWord, 
  onWordSelect, 
  language,
  className = '' 
}) => {
  const { state } = useGameState();
  const siteLang = state?.language || language || 'FR';
  const loc = (k) => t(k, siteLang);

  // If no puzzle loaded, render a small placeholder
  if (!puzzle) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
        <p className="text-gray-500 text-center">{loc('loading_grid')}</p>
      </div>
    );
  }

  // Display only the currently selected word's clue.
  // Clicking the same numbered cell toggles the selection (handled by CrosswordGrid/selectWord).
  const selected = selectedWord;
  const isArabic = language === 'AR';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white rounded-xl lg:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 ${className}`}
    >
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 text-center">
        {loc('clue')}
      </h2>

      {selected ? (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${'bg-primary-600 text-white'}`}>
              {selected.number}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm leading-relaxed break-words ${isArabic ? 'text-right font-arabic' : 'text-left'}`}
                style={{ direction: isArabic ? 'rtl' : 'ltr', unicodeBidi: 'plaintext' }}
              >
                {selected.clue}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-sm text-gray-600">{loc('click_number_instruction')}</div>
      )}
    </motion.div>
  );
};

export default React.memo(CluesPanel);
