import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { Trophy, Star, Clock, Target, Sparkles } from 'lucide-react';
import Button from '../common/Button';

const CompletionCelebration = ({ 
  isVisible, 
  onClose, 
  completionTime, 
  language = 'FR',
  onPlayAgain
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getText = (key) => {
    const texts = {
      FR: {
        congratulations: 'Félicitations !',
        puzzleSolved: 'Puzzle résolu avec succès !',
        completedIn: 'Terminé en',
        excellent: 'Excellent travail !',
        playAgain: 'Rejouer',
        close: 'Fermer',
        achievement: 'Exploit débloqué !'
      },
      AR: {
        congratulations: 'تهانينا !',
        puzzleSolved: 'تم حل اللغز بنجاح !',
        completedIn: 'أكمل في',
        excellent: 'عمل ممتاز !',
        playAgain: 'العب مرة أخرى',
        close: 'إغلاق',
        achievement: 'تم إلغاء قفل الإنجاز !'
      }
    };
    return texts[language][key] || texts.FR[key];
  };

  const celebrationVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        duration: 0.6,
        bounce: 0.4
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: 50,
      transition: { duration: 0.3 }
    }
  };

  const floatingIconVariants = {
    float: {
      y: [-10, 10, -10],
      rotate: [-5, 5, -5],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          {/* Confetti */}
          {showConfetti && (
            <Confetti
              width={windowDimensions.width}
              height={windowDimensions.height}
              recycle={false}
              numberOfPieces={200}
              colors={['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']}
            />
          )}

          {/* Celebration Modal */}
          <motion.div
            variants={celebrationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden
              ${language === 'AR' ? 'rtl font-arabic' : ''}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-white to-purple-50 opacity-60" />
            
            {/* Floating icons */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                variants={floatingIconVariants}
                animate="float"
                className="absolute top-4 left-4 text-yellow-400"
              >
                <Star className="w-6 h-6" />
              </motion.div>
              <motion.div
                variants={floatingIconVariants}
                animate="float"
                className="absolute top-4 right-4 text-purple-400"
                style={{ animationDelay: '0.5s' }}
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
              <motion.div
                variants={floatingIconVariants}
                animate="float"
                className="absolute bottom-4 left-4 text-green-400"
                style={{ animationDelay: '1s' }}
              >
                <Target className="w-6 h-6" />
              </motion.div>
              <motion.div
                variants={floatingIconVariants}
                animate="float"
                className="absolute bottom-4 right-4 text-blue-400"
                style={{ animationDelay: '1.5s' }}
              >
                <Star className="w-6 h-6" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Trophy Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: 'spring', 
                  duration: 0.8, 
                  delay: 0.2,
                  bounce: 0.6 
                }}
                className="flex justify-center mb-6"
              >
                <div className="relative">
                  <Trophy className="w-16 h-16 text-yellow-500" />
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="absolute inset-0 bg-yellow-400 rounded-full opacity-20 blur-lg"
                  />
                </div>
              </motion.div>

              {/* Main text */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-gray-900 mb-2"
              >
                {getText('congratulations')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-gray-600 mb-6"
              >
                {getText('puzzleSolved')}
              </motion.p>

              {/* Stats */}
              {completionTime && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-6 mb-6"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <Clock className="w-6 h-6 text-primary-600" />
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">
                        {getText('completedIn')}
                      </p>
                      <p className="text-2xl font-bold text-primary-600">
                        {formatTime(completionTime)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Achievement badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="inline-flex items-center space-x-2 bg-success-100 text-success-800 px-4 py-2 rounded-full mb-6"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {getText('achievement')}
                </span>
              </motion.div>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col space-y-3"
              >
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onPlayAgain}
                  className="w-full"
                >
                  {getText('playAgain')}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="w-full"
                >
                  {getText('close')}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CompletionCelebration;
