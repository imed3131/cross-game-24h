import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Edit, 
  Trash2, 
  Eye, 
  Plus, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, parseISO, isToday, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';
import CreateCrosswordGame from './CreateCrosswordGame';

const ManagePuzzles = () => {
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, published, draft
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState(null);
  const puzzlesPerPage = 10;

  useEffect(() => {
    loadPuzzles();
  }, []);

  const loadPuzzles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/puzzles');
      setPuzzles(response.data);
    } catch (error) {
      console.error('Error loading puzzles:', error);
      toast.error('Erreur lors du chargement des puzzles');
    } finally {
      setLoading(false);
    }
  };

  const deletePuzzle = async (puzzleId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce puzzle ?')) {
      return;
    }

    try {
      await api.delete(`/admin/puzzle/${puzzleId}`);
      toast.success('Puzzle supprimé avec succès');
      loadPuzzles();
    } catch (error) {
      console.error('Error deleting puzzle:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const togglePublishStatus = async (puzzle) => {
    try {
      console.log('Toggling publish status for puzzle:', puzzle.id, 'from', puzzle.isPublished, 'to', !puzzle.isPublished);
      
      // Use the dedicated toggle endpoint - much simpler and more reliable
      const response = await api.patch(`/admin/puzzle/${puzzle.id}/toggle-publish`);
      
      console.log('Toggle response:', response.data);
      
      const newStatus = response.data.isPublished;
      toast.success(`Puzzle ${newStatus ? 'publié' : 'dépublié'} avec succès`);
      
      // Reload the puzzles list to show updated status
      loadPuzzles();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show more specific error message
      const errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour du statut de publication';
      toast.error(errorMessage);
    }
  };

  const filteredPuzzles = puzzles.filter(puzzle => {
    const matchesSearch = puzzle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         puzzle.date.includes(searchTerm);
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'published' && puzzle.isPublished) ||
                         (filterStatus === 'draft' && !puzzle.isPublished);
    
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredPuzzles.length / puzzlesPerPage);
  const currentPuzzles = filteredPuzzles.slice(
    (currentPage - 1) * puzzlesPerPage,
    currentPage * puzzlesPerPage
  );

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      default: return difficulty;
    }
  };

  const getDateStatus = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return { text: "Aujourd'hui", color: 'text-blue-600' };
    if (isFuture(date)) return { text: 'À venir', color: 'text-purple-600' };
    return { text: 'Passé', color: 'text-gray-600' };
  };

  if (showCreateForm) {
    return (
      <CreateCrosswordGame 
        onBack={() => {
          setShowCreateForm(false);
          setEditingPuzzle(null);
          loadPuzzles();
        }}
        editPuzzleId={editingPuzzle}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Puzzles</h1>
            <p className="text-gray-600 mt-1">
              Gérez tous vos puzzles de mots croisés
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            Nouveau Puzzle
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par titre ou date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="published">Publiés</option>
              <option value="draft">Brouillons</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">{puzzles.length}</div>
          <div className="text-sm text-gray-600">Total Puzzles</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {puzzles.filter(p => p.isPublished).length}
          </div>
          <div className="text-sm text-gray-600">Publiés</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">
            {puzzles.filter(p => !p.isPublished).length}
          </div>
          <div className="text-sm text-gray-600">Brouillons</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">
            {puzzles.filter(p => isFuture(parseISO(p.date))).length}
          </div>
          <div className="text-sm text-gray-600">À venir</div>
        </div>
      </div>

      {/* Puzzles Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des puzzles...</p>
          </div>
        ) : currentPuzzles.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun puzzle trouvé</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Aucun puzzle ne correspond à vos critères de recherche'
                : 'Commencez par créer votre premier puzzle'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mx-auto"
              >
                <Plus size={16} />
                Créer un puzzle
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Titre & Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulté
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taille
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {currentPuzzles.map((puzzle) => {
                      const dateStatus = getDateStatus(puzzle.date);
                      return (
                        <motion.tr
                          key={puzzle.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {puzzle.title}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Calendar size={14} />
                                {format(parseISO(puzzle.date), 'dd/MM/yyyy', { locale: fr })}
                                <span className={`text-xs ${dateStatus.color}`}>
                                  ({dateStatus.text})
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(puzzle.difficulty)}`}>
                              {getDifficultyText(puzzle.difficulty)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {puzzle.isPublished ? (
                                <>
                                  <CheckCircle className="text-green-500" size={16} />
                                  <span className="text-green-700 text-sm">Publié</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="text-orange-500" size={16} />
                                  <span className="text-orange-700 text-sm">Brouillon</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {puzzle.rows || 15} × {puzzle.cols || 15}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingPuzzle(puzzle.id);
                                  setShowCreateForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                                title="Modifier"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => togglePublishStatus(puzzle)}
                                className={`p-2 rounded ${
                                  puzzle.isPublished 
                                    ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                                    : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                }`}
                                title={puzzle.isPublished ? 'Dépublier' : 'Publier'}
                              >
                                {puzzle.isPublished ? <XCircle size={16} /> : <CheckCircle size={16} />}
                              </button>
                              <button
                                onClick={() => deletePuzzle(puzzle.id)}
                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Affichage {Math.min((currentPage - 1) * puzzlesPerPage + 1, filteredPuzzles.length)} à {Math.min(currentPage * puzzlesPerPage, filteredPuzzles.length)} sur {filteredPuzzles.length} résultats
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded ${
                          page === currentPage
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ManagePuzzles;
