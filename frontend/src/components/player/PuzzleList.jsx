import React, { useEffect, useState } from 'react';
import { useGameState } from '../../context/GameState';
import { t } from '../../i18n';
import CrosswordPreview from './CrosswordPreview';

const PuzzleList = ({
  puzzles = [],
  loading = false,
  fetchAllPuzzles,
  onSelectPuzzle,
}) => {
  const [localLoading, setLocalLoading] = useState(false);
  const [localPuzzles, setLocalPuzzles] = useState([]);
  // Default to all languages (empty = all)
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { state: gameState } = useGameState();
  const siteLang = gameState?.language || 'FR';
  const loc = (k, vars) => {
    let s = t(k, siteLang);
    if (vars) Object.keys(vars).forEach(kv => { s = s.replace(`{${kv}}`, String(vars[kv])); });
    return s;
  };

  const fetchPuzzles = async (language = selectedLanguage, page = currentPage) => {
    if (!fetchAllPuzzles) return;
    
    setLocalLoading(true);
    try {
      const response = await fetchAllPuzzles({
        language: language || undefined,
        page,
        limit: 12
      });
      
      setLocalPuzzles(response.data.puzzles || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error fetching puzzles:', error);
      setLocalPuzzles([]);
      setTotalPages(1);
    } finally {
      setLocalLoading(false);
    }
  };  // Load initial puzzles

  // Normalize various language representations to canonical codes 'FR' or 'AR'
  const normalizeLangCode = (l) => {
    if (!l) return '';
    const s = String(l).trim().toUpperCase();
    if (s === 'FR' || s.startsWith('F') || s === 'FRENCH' || s === 'FRANCAIS' || s === 'FRANÇAIS') return 'FR';
    if (s === 'AR' || s.startsWith('A') || s === 'ARABIC' || s === 'العربية') return 'AR';
    return s;
  };
  useEffect(() => {
    if (!hasLoaded) {
      fetchPuzzles('', 1);
    }
  }, []); // Only run once on mount

  const selectLanguage = (language) => {
    setSelectedLanguage(language);
    setCurrentPage(1);
    setShowLanguageDropdown(false);
    fetchPuzzles(language, 1);
  };

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown(!showLanguageDropdown);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchPuzzles(selectedLanguage, page);
    }
  };

  return (
    <div className="mx-auto max-w-3xl bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">{loc('list_puzzles')}</h3>
      </div>

      <div className="flex items-center gap-3 mb-3 relative">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <button
              onClick={toggleLanguageDropdown}
              className="px-3 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              {selectedLanguage === 'AR' ? loc('arabic') : selectedLanguage === 'FR' ? loc('french') : loc('all_languages')}
            </button>

            {showLanguageDropdown && (
              <div className="absolute left-0 top-12 z-40 bg-gray-800 p-2 rounded-lg shadow-lg">
                <button className="block w-full text-left px-3 py-1 text-white hover:bg-white/5" onClick={() => selectLanguage('')}>{loc('all_languages')}</button>
                <button className="block w-full text-left px-3 py-1 text-white hover:bg-white/5" onClick={() => selectLanguage('AR')}>{loc('arabic')}</button>
                <button className="block w-full text-left px-3 py-1 text-white hover:bg-white/5" onClick={() => selectLanguage('FR')}>{loc('french')}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(loading || localLoading) ? (
          <div className="p-6 text-center text-sm text-white/70 col-span-full">
            {loc('loading_puzzles')}
          </div>
        ) : (
          (localPuzzles && localPuzzles.length > 0) ? (
            localPuzzles.map(p => (
              <div key={p.id} className="p-3 bg-white/5 rounded-lg flex flex-col items-center justify-between min-h-[360px] hover:bg-white/10 transition-colors">
                <div className="flex flex-col items-center w-full">
                  <CrosswordPreview grid={p.grid} rows={p.rows} cols={p.cols} maxSize={180} />

                  <div className="mt-2 text-center px-2 w-full">
                    <div className="text-sm font-semibold text-white">{p.title || loc('puzzle')}</div>
                    <div className="text-xs text-white/70 mt-1" style={{ maxHeight: '5.5rem', overflow: 'hidden' }}>{p.description || p.preview || ''}</div>
                    <div className="text-xs font-bold text-yellow-400 uppercase mt-2">{normalizeLangCode(p.language) === 'AR' ? loc('arabic') : normalizeLangCode(p.language) === 'FR' ? loc('french') : p.language}</div>
                    <div className="text-xs text-white/70 mt-1">{new Date(p.date).toLocaleDateString(siteLang === 'AR' ? 'ar' : 'fr-FR')} · {p.rows}×{p.cols}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 self-center">
                  <button
                    onClick={() => onSelectPuzzle?.(p)}
                    className="px-4 py-2 bg-yellow-400 text-black rounded-md text-sm hover:bg-yellow-500 transition-colors font-medium"
                  >
                    {loc('open')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-sm text-white/70 col-span-full">
              {hasLoaded ? loc('no_puzzle') + '.' : loc('loading')}
            </div>
          )
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-white/5 text-white rounded disabled:opacity-50 hover:bg-white/10 transition-colors"
          >
            {loc('previous')}
          </button>
          
          <span className="text-white/70 text-sm">
            {loc('page_of', { page: currentPage, total: totalPages })}
          </span>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-white/5 text-white rounded disabled:opacity-50 hover:bg-white/10 transition-colors"
          >
            {loc('next')}
          </button>
        </div>
      )}
    </div>
  );
};

export default PuzzleList;