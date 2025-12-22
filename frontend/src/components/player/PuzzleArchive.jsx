import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../common/LoadingSpinner';
import { useGameState } from '../../context/GameState';
import { t } from '../../i18n';

const PuzzleArchive = ({ onClose, onSelectPuzzle, puzzleDates = [], todaysPuzzles = [], fetchPuzzlesByDate, loading: parentLoading }) => {
  const { state } = useGameState();
  const siteLang = state?.language || 'FR';
  const loc = (k) => t(k, siteLang);
  const [dates, setDates] = useState(puzzleDates || []);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => setDates(puzzleDates || []), [puzzleDates]);

  const handleDateClick = async (date) => {
    setSelectedDate(date);
    if (fetchPuzzlesByDate) {
      setLoading(true);
      try {
        await fetchPuzzlesByDate(date);
      } catch (e) {
        // handled by hook
      } finally {
        setLoading(false);
      }
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">{loc('archive_title')}</h3>
        <div className="text-sm text-white/80">{loc('click_date_instruction')}</div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {(parentLoading || loading) ? (
          <div className="col-span-3 p-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          (dates || []).length === 0 ? (
            <div className="col-span-3 text-sm text-white/70">{loc('no_dates')}</div>
          ) : (
            (dates || []).map((item) => {
              const dateRaw = typeof item === 'string' ? item : item?.date;
              const dateVal = dateRaw ? (new Date(dateRaw).toISOString().split('T')[0]) : String(item);
              const dateLabel = dateRaw ? new Date(dateRaw).toLocaleDateString(siteLang === 'AR' ? 'ar' : 'fr-FR') : dateVal;
              return (
                <button
                  key={dateVal}
                  onClick={() => handleDateClick(dateVal)}
                  className={`px-3 py-2 rounded-lg text-sm text-left bg-white/5 hover:bg-white/10 transition-colors ${selectedDate === dateVal ? 'ring-2 ring-white/30' : ''}`}
                >
                  {dateLabel}
                </button>
              );
            })
          )
        )}
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {selectedDate ? (
          (todaysPuzzles && todaysPuzzles.length > 0) ? (
            todaysPuzzles.map(p => (
              <div key={p.id} className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{p.title}</div>
                  <div className="text-xs text-white/70">{new Date(p.date).toLocaleDateString(siteLang === 'AR' ? 'ar' : 'fr-FR')} · {loc('grid_label')} {p.rows}×{p.cols} · {loc(`difficulty.${p.difficulty === 'easy' ? 'easy' : p.difficulty === 'medium' ? 'medium' : 'hard'}`)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectPuzzle?.(p)}
                    className="px-3 py-1 bg-yellow-400 text-black rounded-md text-sm"
                  >Ouvrir</button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-white/70">{loc('no_puzzles_for_date')}</div>
          )
        ) : (
          <p className="text-sm text-white/70">{loc('select_date_to_view')}</p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
        >{loc('close')}</button>
      </div>
    </motion.div>
  );
};

export default PuzzleArchive;
