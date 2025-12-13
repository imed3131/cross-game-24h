import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement des puzzles..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              Les Mots Croisés
            </h1>
            <p className="text-gray-600 text-lg">
              Défi quotidien pour les esprits brillants
            </p>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between mb-8 gap-4"
          >
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                icon={<CalendarIcon className="w-4 h-4" />}
                onClick={() => setShowCalendar(!showCalendar)}
              >
                Calendrier des parties
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              {currentPuzzle && (
                <>
                  <div className="text-sm text-gray-600">
                    Progression: {completionPercentage}%
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<RefreshCw className="w-4 h-4" />}
                    onClick={resetGame}
                  >
                    Recommencer
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          {/* Calendar */}
          <AnimatePresence>
            {showCalendar && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <Calendar
                  puzzleDates={puzzleDates}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game of the Day Section */}
          {todaysPuzzles.length > 0 ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Jeu du Jour
                </h2>
                
                {todaysPuzzles.length > 1 && (
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<ChevronLeft className="w-4 h-4" />}
                      onClick={() => navigatePuzzle('prev')}
                    />
                    <span className="text-sm text-gray-600">
                      {currentPuzzleIndex + 1} / {todaysPuzzles.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<ChevronRight className="w-4 h-4" />}
                      onClick={() => navigatePuzzle('next')}
                    />
                  </div>
                )}
              </div>

              {/* Main Game Layout */}
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Crossword Grid */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="lg:col-span-2"
                >
                  <CrosswordGrid
                    puzzle={currentPuzzle}
                    onCellSelect={() => {}}
                    onWordSelect={selectWord}
                  />
                  
                  {/* Progress Bar */}
                  <div className="mt-4 bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-primary-600 to-success-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>

                {/* Clues Panel */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <CluesPanel
                    puzzle={currentPuzzle}
                    selectedWord={selectedWord}
                    onWordSelect={selectWord}
                    language={language}
                  />
                </motion.div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Aucun puzzle pour cette date
              </h3>
              <p className="text-gray-600 mb-8">
                Sélectionnez une autre date dans le calendrier
              </p>
              <Button
                variant="primary"
                icon={<CalendarIcon className="w-4 h-4" />}
                onClick={() => setShowCalendar(true)}
              >
                Ouvrir le calendrier
              </Button>
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
  );
};

export default PlayerPage;
