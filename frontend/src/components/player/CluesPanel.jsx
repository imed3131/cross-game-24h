import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowDown } from 'lucide-react';

const CluesPanel = ({ 
  puzzle, 
  selectedWord, 
  onWordSelect, 
  language,
  className = '' 
}) => {
  if (!puzzle) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
        <p className="text-gray-500 text-center">No puzzle loaded</p>
      </div>
    );
  }

  const handleWordClick = (clue, direction) => {
    // Si l'indice est déjà sélectionné, le désélectionner
    if (isWordSelected(clue, direction)) {
      console.log('Deselecting word:', clue.number, direction);
      onWordSelect?.(null);
      return;
    }
    
    // Créer un objet word plus complet pour la sélection
    const word = {
      ...clue,
      direction,
      // Pour les indices simples par ligne/colonne
      startRow: direction === 'horizontal' ? (clue.number - 1) : 0,
      startCol: direction === 'vertical' ? (clue.number - 1) : 0,
      length: direction === 'horizontal' ? (puzzle?.cols || 15) : (puzzle?.rows || 15)
    };
    
    console.log('Word clicked:', word);
    onWordSelect?.(word);
  };

  const isWordSelected = (clue, direction) => {
    return selectedWord && 
           selectedWord.number === clue.number && 
           selectedWord.direction === direction;
  };

  const renderClue = (clue, direction) => {
    console.log('Rendering clue:', clue, 'type:', typeof clue);
    const isArabic = language === 'AR';
    return (
      <motion.div
        key={`${direction}-${clue.number}`}
        className={`
          p-3 rounded-lg cursor-pointer border-2 transition-all duration-200
          ${isWordSelected(clue, direction)
            ? 'bg-primary-100 border-primary-300 shadow-md' 
            : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200'
          }
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => handleWordClick(clue, direction)}
        layout
      >
      <div className="flex items-start gap-3">
        <div className={`
          inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0
          ${isWordSelected(clue, direction)
            ? 'bg-primary-600 text-white' 
            : 'bg-gray-300 text-gray-700'
          }
        `}>
          {clue.number}
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className={`
            text-sm leading-relaxed break-words hyphens-auto
            ${isWordSelected(clue, direction) 
              ? 'text-primary-900 font-medium' 
              : 'text-gray-700'
            }
            ${isArabic ? 'text-right font-arabic' : 'text-left'}
          `}
          style={{
            direction: isArabic ? 'rtl' : 'ltr',
            unicodeBidi: 'plaintext'
          }}>
            {typeof clue.clue === 'string' ? clue.clue : JSON.stringify(clue.clue)}
          </p>
          
          {clue.answer && process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-red-500 mt-1 font-mono break-all">
              Debug: {clue.answer}
            </p>
          )}
        </div>
      </div>
    </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
        Indices
      </h2>
      
      <div className="space-y-6 overflow-hidden">
        {/* Horizontal Clues */}
        <div className="min-h-0">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <ArrowRight className="w-5 h-5 mr-2 text-blue-600" />
            <span className="text-blue-600">Horizontal</span>
          </h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-hidden scrollbar-thin">
            <AnimatePresence>
              {puzzle.cluesHorizontal && Object.entries(puzzle.cluesHorizontal).map(([number, clueText]) => 
                renderClue({ number: parseInt(number), clue: clueText }, 'horizontal')
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Vertical Clues */}
        <div className="min-h-0">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <ArrowDown className="w-5 h-5 mr-2 text-green-600" />
            <span className="text-green-600">Vertical</span>
          </h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-hidden scrollbar-thin">
            <AnimatePresence>
              {puzzle.cluesVertical && Object.entries(puzzle.cluesVertical).map(([number, clueText]) => 
                renderClue({ number: parseInt(number), clue: clueText }, 'vertical')
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>


    </motion.div>
  );
};

export default CluesPanel;
