import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { playerAPI } from '../services/api';

const PlayerPage = () => {
  const [loading, setLoading] = useState(true);
  const [puzzles, setPuzzles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTodaysPuzzles();
  }, []);

  const loadTodaysPuzzles = async () => {
    try {
      setLoading(true);
      const response = await playerAPI.getTodaysPuzzles();
      setPuzzles(response.data);
      setError(null);
    } catch (error) {
      console.error('Error loading puzzles:', error);
      setError('Impossible de charger les puzzles du jour');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-600">Chargement des mots croisés...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadTodaysPuzzles}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!puzzles || puzzles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Aucun puzzle disponible</h2>
          <p className="text-gray-600 mb-4">Il n'y a pas de puzzle pour aujourd'hui.</p>
          <button
            onClick={loadTodaysPuzzles}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Actualiser
          </button>
        </div>
      </div>
    );
  }

  const currentPuzzle = puzzles[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    >
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.h1
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            >
              Mots Croisés
            </motion.h1>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {currentPuzzle.title}
              </h2>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {currentPuzzle.language === 'FR' ? 'Français' : 'العربية'}
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                  Difficulté: {currentPuzzle.difficulty === 'easy' ? 'Facile' : 
                              currentPuzzle.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  {currentPuzzle.rows} × {currentPuzzle.cols}
                </span>
              </div>
            </div>

            {/* Simple Grid Preview */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Grille de mots croisés</h3>
              <div 
                className="inline-grid gap-1 bg-gray-200 p-4 rounded-lg"
                style={{ 
                  gridTemplateColumns: `repeat(${currentPuzzle.cols}, minmax(0, 1fr))`,
                }}
              >
                {currentPuzzle.grid.flat().map((cell, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 border border-gray-400 flex items-center justify-center text-xs font-bold
                      ${cell === '#' ? 'bg-gray-900' : 'bg-white'}
                    `}
                  >
                    {cell !== '#' && cell !== '' ? cell : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Clues Preview */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Horizontal Clues */}
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">
                  Définitions Horizontales ({currentPuzzle.cluesHorizontal.length})
                </h4>
                <div className="text-left space-y-2 max-h-48 overflow-y-auto">
                  {currentPuzzle.cluesHorizontal.slice(0, 5).map((clue) => (
                    <div key={clue.number} className="text-sm">
                      <span className="font-bold text-blue-600">{clue.number}.</span>
                      <span className="ml-2">{clue.clue}</span>
                      <span className="text-gray-500 ml-2">({clue.length} lettres)</span>
                    </div>
                  ))}
                  {currentPuzzle.cluesHorizontal.length > 5 && (
                    <div className="text-xs text-gray-500">
                      ... et {currentPuzzle.cluesHorizontal.length - 5} autres
                    </div>
                  )}
                </div>
              </div>

              {/* Vertical Clues */}
              <div>
                <h4 className="font-semibold mb-3 text-green-600">
                  Définitions Verticales ({currentPuzzle.cluesVertical.length})
                </h4>
                <div className="text-left space-y-2 max-h-48 overflow-y-auto">
                  {currentPuzzle.cluesVertical.slice(0, 5).map((clue) => (
                    <div key={clue.number} className="text-sm">
                      <span className="font-bold text-green-600">{clue.number}.</span>
                      <span className="ml-2">{clue.clue}</span>
                      <span className="text-gray-500 ml-2">({clue.length} lettres)</span>
                    </div>
                  ))}
                  {currentPuzzle.cluesVertical.length > 5 && (
                    <div className="text-xs text-gray-500">
                      ... et {currentPuzzle.cluesVertical.length - 5} autres
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                🎯 Commencer à jouer
              </button>
              <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
                📅 Voir les puzzles précédents
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
};

export default PlayerPage;
