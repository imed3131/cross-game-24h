import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw, Sparkles, BookOpen, Trophy, Timer } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { usePuzzles } from '../hooks/usePuzzles';
import { useCrosswordGame } from '../hooks/useCrosswordGame';

import CrosswordGrid from '../components/player/CrosswordGrid';
import CluesPanel from '../components/player/CluesPanel';
import Calendar from '../components/player/Calendar';
import CompletionCelebration from '../components/player/CompletionCelebration';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';

const PlayerPage = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const {
    todaysPuzzles,
    selectedPuzzle,
    setSelectedPuzzle,
    puzzleDates,
    loading,
    fetchPuzzlesByDate,
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
  }, [selectedPuzzle, initializePuzzle]);

  // Show celebration when puzzle is completed
  useEffect(() => {
    if (isCompleted && !showCelebration) {
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
  }, [isCompleted, showCelebration, currentGrid, selectedPuzzle, getElapsedTime, submitSolution]);

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
    fetchPuzzlesByDate(date);
  };

  // Handle puzzle navigation
  const navigatePuzzle = (direction) => {
    if (todaysPuzzles.length <= 1) return;
    
    const newIndex = direction === 'next' 
      ? (currentPuzzleIndex + 1) % todaysPuzzles.length
      : (currentPuzzleIndex - 1 + todaysPuzzles.length) % todaysPuzzles.length;
    
    setCurrentPuzzleIndex(newIndex);
    setSelectedPuzzle(todaysPuzzles[newIndex]);
  };

  // Handle play again
  const handlePlayAgain = () => {
    setShowCelebration(false);
    resetGame();
    if (todaysPuzzles.length > 1) {
      navigatePuzzle('next');
    }
  };



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
              Chargement des puzzles...
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/70"
            >
              Préparation de votre aventure mentale
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-900 via-blue-900 to-purple-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating geometric shapes */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-400/10 rounded-3xl blur-sm"
        ></motion.div>
        
        <motion.div
          animate={{
            y: [0, 30, 0],
            rotate: [0, -10, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/3 right-1/4 w-24 h-24 bg-purple-400/10 rounded-full blur-sm"
        ></motion.div>
        
        <motion.div
          animate={{
            y: [0, -15, 0],
            x: [0, 10, 0],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-pink-400/10 rounded-2xl blur-sm"
        ></motion.div>

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
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
                Les Mots Croisés
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
               Défi quotidien pour les esprits brillants
              <br />
              <span className="text-lg text-white/60">Explorez, réfléchissez, triomphez !</span>
            </motion.p>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col sm:flex-row flex-wrap items-center justify-between mb-6 sm:mb-8 lg:mb-12 gap-3 sm:gap-4 lg:gap-6"
          >
            {/* Left Controls */}
            <div className="flex items-center justify-center sm:justify-start w-full sm:w-auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="backdrop-blur-lg bg-white/10 rounded-xl lg:rounded-2xl border border-white/20 shadow-xl"
              >
                <Button
                  className="bg-transparent text-white border-none hover:bg-white/20 px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 text-sm sm:text-base"
                  icon={<CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />}
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <span className="hidden sm:inline">Calendrier des parties</span>
                  <span className="sm:hidden">Calendrier</span>
                </Button>
              </motion.div>
            </div>

            {/* Right Controls - Game Stats */}
            <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 lg:gap-6 w-full sm:w-auto">
              {todaysPuzzles.length > 0 && currentPuzzle && currentPuzzle.language && (
                <>
                  {/* Language indicator */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.2, type: "spring" }}
                    className="backdrop-blur-lg bg-white/10 rounded-xl lg:rounded-2xl border border-white/20 p-2 sm:p-3 lg:p-4 shadow-xl"
                  >
                    <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                      <div className="text-white">
                        <div className="text-xs sm:text-sm font-semibold">
                          {language === 'FR' ? 'Français' : 'العربية'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Reset button */}
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 180 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Button
                      className="bg-white/10 backdrop-blur-lg text-white border border-white/20 hover:bg-white/20 p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl shadow-xl"
                      icon={<RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />}
                      onClick={resetGame}
                    >
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>

          {/* Calendar */}
          <AnimatePresence>
            {showCalendar && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mb-12"
              >
                <div className="backdrop-blur-lg bg-white/10 rounded-3xl border border-white/20 p-8 shadow-2xl">
                  <Calendar
                    puzzleDates={puzzleDates}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game of the Day Section */}
          {todaysPuzzles.length > 0 ? (
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
                    Jeu du Jour
                  </h2>
                </motion.div>
                
                {todaysPuzzles.length > 1 && (
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
              </div>

              {/* Main Game Layout */}
              <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-8">
                {/* Crossword Grid Container */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.4, duration: 0.8 }}
                  className="lg:col-span-2 order-1 lg:order-1"
                >
                  {/* Grid Card */}
                  <div className="backdrop-blur-lg bg-white/10 rounded-2xl lg:rounded-3xl border border-white/20 p-3 sm:p-6 lg:p-8 shadow-2xl">
                    <CrosswordGrid
                      puzzle={currentPuzzle}
                      onCellSelect={() => {}}
                      onWordSelect={selectWord}
                    />
                  </div>
                </motion.div>

                {/* Clues Panel */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.6, duration: 0.8 }}
                  className="backdrop-blur-lg bg-white/10 rounded-2xl lg:rounded-3xl border border-white/20 p-3 sm:p-4 lg:p-6 shadow-2xl order-2 lg:order-2"
                >
                  <CluesPanel
                    puzzle={currentPuzzle}
                    selectedWord={selectedWord}
                    onWordSelect={selectWord}
                    language={language}
                  />
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2, duration: 0.6, ease: "backOut" }}
              className="text-center py-20"
            >
              <div className="backdrop-blur-lg bg-white/10 rounded-3xl border border-white/20 p-12 max-w-md mx-auto shadow-2xl">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-6"
                >
                  <CalendarIcon className="w-16 h-16 text-yellow-400 mx-auto" />
                </motion.div>
                
                <h3 className="text-2xl font-bold text-white mb-4">
                  Aucun puzzle pour cette date
                </h3>
                <p className="text-white/70 mb-8">
                  Explorez d'autres dates dans le calendrier pour découvrir de nouveaux défis !
                </p>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    className="bg-gradient-to-r from-yellow-400 to-pink-400 text-white font-semibold px-8 py-4 rounded-2xl border-none shadow-xl"
                    icon={<CalendarIcon className="w-5 h-5 mr-2" />}
                    onClick={() => setShowCalendar(true)}
                  >
                    Ouvrir le calendrier
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Completion Celebration */}
        <CompletionCelebration
          isVisible={showCelebration}
          onClose={() => setShowCelebration(false)}
          completionTime={getElapsedTime()}
          language={language}
          onPlayAgain={handlePlayAgain}
        />
      </div>
    </div>
  );
};

export default PlayerPage;
