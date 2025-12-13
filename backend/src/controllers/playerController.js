const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getTodaysPuzzles = async (req, res) => {
  try {
    console.log('=== GET TODAYS PUZZLES ===');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    console.log('Date range:', today, 'to', tomorrow);
    
    const puzzles = await prisma.crosswordPuzzle.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
        isPublished: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    
    console.log('Found puzzles:', puzzles.length);
    
  // Parse JSON strings and hide solutions for players
  const parsedPuzzles = puzzles.map(puzzle => {
    console.log('Processing puzzle:', puzzle.id);
    console.log('CluesHorizontal raw:', puzzle.cluesHorizontal);
    console.log('CluesVertical raw:', puzzle.cluesVertical);
    
    // Parse the original grid
    const originalGrid = JSON.parse(puzzle.grid);
    console.log('Original grid:', originalGrid);
    
    // Create empty player grid (keep structure but empty cells)
    const playerGrid = originalGrid.map(row => 
      row.map(cell => cell === '#' ? '#' : '') // Keep black cells (#), empty others
    );
    
    // Solution grid (complete grid with all letters)
    const solutionGrid = originalGrid; // This is the complete solution
    
    console.log('Player grid:', playerGrid);
    console.log('Solution grid:', solutionGrid);
    
    return {
      id: puzzle.id,
      title: puzzle.title,
      date: puzzle.date,
      language: puzzle.language,
      difficulty: puzzle.difficulty,
      rows: puzzle.rows,
      cols: puzzle.cols,
      grid: playerGrid, // Empty grid for player to fill
      solution: solutionGrid, // Complete solution for validation
      cluesHorizontal: JSON.parse(puzzle.cluesHorizontal), // Keep as original format
      cluesVertical: JSON.parse(puzzle.cluesVertical), // Keep as original format
      numbering: puzzle.numbering ? JSON.parse(puzzle.numbering) : {},
      createdAt: puzzle.createdAt,
    };
  });    res.json(parsedPuzzles);
  } catch (error) {
    console.error('=== ERREUR GET TODAYS PUZZLES ===');
    console.error('Type:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

const getPuzzlesByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const puzzles = await prisma.crosswordPuzzle.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: nextDate,
        },
        isPublished: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    
    // Parse JSON strings and hide solutions for players
    const parsedPuzzles = puzzles.map(puzzle => {
      // Parse the original grid
      const originalGrid = JSON.parse(puzzle.grid);
      
      // Create empty player grid (keep structure but empty cells)
      const playerGrid = originalGrid.map(row => 
        row.map(cell => cell === '#' ? '#' : '') // Keep black cells (#), empty others
      );
      
      // Solution grid (complete grid with all letters)
      const solutionGrid = originalGrid; // This is the complete solution
      
      return {
        id: puzzle.id,
        title: puzzle.title,
        date: puzzle.date,
        language: puzzle.language,
        difficulty: puzzle.difficulty,
        rows: puzzle.rows,
        cols: puzzle.cols,
        grid: playerGrid, // Empty grid for player to fill
        solution: solutionGrid, // Complete solution for validation
        cluesHorizontal: JSON.parse(puzzle.cluesHorizontal), // Keep as original format
        cluesVertical: JSON.parse(puzzle.cluesVertical), // Keep as original format
        numbering: puzzle.numbering ? JSON.parse(puzzle.numbering) : {},
        createdAt: puzzle.createdAt,
      };
    });
    
    res.json(parsedPuzzles);
  } catch (error) {
    console.error('Get puzzles by date error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const submitSolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { solution, language, timeSpent } = req.body;
    
    // Get the puzzle with the correct solution
    const puzzle = await prisma.crosswordPuzzle.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!puzzle) {
      return res.status(404).json({ error: 'Puzzle not found' });
    }
    
    const correctSolution = JSON.parse(puzzle.solution);
    const isCorrect = JSON.stringify(solution) === JSON.stringify(correctSolution);
    
    if (isCorrect) {
      // Record player stats
      const today = new Date();
      const existingStats = await prisma.playerStats.findFirst({
        where: {
          date: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
          },
          language: language,
        },
      });
      
      if (existingStats) {
        await prisma.playerStats.update({
          where: { id: existingStats.id },
          data: {
            puzzlesCompleted: existingStats.puzzlesCompleted + 1,
            totalTimeSpent: existingStats.totalTimeSpent + timeSpent,
          },
        });
      } else {
        await prisma.playerStats.create({
          data: {
            date: today,
            puzzlesCompleted: 1,
            language: language,
            totalTimeSpent: timeSpent,
          },
        });
      }
    }
    
    res.json({
      correct: isCorrect,
      message: isCorrect ? 'Congratulations! Puzzle solved correctly!' : 'Some answers are incorrect. Keep trying!',
      solution: isCorrect ? correctSolution : null,
    });
  } catch (error) {
    console.error('Submit solution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllPuzzleDates = async (req, res) => {
  try {
    const puzzleDates = await prisma.crosswordPuzzle.findMany({
      select: {
        date: true,
        language: true,
        title: true,
        difficulty: true,
      },
      where: {
        isPublished: true,
      },
      distinct: ['date'],
      orderBy: { date: 'desc' },
    });
    
    res.json(puzzleDates);
  } catch (error) {
    console.error('Get puzzle dates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getTodaysPuzzles,
  getPuzzlesByDate,
  submitSolution,
  getAllPuzzleDates,
};
