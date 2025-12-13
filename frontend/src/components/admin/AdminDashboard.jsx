import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Globe, 
  Target, 
  CheckCircle, 
  Languages,
  Activity
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data);
      console.log('Dashboard stats loaded:', response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchStats}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Activity className="w-4 h-4" />
            <span>Actualiser</span>
          </motion.button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          </div>
        </div>
        <p className="text-gray-500">Impossible de charger les statistiques</p>
      </div>
    );
  }

  // VOS 4 MÉTRIQUES (sans puzzles résolus)
  const myStats = [
    {
      title: 'Nombre des puzzles',
      value: stats.totalPuzzles || 0,
      icon: Target,
      color: 'blue'
    },
    {
      title: 'Puzzles en arabe',
      value: stats.arabicPuzzles || 0,
      icon: Globe,
      color: 'purple'
    },
    {
      title: 'Puzzles en français',
      value: stats.frenchPuzzles || 0,
      icon: Languages,
      color: 'orange'
    }
  ];

  // Distribution des langages (votre métrique #1)
  const totalPuzzles = (stats.arabicPuzzles + stats.frenchPuzzles) || 1;
  const arabicPercent = Math.round((stats.arabicPuzzles / totalPuzzles) * 100);
  const frenchPercent = 100 - arabicPercent;

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800'
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchStats}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Activity className="w-4 h-4" />
          <span>Actualiser</span>
        </motion.button>
      </div>

      {/* Grille principale avec cartes et camembert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Cartes des métriques */}
        <div className="space-y-6">
          {myStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-6 rounded-2xl border-2 ${colorClasses[stat.color]} hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-8 h-8" />
                  <span className="text-3xl font-bold">{stat.value}</span>
                </div>
                <h3 className="font-semibold">{stat.title}</h3>
              </motion.div>
            );
          })}
        </div>

        {/* Graphique camembert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Distribution des langages</h2>
          
          <div className="flex items-center justify-center">
            {/* Camembert SVG */}
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Partie Arabe (violet) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="20"
                  strokeDasharray={`${arabicPercent * 2.51} 251`}
                  className="transition-all duration-1000"
                />
                {/* Partie Français (orange) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="20"
                  strokeDasharray={`${frenchPercent * 2.51} 251`}
                  strokeDashoffset={`${-arabicPercent * 2.51}`}
                  className="transition-all duration-1000"
                />
              </svg>
              
              {/* Centre avec total */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{totalPuzzles}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Légende */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-600 rounded"></div>
                <span className="font-medium">Arabe</span>
              </div>
              <span className="font-semibold">
                {arabicPercent}% ({stats.arabicPuzzles || 0})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-orange-600 rounded"></div>
                <span className="font-medium">Français</span>
              </div>
              <span className="font-semibold">
                {frenchPercent}% ({stats.frenchPuzzles || 0})
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
