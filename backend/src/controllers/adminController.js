const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Fonction de validation pour les puzzles
const validatePuzzleData = (data) => {
  const { title, language, grid, cluesHorizontal, cluesVertical, solution } = data;
  const errors = [];
  
  // 1. Vérifier que tous les champs obligatoires sont remplis
  if (!title || title.trim() === '') {
    errors.push('Le titre est obligatoire');
  }
  
  if (!language) {
    errors.push('La langue est obligatoire');
  }
  
  if (!grid || !Array.isArray(grid)) {
    errors.push('La grille est obligatoire');
    return { isValid: false, errors }; // Arrêter ici si pas de grille
  }
  
  if (!solution || !Array.isArray(solution)) {
    errors.push('La solution est obligatoire');
    return { isValid: false, errors };
  }
  
  // 2. Vérifier que toutes les cases non-bloquées sont remplies
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const gridCell = grid[row][col];
      const solutionCell = solution[row][col];
      
      // Si ce n'est pas une case bloquée (#), elle doit être remplie dans la solution
      if (gridCell !== '#' && solutionCell !== '#') {
        if (!solutionCell || solutionCell.trim() === '') {
          errors.push(`Case vide détectée en position (${row + 1}, ${col + 1})`);
        }
      }
    }
  }
  
  // 3. Vérifier les indices
  if (!cluesHorizontal || Object.keys(cluesHorizontal).length === 0) {
    errors.push('Les indices horizontaux sont obligatoires');
  }
  
  if (!cluesVertical || Object.keys(cluesVertical).length === 0) {
    errors.push('Les indices verticaux sont obligatoires');
  }
  
  // Vérifier que les indices ne sont pas vides
  if (cluesHorizontal) {
    Object.entries(cluesHorizontal).forEach(([number, clue]) => {
      if (!clue || clue.trim() === '') {
        errors.push(`L'indice horizontal ${number} est vide`);
      }
    });
  }
  
  if (cluesVertical) {
    Object.entries(cluesVertical).forEach(([number, clue]) => {
      if (!clue || clue.trim() === '') {
        errors.push(`L'indice vertical ${number} est vide`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const createPuzzle = async (req, res) => {
  try {
    const { date, language, gridSize, rows, cols, grid, cluesHorizontal, cluesVertical, solution, title, difficulty, isPublished } = req.body;
    
    // Validation des données
    const validation = validatePuzzleData({ title, language, grid, cluesHorizontal, cluesVertical, solution });
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: validation.errors 
      });
    }
    
    // Use rows/cols if provided, otherwise derive from gridSize (for backward compatibility)
    const puzzleRows = rows || Math.sqrt(gridSize || 225); // Default 15x15 if nothing provided
    const puzzleCols = cols || Math.sqrt(gridSize || 225);
    
    const puzzle = await prisma.crosswordPuzzle.create({
      data: {
        title: title || "Puzzle du jour",
        date: new Date(date),
        language,
        difficulty: difficulty || "medium",
        rows: parseInt(puzzleRows),
        cols: parseInt(puzzleCols),
        grid: JSON.stringify(grid),
        cluesHorizontal: JSON.stringify(cluesHorizontal),
        cluesVertical: JSON.stringify(cluesVertical),
        solution: JSON.stringify(solution),
        isPublished: Boolean(isPublished !== undefined ? isPublished : true),
      },
    });
    
    res.status(201).json(puzzle);
  } catch (error) {
    console.error('Create puzzle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPuzzle = async (req, res) => {
  try {
    const { id } = req.params;
    
    const puzzle = await prisma.crosswordPuzzle.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!puzzle) {
      return res.status(404).json({ error: 'Puzzle not found' });
    }
    
    // Parse JSON strings back to objects
    const parsedPuzzle = {
      ...puzzle,
      grid: JSON.parse(puzzle.grid),
      cluesHorizontal: JSON.parse(puzzle.cluesHorizontal),
      cluesVertical: JSON.parse(puzzle.cluesVertical),
      solution: JSON.parse(puzzle.solution),
    };
    
    res.json(parsedPuzzle);
  } catch (error) {
    console.error('Get puzzle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPuzzlesByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const puzzles = await prisma.crosswordPuzzle.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: nextDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    
    // Parse JSON strings for each puzzle
    const parsedPuzzles = puzzles.map(puzzle => ({
      ...puzzle,
      grid: JSON.parse(puzzle.grid),
      cluesHorizontal: JSON.parse(puzzle.cluesHorizontal),
      cluesVertical: JSON.parse(puzzle.cluesVertical),
      solution: JSON.parse(puzzle.solution),
    }));
    
    res.json(parsedPuzzles);
  } catch (error) {
    console.error('Get puzzles by date error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updatePuzzle = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, language, gridSize, rows, cols, grid, cluesHorizontal, cluesVertical, solution, isPublished, title, difficulty } = req.body;
    
    // Validation des données
    const validation = validatePuzzleData({ title, language, grid, cluesHorizontal, cluesVertical, solution });
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: validation.errors 
      });
    }
    
    // Use rows/cols if provided, otherwise derive from gridSize (for backward compatibility)
    const puzzleRows = rows || Math.sqrt(gridSize || 225); // Default 15x15 if nothing provided
    const puzzleCols = cols || Math.sqrt(gridSize || 225);
    
    const puzzle = await prisma.crosswordPuzzle.update({
      where: { id: parseInt(id) },
      data: {
        title: title || "Puzzle du jour",
        date: new Date(date),
        language,
        difficulty: difficulty || "medium", 
        rows: parseInt(puzzleRows),
        cols: parseInt(puzzleCols),
        grid: JSON.stringify(grid),
        cluesHorizontal: JSON.stringify(cluesHorizontal),
        cluesVertical: JSON.stringify(cluesVertical),
        solution: JSON.stringify(solution),
        isPublished: Boolean(isPublished),
      },
    });
    
    res.json(puzzle);
  } catch (error) {
    console.error('Update puzzle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deletePuzzle = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.crosswordPuzzle.delete({
      where: { id: parseInt(id) },
    });
    
    res.json({ message: 'Puzzle deleted successfully' });
  } catch (error) {
    console.error('Delete puzzle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllPuzzles = async (req, res) => {
  try {
    const puzzles = await prisma.crosswordPuzzle.findMany({
      orderBy: { date: 'desc' },
    });
    
    // Parse JSON strings for each puzzle
    const parsedPuzzles = puzzles.map(puzzle => ({
      ...puzzle,
      grid: JSON.parse(puzzle.grid),
      cluesHorizontal: JSON.parse(puzzle.cluesHorizontal),
      cluesVertical: JSON.parse(puzzle.cluesVertical),
      solution: JSON.parse(puzzle.solution),
    }));
    
    res.json(parsedPuzzles);
  } catch (error) {
    console.error('Get all puzzles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getStats = async (req, res) => {
  try {
    // IMPORTANT: Les statistiques admin comptent TOUS les puzzles (publiés ET non-publiés)
    
    // 1. Nombre total des puzzles (TOUS, même non-publiés)
    const totalPuzzles = await prisma.crosswordPuzzle.count();
    
    // 2. Distribution des langages (TOUS les puzzles)
    const puzzlesByLanguage = await prisma.crosswordPuzzle.groupBy({
      by: ['language'],
      _count: {
        language: true,
      },
    });
    
    // 3. Nombre des puzzles en arabe (TOUS, même non-publiés)
    const arabicPuzzles = await prisma.crosswordPuzzle.count({
      where: { language: 'AR' }
      // Pas de filtre isPublished = compte TOUS les puzzles arabes
    });
    
    // 4. Nombre des puzzles en français (TOUS, même non-publiés) 
    const frenchPuzzles = await prisma.crosswordPuzzle.count({
      where: { language: 'FR' }
      // Pas de filtre isPublished = compte TOUS les puzzles français
    });
    
    // 5. Nombre des puzzles résolus (total des completions)
    const totalCompletions = await prisma.playerStats.aggregate({
      _sum: {
        puzzlesCompleted: true,
        totalTimeSpent: true,
      },
    });
    
    // Stats supplémentaires pour les graphiques
    const playerStats = await prisma.playerStats.findMany({
      orderBy: { date: 'desc' },
      take: 30, // Last 30 entries
    });
    
    const avgTimePerPuzzle = totalCompletions._sum.puzzlesCompleted > 0 
      ? totalCompletions._sum.totalTimeSpent / totalCompletions._sum.puzzlesCompleted 
      : 0;
    
    // Distribution des langages formatée
    const languageDistribution = puzzlesByLanguage.reduce((acc, curr) => {
      acc[curr.language] = curr._count.language;
      return acc;
    }, {});
    
    // Debug logging pour vérifier les comptes
    console.log('📊 Statistiques admin calculées:');
    console.log(`- Total puzzles: ${totalPuzzles}`);
    console.log(`- Puzzles arabes: ${arabicPuzzles}`);
    console.log(`- Puzzles français: ${frenchPuzzles}`);
    console.log(`- Distribution:`, languageDistribution);
    
    res.json({
      // Statistiques principales demandées
      totalPuzzles,                                           // 2. nombre des puzzles 
      puzzlesResolved: totalCompletions._sum.puzzlesCompleted || 0, // 3. nombres des puzzles résolues
      arabicPuzzles,                                         // 4. nombre des puzzles en arabe
      frenchPuzzles,                                         // 5. nombre des puzzles en français  
      languageDistribution,                                  // 1. distribution des langages
      
      // Stats supplémentaires existantes
      puzzlesByLanguage: languageDistribution,
      totalCompletions: totalCompletions._sum.puzzlesCompleted || 0,
      totalTimeSpent: totalCompletions._sum.totalTimeSpent || 0,
      averageTimePerPuzzle: Math.round(avgTimePerPuzzle),
      recentStats: playerStats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createPuzzle,
  getPuzzle,
  getPuzzlesByDate,
  updatePuzzle,
  deletePuzzle,
  getAllPuzzles,
  getStats,
};
