import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { usePuzzles } from '../hooks/usePuzzles';
import { useCrosswordGame } from '../hooks/useCrosswordGame';

import CrosswordGrid from '../components/player/CrosswordGrid';
import PuzzleList from '../components/player/PuzzleList';
import CompletionCelebration from '../components/player/CompletionCelebration';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { ClueProvider } from '../context/ClueContext';
import { t } from '../i18n';
import { useGameState } from '../context/GameState';

const PlayerPage = () => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [showArchive, setShowArchive] = useState(true);
  const [openedFromArchive, setOpenedFromArchive] = useState(false);

  const {
    todaysPuzzles,
    selectedPuzzle,
    setSelectedPuzzle,
    puzzleDates,
    loading,
  fetchPuzzlesByDate,
  fetchAllPuzzles,
  fetchPuzzlesForList,
    submitSolution,
  } = usePuzzles();

  const {
    currentPuzzle,
    currentGrid,
    selectedCell,
    selectedWord,
    isCompleted,
    language,
    completionPercentage,
    initializePuzzle,
    selectWord,
    getElapsedTime,
    resetGame,
  } = useCrosswordGame();

  // Initialize puzzle when selectedPuzzle changes
  useEffect(() => {
    if (selectedPuzzle) {
      initializePuzzle(selectedPuzzle);
    }
  }, [selectedPuzzle?.id]); // Only depend on puzzle id to prevent excessive re-renders

  // Show celebration when puzzle is completed
  useEffect(() => {
    if (isCompleted && !showCelebration && selectedPuzzle?.id) {
      setShowCelebration(true);
      
      // Submit solution
      const submitCompletion = async () => {
        try {
          const elapsedTime = getElapsedTime();
          await submitSolution(
            selectedPuzzle.id,
            currentGrid,
            selectedPuzzle.language,
            elapsedTime
          );
        } catch (error) {
          console.error('Failed to submit solution:', error);
        }
      };
      
      submitCompletion();
    }
  }, [isCompleted, showCelebration, selectedPuzzle?.id]); // Removed function dependencies causing infinite loops

  // (Calendar/archive removed) - fetch by date can be triggered directly via hook if needed

  // Handle puzzle navigation
  const navigatePuzzle = useCallback((direction) => {
    if (todaysPuzzles.length <= 1) return;
    
    const newIndex = direction === 'next' 
      ? (currentPuzzleIndex + 1) % todaysPuzzles.length
      : (currentPuzzleIndex - 1 + todaysPuzzles.length) % todaysPuzzles.length;
    
    setCurrentPuzzleIndex(newIndex);
    setSelectedPuzzle(todaysPuzzles[newIndex]);
  // If user navigates away, clear opened-from-archive mode
  setOpenedFromArchive(false);
  }, [currentPuzzleIndex, todaysPuzzles, setSelectedPuzzle]);

  // Handle closing the celebration: close modal and reset puzzle (preserve archive state)
  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false);
    // Reset the game so isCompleted becomes false and the celebration won't re-open
    resetGame();
  }, [resetGame]);

  // Handle "Play Again" action: simply reset current puzzle and close celebration
  // NOTE: we intentionally do NOT navigate to the next puzzle here so that the
  // "Back to archive" button (openedFromArchive) remains visible when appropriate.
  const handlePlayAgain = useCallback(() => {
    setShowCelebration(false);
    resetGame();
  }, [resetGame]);

  // Memoized values to prevent unnecessary re-renders
  const hasPuzzles = useMemo(() => todaysPuzzles.length > 0, [todaysPuzzles.length]);
  const hasMultiplePuzzles = useMemo(() => todaysPuzzles.length > 1, [todaysPuzzles.length]);
  const currentLanguageDisplay = useMemo(() => 
    language === 'FR' ? 'Français' : 'العربية', 
    [language]
  );

  // localizer
  const { state: gameState } = useGameState();
  const lang = gameState.language || language;
  const loc = (key, vars) => {
    // simple variable replacement support for page_of
    let v = t(key, lang);
    if (vars && typeof v === 'string') {
      Object.keys(vars).forEach(k => { v = v.replace(`{${k}}`, String(vars[k])); });
    }
    return v;
  };

  // RTL support
  const topDirectionClass = lang === 'AR' ? 'rtl' : '';
  const effectiveHasMultiplePuzzles = useMemo(() => openedFromArchive ? false : hasMultiplePuzzles, [openedFromArchive, hasMultiplePuzzles]);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-900 via-blue-900 to-purple-900">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        {/* Loading Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <div className="mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4 border-4 border-white/20 border-t-white rounded-full"
              ></motion.div>
            </div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-2"
            >
              {loc('loading_puzzles')}
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/70"
            >
              {loc('subtitle')}
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${topDirectionClass} min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-900 via-blue-900 to-purple-900`} dir={lang === 'AR' ? 'rtl' : 'ltr'}>
      {/* Decorative blur elements constrained to the content width */}
      <div className="absolute inset-0 pointer-events-none flex items-start justify-center">
        <div className="w-full max-w-6xl mx-auto relative pointer-events-none">
          {/* Floating geometric shapes (positioned relative to the centered content area) */}
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-12 -top-6 w-32 h-32 bg-blue-400/10 rounded-3xl blur-sm"
          ></motion.div>
          
          <motion.div
            animate={{
              y: [0, 30, 0],
              rotate: [0, -10, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute right-4 top-8 w-24 h-24 bg-purple-400/10 rounded-full blur-sm"
          ></motion.div>
          
          <motion.div
            animate={{
              y: [0, -15, 0],
              x: [0, 10, 0],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute left-1/2 transform -translate-x-1/2 bottom-8 w-40 h-40 bg-pink-400/10 rounded-2xl blur-sm"
          ></motion.div>

          {/* Grid pattern overlay (constrained to content width) */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          ></div>
        </div>
      </div>

      <div className="relative z-10 min-h-screen">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 sm:mb-8 lg:mb-12"
          >
            {/* Sparkle animation */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="flex justify-center mb-3 sm:mb-4 lg:mb-6"
            >
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-yellow-400" />
            </motion.div>
            
            <motion.h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-bold mb-3 sm:mb-4 lg:mb-6 relative px-2"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "backOut" }}
            >
              <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {loc('site_title')}
              </span>
              
              {/* Animated underline */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full"
              ></motion.div>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
               {loc('subtitle')}
              <br />
              <span className="text-lg text-white/60">Explorez, réfléchissez, triomphez !</span>
            </motion.p>
          </motion.div>

          {/* Archive inline panel */}
          {showArchive && (
            <div className="mb-6">
              <PuzzleList
                puzzles={todaysPuzzles}
                fetchAllPuzzles={fetchPuzzlesForList}
                loading={loading}
                onSelectPuzzle={(p) => {
                  console.debug('PlayerPage: onSelectPuzzle called', p && p.id);
                  if (p && p.id) {
                    setSelectedPuzzle(p);
                    // ensure archive is hidden only after we set a valid puzzle
                    setShowArchive(false);
                    setOpenedFromArchive(true);
                  } else {
                    console.warn('PlayerPage: received invalid puzzle for selection', p);
                  }
                }}
              />
            </div>
          )}

          {/* debug panel removed */}

          {/* Game of the Day Section (hidden when archive is visible) */}
          {!showArchive && (hasPuzzles ? (
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.8 }}
            >
              {/* Game Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 lg:mb-8 gap-3 sm:gap-0">
                <motion.div
                  className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4"
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 2 }}
                >
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-yellow-400" />
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                    {loc('game_of_day')}
                  </h2>
                </motion.div>
                
                {effectiveHasMultiplePuzzles && (
                  <motion.div
                    className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 backdrop-blur-lg bg-white/10 rounded-xl lg:rounded-2xl border border-white/20 p-2 sm:p-2.5 lg:p-3 shadow-xl"
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 2.2 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => navigatePuzzle('prev')}
                      className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                    
                    <span className="text-white font-semibold px-2 sm:px-3 lg:px-4 text-sm sm:text-base">
                      {currentPuzzleIndex + 1} / {todaysPuzzles.length}
                    </span>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => navigatePuzzle('next')}
                      className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                  </motion.div>
                )}
                {openedFromArchive && (
                  <div className="ml-4">
                    <Button
                      className="bg-white/10 text-white px-3 py-2 rounded-lg hover:bg-white/20"
                      onClick={() => { setShowArchive(true); setOpenedFromArchive(false); }}
                    >
                        {loc('back_to_archive')}

                    </Button>
                  </div>
                )}
              </div>

              {/* Main Game Layout */}
              <div className="flex justify-center">
                {/* Crossword Grid Container */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.4, duration: 0.8 }}
                  className="backdrop-blur-lg maxwidth-full bg-white/10 rounded-2xl lg:rounded-3xl border border-white/20 p-3 sm:p-6 lg:p-8 shadow-2xl"
                >
                  {/* Grid Card */}
                  <div className="player-grid-force-ltr">
                    <ClueProvider>
                      <CrosswordGrid
                        puzzle={currentPuzzle}
                        resetGame={resetGame}
                        onCellSelect={() => {}}
                        onWordSelect={selectWord}
                      />
                    </ClueProvider>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-center py-20"
            >
              <div className="backdrop-blur-lg bg-white/10 rounded-3xl border border-white/20 p-12 max-w-md mx-auto shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-4">{loc('no_puzzle')}</h3>
                <p className="text-white/70 mb-6">Les puzzles seront récupérés automatiquement — vous pouvez forcer une actualisation.</p>
                <div>
                  <Button
                    className="bg-gradient-to-r from-yellow-400 to-pink-400 text-white font-semibold px-6 py-3 rounded-2xl border-none shadow-xl"
                    onClick={() => fetchAllPuzzles()}
                  >
                    Rafraîchir les puzzles
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Completion Celebration */}
        <CompletionCelebration
          isVisible={showCelebration}
          onClose={handleCloseCelebration}
          completionTime={getElapsedTime()}
          language={language}
          onPlayAgain={handlePlayAgain}
        />
      </div>
    </div>
  );
};

export default PlayerPage;
