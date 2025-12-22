const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Fonction de validation complète pour les puzzles
const validateCompletePuzzleData = (data) => {
  const { title, language, grid, cluesHorizontal, cluesVertical } = data;
  const errors = [];
  
  // 1. Vérifier que tous les champs obligatoires sont remplis
  if (!title || title.trim() === '') {
    errors.push('Le titre est obligatoire et ne peut pas être vide');
  }
  
  if (!language) {
    errors.push('La langue est obligatoire');
  }
  
  if (!grid || !Array.isArray(grid)) {
    errors.push('La grille est obligatoire');
    return { isValid: false, errors }; // Arrêter ici si pas de grille
  }
  
  // 2. Vérifier que toutes les cases non-bloquées sont remplies
  let emptyCellsCount = 0;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      
      // Si ce n'est pas une case bloquée (#), elle doit être remplie
      if (cell !== '#') {
        if (!cell || cell.trim() === '') {
          emptyCellsCount++;
          if (emptyCellsCount <= 5) { // Limiter les messages d'erreur
            errors.push(`Case vide détectée à la ligne ${row + 1}, colonne ${col + 1}`);
          }
        }
      }
    }
  }
  
  if (emptyCellsCount > 5) {
    errors.push(`... et ${emptyCellsCount - 5} autres cases vides`);
  }
  
  // 3. Vérifier les indices
  if (!cluesHorizontal || Object.keys(cluesHorizontal).length === 0) {
    errors.push('Au moins un indice horizontal est requis');
  } else {
    Object.entries(cluesHorizontal).forEach(([number, clue]) => {
      if (!clue || clue.trim() === '') {
        errors.push(`L'indice horizontal ${number} ne peut pas être vide`);
      }
    });
  }
  
  if (!cluesVertical || Object.keys(cluesVertical).length === 0) {
    errors.push('Au moins un indice vertical est requis');
  } else {
    Object.entries(cluesVertical).forEach(([number, clue]) => {
      if (!clue || clue.trim() === '') {
        errors.push(`L'indice vertical ${number} ne peut pas être vide`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation des caractères selon la langue
const validateCharacters = (grid, language) => {
  const frenchRegex = /^[A-Za-zÀ-ÿ#\s]*$/;
  const arabicRegex = /^[\u0600-\u06FF#\s]*$/;
  
  // Vérification que grid est un tableau
  if (!Array.isArray(grid)) {
    return { valid: false, error: 'Format de grille invalide - doit être un tableau' };
  }
  
  for (let row of grid) {
    // Vérification que chaque ligne est un tableau
    if (!Array.isArray(row)) {
      return { valid: false, error: 'Format de ligne invalide - doit être un tableau' };
    }
    
    for (let cell of row) {
      if (cell === '#' || cell === '') continue;
      
      if (language === 'FR' && !frenchRegex.test(cell)) {
        return { valid: false, error: 'Caractères français uniquement autorisés' };
      }
      if (language === 'AR' && !arabicRegex.test(cell)) {
        return { valid: false, error: 'Caractères arabes uniquement autorisés' };
      }
    }
  }
  return { valid: true };
};

// Génération automatique de la numérotation
const generateNumbering = (grid) => {
  const rows = grid.length;
  const cols = grid[0].length;
  const numbering = Array(rows).fill().map(() => Array(cols).fill(''));
  let currentNumber = 1;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j] === '#') continue;
      
      let needsNumber = false;
      
      // Vérifie si c'est le début d'un mot horizontal
      const isHorizontalStart = (j === 0 || grid[i][j-1] === '#') && 
                               j < cols - 1 && grid[i][j+1] !== '#';
      
      // Vérifie si c'est le début d'un mot vertical
      const isVerticalStart = (i === 0 || grid[i-1][j] === '#') && 
                             i < rows - 1 && grid[i+1][j] !== '#';
      
      if (isHorizontalStart || isVerticalStart) {
        numbering[i][j] = currentNumber.toString();
        currentNumber++;
      }
    }
  }
  
  return numbering;
};

// Extraction des mots et leurs positions
const extractWords = (grid, numbering) => {
  const rows = grid.length;
  const cols = grid[0].length;
  const horizontalWords = {};
  const verticalWords = {};

  // Mots horizontaux
  for (let i = 0; i < rows; i++) {
    let currentWord = '';
    let wordNumber = '';
    let startCol = -1;
    
    for (let j = 0; j < cols; j++) {
      if (grid[i][j] !== '#') {
        if (currentWord === '') {
          startCol = j;
          wordNumber = numbering[i][j];
        }
        currentWord += grid[i][j] || '_';
      } else {
        if (currentWord.length > 1 && wordNumber) {
          horizontalWords[wordNumber] = {
            word: currentWord,
            row: i,
            startCol: startCol,
            length: currentWord.length
          };
        }
        currentWord = '';
        wordNumber = '';
      }
    }
    
    // Mot à la fin de la ligne
    if (currentWord.length > 1 && wordNumber) {
      horizontalWords[wordNumber] = {
        word: currentWord,
        row: i,
        startCol: startCol,
        length: currentWord.length
      };
    }
  }

  // Mots verticaux
  for (let j = 0; j < cols; j++) {
    let currentWord = '';
    let wordNumber = '';
    let startRow = -1;
    
    for (let i = 0; i < rows; i++) {
      if (grid[i][j] !== '#') {
        if (currentWord === '') {
          startRow = i;
          wordNumber = numbering[i][j];
        }
        currentWord += grid[i][j] || '_';
      } else {
        if (currentWord.length > 1 && wordNumber) {
          verticalWords[wordNumber] = {
            word: currentWord,
            row: startRow,
            startCol: j,
            length: currentWord.length
          };
        }
        currentWord = '';
        wordNumber = '';
      }
    }
    
    // Mot à la fin de la colonne
    if (currentWord.length > 1 && wordNumber) {
      verticalWords[wordNumber] = {
        word: currentWord,
        row: startRow,
        startCol: j,
        length: currentWord.length
      };
    }
  }

  return { horizontalWords, verticalWords };
};

// Créer un nouveau puzzle
const createCrosswordPuzzle = async (req, res) => {
  try {
    console.log('=== Données reçues ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const { 
      title = "Puzzle du jour",
      date, 
      language, 
      difficulty = "medium",
      isPublished = true,
      rows, 
      cols, 
      grid, 
      cluesHorizontal, 
      cluesVertical 
    } = req.body;
    
    console.log('=== Données extraites ===');
    console.log('Grid type:', typeof grid);
    console.log('Grid is array:', Array.isArray(grid));
    console.log('Grid value:', grid);

    // Minimal server-side validation per product request:
    // Only require rows, cols, date and language. Accept partial/incomplete puzzles.
    console.log('=== Validation minimale (rows, cols, date, language) ===');
    const missing = [];
    if (!rows) missing.push('rows');
    if (!cols) missing.push('cols');
    if (!date) missing.push('date');
    if (!language) missing.push('language');

    if (missing.length > 0) {
      console.log('Champs manquants:', missing);
      return res.status(400).json({
        error: 'Champs requis manquants',
        missing,
        message: `Les champs suivants sont requis: ${missing.join(', ')}`
      });
    }

    // Ensure numeric rows/cols
    const parsedRows = parseInt(rows, 10);
    const parsedCols = parseInt(cols, 10);

    if (isNaN(parsedRows) || parsedRows <= 0) {
      return res.status(400).json({ error: 'Valeur invalide pour rows' });
    }
    if (isNaN(parsedCols) || parsedCols <= 0) {
      return res.status(400).json({ error: 'Valeur invalide pour cols' });
    }

    // Ensure grid exists and is well-formed; if not provided, create an empty grid of the given size
    let safeGrid = grid;
    if (!Array.isArray(safeGrid) || safeGrid.length !== parsedRows || !Array.isArray(safeGrid[0]) || safeGrid[0].length !== parsedCols) {
      console.log('Grid manquante ou dimension invalide - création d\'une grille vide');
      safeGrid = Array(parsedRows).fill().map(() => Array(parsedCols).fill(''));
    }

    // Ensure clues objects exist
    const safeCluesHorizontal = cluesHorizontal || {};
    const safeCluesVertical = cluesVertical || {};

    // Génération de la numérotation
    console.log('=== Génération numérotation ===');
    const numbering = generateNumbering(safeGrid);
    console.log('Numbering generated:', numbering);
    
    // Extraction des mots (pour information, mais on ne valide plus les indices manquants)
    console.log('=== Extraction des mots ===');
    const { horizontalWords, verticalWords } = extractWords(safeGrid, numbering);
    console.log('Horizontal words:', horizontalWords);
    console.log('Vertical words:', verticalWords);
    
    console.log('=== Indices fournis ===');
    console.log('Horizontal clues keys:', Object.keys(safeCluesHorizontal));
    console.log('Vertical clues keys:', Object.keys(safeCluesVertical));

    // On accepte les indices fournis par le frontend sans validation stricte
    // car le frontend gère sa propre logique de numérotation ligne/colonne

    // Vérifier si un puzzle existe déjà pour cette date
    console.log('=== Vérification puzzles existants pour cette date ===');
    console.log('Date recherchée:', date);
    console.log('Date parsée:', new Date(date));
    
    // Compter les puzzles existants pour cette date
    const existingPuzzlesCount = await prisma.crosswordPuzzle.count({
      where: {
        date: new Date(date)
      }
    });
    
    console.log('Nombre de puzzles existants pour cette date:', existingPuzzlesCount);

    // Générer un titre unique si pas fourni ou s'il existe déjà des puzzles
    let finalTitle = title;
    if (existingPuzzlesCount > 0) {
      if (!title || title === 'Puzzle du jour') {
        finalTitle = `Puzzle du jour ${existingPuzzlesCount + 1}`;
      } else {
        // Vérifier si le titre existe déjà pour cette date
        const titleExists = await prisma.crosswordPuzzle.findFirst({
          where: {
            date: new Date(date),
            title: title
          }
        });
        
        if (titleExists) {
          finalTitle = `${title} (${existingPuzzlesCount + 1})`;
        }
      }
    }

    // Toujours créer un nouveau puzzle (plus de remplacement)
    console.log('=== Création nouveau puzzle ===');
    console.log('Données à sauvegarder:', {
      title: finalTitle, date, language, difficulty, isPublished, rows: parsedRows, cols: parsedCols
    });
    
    const puzzle = await prisma.crosswordPuzzle.create({
      data: {
        title: finalTitle,
        date: new Date(date),
        language,
        difficulty,
        rows: parsedRows,
        cols: parsedCols,
        grid: JSON.stringify(safeGrid),
        cluesHorizontal: JSON.stringify(safeCluesHorizontal),
        cluesVertical: JSON.stringify(safeCluesVertical),
        solution: JSON.stringify(safeGrid),
        numbering: JSON.stringify(numbering),
        isPublished
      }
    });

    res.status(201).json({
      success: true,
      puzzle: {
        id: puzzle.id,
        date: puzzle.date,
        language: puzzle.language,
        rows: puzzle.rows,
        cols: puzzle.cols,
        numbering: JSON.parse(puzzle.numbering),
        wordsFound: { horizontalWords, verticalWords }
      }
    });

  } catch (error) {
    console.error('=== ERREUR CRÉATION PUZZLE ===');
    console.error('Type:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Code:', error.code);
    if (error.meta) console.error('Meta:', error.meta);
    
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message,
      type: error.name,
      code: error.code
    });
  }
};

// Récupérer puzzles pour édition (peut être plusieurs par jour)
const getPuzzleForEdit = async (req, res) => {
  try {
    const { date } = req.params;
    const { id } = req.query; // Optionnel: ID spécifique du puzzle
    
    // Find puzzle by date (match the whole day) to avoid timezone/exact-time issues
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    if (id) {
      // Si un ID spécifique est fourni, récupérer ce puzzle
      const puzzle = await prisma.crosswordPuzzle.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!puzzle || puzzle.date < targetDate || puzzle.date >= nextDate) {
        return res.status(404).json({ 
          error: 'Puzzle non trouvé pour cette date et cet ID' 
        });
      }
      
      const response = {
        id: puzzle.id,
        title: puzzle.title,
        date: puzzle.date,
        language: puzzle.language,
        difficulty: puzzle.difficulty,
        isPublished: puzzle.isPublished,
        rows: puzzle.rows,
        cols: puzzle.cols,
        grid: JSON.parse(puzzle.grid),
        cluesHorizontal: JSON.parse(puzzle.cluesHorizontal),
        cluesVertical: JSON.parse(puzzle.cluesVertical),
        numbering: JSON.parse(puzzle.numbering)
      };
      
      return res.json(response);
    }

    // Sinon, récupérer tous les puzzles de la date
    const puzzles = await prisma.crosswordPuzzle.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: nextDate
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (puzzles.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun puzzle trouvé pour cette date' 
      });
    }

    // Si un seul puzzle, le retourner directement
    if (puzzles.length === 1) {
      const puzzle = puzzles[0];
      const response = {
        id: puzzle.id,
        title: puzzle.title,
        date: puzzle.date,
        language: puzzle.language,
        difficulty: puzzle.difficulty,
        isPublished: puzzle.isPublished,
        rows: puzzle.rows,
        cols: puzzle.cols,
        grid: JSON.parse(puzzle.grid),
        cluesHorizontal: JSON.parse(puzzle.cluesHorizontal),
        cluesVertical: JSON.parse(puzzle.cluesVertical),
        numbering: JSON.parse(puzzle.numbering)
      };
      
      return res.json(response);
    }

    // Si plusieurs puzzles, retourner la liste pour que le frontend puisse choisir
    const puzzlesList = puzzles.map(puzzle => ({
      id: puzzle.id,
      title: puzzle.title,
      date: puzzle.date,
      language: puzzle.language,
      difficulty: puzzle.difficulty,
      isPublished: puzzle.isPublished,
      rows: puzzle.rows,
      cols: puzzle.cols
    }));

    res.json({
      multiple: true,
      puzzles: puzzlesList
    });

  } catch (error) {
    console.error('Erreur récupération puzzle:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  }
};

// Prévisualiser les mots détectés
const previewWords = async (req, res) => {
  try {
    const { grid, language } = req.body;

    // Validation des caractères
    const charValidation = validateCharacters(grid, language);
    if (!charValidation.valid) {
      return res.status(400).json({ 
        error: charValidation.error 
      });
    }

    const numbering = generateNumbering(grid);
    const { horizontalWords, verticalWords } = extractWords(grid, numbering);

    res.json({
      success: true,
      numbering,
      horizontalWords,
      verticalWords
    });

  } catch (error) {
    console.error('Erreur prévisualisation:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  }
};

// Toggle publish status of a puzzle
const togglePuzzlePublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First get the current puzzle
    const currentPuzzle = await prisma.crosswordPuzzle.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!currentPuzzle) {
      return res.status(404).json({ error: 'Puzzle not found' });
    }
    
    // Toggle the publish status
    const updatedPuzzle = await prisma.crosswordPuzzle.update({
      where: { id: parseInt(id) },
      data: {
        isPublished: !currentPuzzle.isPublished
      }
    });
    
    console.log(`Puzzle ${id} publish status changed from ${currentPuzzle.isPublished} to ${updatedPuzzle.isPublished}`);
    
    res.json({
      success: true,
      id: updatedPuzzle.id,
      isPublished: updatedPuzzle.isPublished,
      message: `Puzzle ${updatedPuzzle.isPublished ? 'published' : 'unpublished'} successfully`
    });
    
  } catch (error) {
    console.error('Toggle publish status error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

module.exports = {
  createCrosswordPuzzle,
  getPuzzleForEdit,
  previewWords,
  togglePuzzlePublishStatus
};
