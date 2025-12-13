import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Eye, Grid, Type, HelpCircle, Check, X, ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CreateCrosswordGame = ({ onBack, editPuzzleId }) => {
  const [gridSize, setGridSize] = useState({ rows: 15, cols: 15 });
  const [grid, setGrid] = useState([]);
  const [clues, setClues] = useState({ across: {}, down: {} });
  const [numbering, setNumbering] = useState({});
  const [words, setWords] = useState({ across: [], down: [] });
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [puzzleTitle, setPuzzleTitle] = useState('Puzzle du jour');
  const [difficulty, setDifficulty] = useState('medium');
  const [language, setLanguage] = useState('french'); // french or arabic
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPuzzleId, setCurrentPuzzleId] = useState(null); // ID du puzzle en cours d'édition

  const [currentStep, setCurrentStep] = useState('create'); // create (grille + indices)
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);

  // Style pour le support de l'arabe
  const getTextStyleForLanguage = () => {
    if (language === 'arabic') {
      return {
        direction: 'rtl',
        fontFamily: 'Arial, "Noto Sans Arabic", "Traditional Arabic", sans-serif',
        fontSize: '16px',
        lineHeight: '1.2'
      };
    }
    return {
      direction: 'ltr',
      fontFamily: 'inherit',
      fontSize: 'inherit'
    };
  };

  // Fonction pour calculer le statut de validation en temps réel
  const getValidationStatus = () => {
    const status = {
      title: puzzleTitle && puzzleTitle.trim() !== '',
      date: selectedDate !== '',
      gridFilled: false,
      hasWords: words.across.length + words.down.length >= 5,
      hasClues: true
    };

    // Vérifier la grille
    let filledCells = 0;
    let totalNonBlockedCells = 0;
    
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        const cell = grid[i][j];
        if (!cell.isBlocked) {
          totalNonBlockedCells++;
          if (cell.value && cell.value.trim() !== '') {
            filledCells++;
          }
        }
      }
    }
    
    status.gridFilled = totalNonBlockedCells > 0 && filledCells === totalNonBlockedCells;

    // Vérifier les indices
    const missingClues = [];
    words.across.forEach(word => {
      if (!clues.across[word.number]?.trim()) {
        missingClues.push(word.number);
      }
    });
    words.down.forEach(word => {
      if (!clues.down[word.number]?.trim()) {
        missingClues.push(word.number);
      }
    });
    
    status.hasClues = missingClues.length === 0;
    status.missingClues = missingClues;
    status.cellStats = { filled: filledCells, total: totalNonBlockedCells };

    return status;
  };

  // Initialiser la grille seulement si on n'est pas en mode édition
  useEffect(() => {
    if (!editPuzzleId) {
      initializeGrid();
    }
  }, [gridSize, editPuzzleId]);

  // Charger un puzzle existant si en mode édition
  useEffect(() => {
    if (editPuzzleId) {
      loadExistingPuzzleById(editPuzzleId);
    }
  }, [editPuzzleId]);

  const initializeGrid = () => {
    const newGrid = Array(gridSize.rows).fill().map(() => 
      Array(gridSize.cols).fill().map(() => ({ 
        value: '', 
        isBlocked: false,
        isLocked: false,
        number: null,
        isHighlighted: false 
      }))
    );
    setGrid(newGrid);
    setClues({ across: {}, down: {} });
    setWords({ across: [], down: [] });
    setNumbering({});
  };

  const loadExistingPuzzleById = async (puzzleId) => {
    try {
      console.log('Loading puzzle by ID:', puzzleId);
      const response = await api.get(`/admin/get-puzzle/${puzzleId}`);
      const puzzle = response.data;
      
      console.log('Loaded puzzle data:', puzzle);
      
      if (puzzle && puzzle.grid) {
        console.log('Setting puzzle data:', {
          id: puzzle.id,
          rows: puzzle.rows,
          cols: puzzle.cols,
          title: puzzle.title,
          difficulty: puzzle.difficulty,
          language: puzzle.language,
          isPublished: puzzle.isPublished,
          gridLength: puzzle.grid?.length,
          cluesHorizontal: Object.keys(puzzle.cluesHorizontal || {}),
          cluesVertical: Object.keys(puzzle.cluesVertical || {})
        });
        
        // Set the puzzle ID for editing mode
        setCurrentPuzzleId(puzzle.id);
        
        // Set all the basic properties first
        setPuzzleTitle(puzzle.title || '');
        setDifficulty(puzzle.difficulty || 'medium');
        setLanguage(puzzle.language === 'AR' ? 'arabic' : 'french');
        setIsPublished(puzzle.isPublished || false);
        
        // Set the date from the loaded puzzle
        if (puzzle.date) {
          const puzzleDate = new Date(puzzle.date);
          setSelectedDate(format(puzzleDate, 'yyyy-MM-dd'));
        }
        
        // Convert grid from backend format to frontend format
        console.log('Converting grid from backend format:', puzzle.grid);
        console.log('Grid type:', typeof puzzle.grid, 'isArray:', Array.isArray(puzzle.grid));
        
        if (!Array.isArray(puzzle.grid)) {
          throw new Error(`Invalid grid format: expected array, got ${typeof puzzle.grid}`);
        }
        
        const frontendGrid = puzzle.grid.map((row, rowIndex) => {
          if (!Array.isArray(row)) {
            throw new Error(`Invalid row at index ${rowIndex}: expected array, got ${typeof row}`);
          }
          return row.map((cell, colIndex) => {
            console.log(`Converting cell [${rowIndex}][${colIndex}]: "${cell}" -> isBlocked: ${cell === '#'}, value: "${cell === '#' ? '' : cell}"`);
            return {
              value: cell === '#' ? '' : cell,
              isBlocked: cell === '#',
              isLocked: false,
              number: null,
              isHighlighted: false
            };
          });
        });
        
        console.log('Converted frontend grid:', frontendGrid);
        console.log('Setting clues:', { across: puzzle.cluesHorizontal, down: puzzle.cluesVertical });
        
        // Set grid size first
        const newGridSize = { rows: puzzle.rows, cols: puzzle.cols };
        console.log('Setting new grid size for editing:', newGridSize);
        setGridSize(newGridSize);
        
        // Set grid data
        setGrid(frontendGrid);
        setNumbering(puzzle.numbering || {});
        
        // Regenerate words and clues for the loaded grid size
        setTimeout(() => {
          console.log('Regenerating words and clues for editing mode with size:', newGridSize);
          
          // Generate words for the new grid size
          const editWords = { across: [], down: [] };
          
          // Create words for each row (horizontal)
          for (let row = 0; row < newGridSize.rows; row++) {
            editWords.across.push({
              number: row + 1,
              length: newGridSize.cols,
              startRow: row,
              startCol: 0,
              clue: ''
            });
          }
          
          // Create words for each column (vertical)
          for (let col = 0; col < newGridSize.cols; col++) {
            editWords.down.push({
              number: col + 1,
              length: newGridSize.rows,
              startRow: 0,
              startCol: col,
              clue: ''
            });
          }
          
          console.log('Generated edit words:', {
            acrossCount: editWords.across.length,
            downCount: editWords.down.length
          });
          
          setWords(editWords);
          
          // Set loaded clues 
          setClues({ 
            across: puzzle.cluesHorizontal || {}, 
            down: puzzle.cluesVertical || {} 
          });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading puzzle:', error);
      
      if (error.message.includes('Invalid grid format')) {
        toast.error('Format de grille invalide: ' + error.message);
      } else if (error.response?.status === 404) {
        toast.error('Aucun puzzle trouvé pour cette date');
      } else {
        toast.error('Erreur lors du chargement du puzzle: ' + (error.message || 'Erreur inconnue'));
      }
    }
  };

  const handleCellClick = (row, col) => {
    const newGrid = [...grid];
    const cell = newGrid[row][col];
    
    // Clic sur cellule = la rendre noire et non modifiable
    cell.isBlocked = true;
    cell.isLocked = false;
    cell.value = ''; // Vider la valeur quand on bloque
    
    setGrid(newGrid);
    generateNumbering();
  };

  const handleCellUnblock = (row, col) => {
    const newGrid = [...grid];
    const cell = newGrid[row][col];
    
    // Double-clic sur cellule noire = la débloquer
    cell.isBlocked = false;
    cell.isLocked = false;
    
    setGrid(newGrid);
    generateNumbering();
  };

  const handleCellEdit = (row, col, value) => {
    const newGrid = [...grid];
    newGrid[row][col].value = value.toUpperCase();
    setGrid(newGrid);
  };

  const handleCellEditComplete = () => {
    setEditingCell(null);
  };

  // Fonction pour trouver la cellule suivante disponible selon la direction
  const findNextEditableCell = (currentRow, currentCol) => {
    const totalRows = gridSize.rows;
    const totalCols = gridSize.cols;
    const isRTL = language === 'arabic';
    
    let nextCol, nextRow;
    
    if (isRTL) {
      // Direction droite à gauche pour l'arabe
      nextCol = currentCol - 1;
      nextRow = currentRow;
      
      // Si on dépasse à gauche, passer à la ligne suivante, position la plus à droite
      if (nextCol < 0) {
        nextCol = totalCols - 1;
        nextRow = currentRow + 1;
      }
      
      // Chercher la prochaine cellule non bloquée (RTL)
      for (let r = nextRow; r < totalRows; r++) {
        const startCol = (r === nextRow ? nextCol : totalCols - 1);
        for (let c = startCol; c >= 0; c--) {
          if (!grid[r][c].isBlocked) {
            return { row: r, col: c };
          }
        }
      }
      
      // Si pas trouvé, chercher depuis le début (RTL)
      for (let r = 0; r <= currentRow; r++) {
        const endCol = (r === currentRow ? currentCol : 0);
        for (let c = totalCols - 1; c > endCol; c--) {
          if (!grid[r][c].isBlocked) {
            return { row: r, col: c };
          }
        }
      }
    } else {
      // Direction gauche à droite pour le français (comportement original)
      nextCol = currentCol + 1;
      nextRow = currentRow;
      
      // Si on dépasse la ligne, passer à la ligne suivante
      if (nextCol >= totalCols) {
        nextCol = 0;
        nextRow = currentRow + 1;
      }
      
      // Chercher la prochaine cellule non bloquée (LTR)
      for (let r = nextRow; r < totalRows; r++) {
        for (let c = (r === nextRow ? nextCol : 0); c < totalCols; c++) {
          if (!grid[r][c].isBlocked) {
            return { row: r, col: c };
          }
        }
      }
      
      // Si pas trouvé, chercher depuis le début (LTR)
      for (let r = 0; r <= currentRow; r++) {
        for (let c = 0; c < (r === currentRow ? currentCol : totalCols); c++) {
          if (!grid[r][c].isBlocked) {
            return { row: r, col: c };
          }
        }
      }
    }
    
    return null; // Aucune cellule disponible
  };

  const handleCellInput = (row, col, value) => {
    const newGrid = [...grid];
    const cell = newGrid[row][col];
    
    if (!cell.isBlocked && !cell.isLocked && value.length <= 1) {
      // Validation des caractères selon la langue
      let validChars;
      if (language === 'arabic') {
        // Caractères arabes (lettres de base)
        validChars = /^[\u0621-\u064A\u0660-\u0669]*$/;
      } else {
        // Caractères français/latins
        validChars = /^[a-zA-ZÀ-ÿ]*$/;
      }
      
      if (value === '' || validChars.test(value)) {
        // Pour l'arabe, ne pas convertir en majuscule
        cell.value = language === 'arabic' ? value : value.toUpperCase();
        setGrid(newGrid);
        generateNumbering(); // Régénérer la numérotation après changement
        
        // Si une lettre a été saisie, passer à la cellule suivante
        if (value !== '') {
          const nextCell = findNextEditableCell(row, col);
          if (nextCell) {
            // Délai court pour permettre la mise à jour de l'UI
            setTimeout(() => {
              const nextInput = document.querySelector(`input[data-row="${nextCell.row}"][data-col="${nextCell.col}"]`);
              if (nextInput) {
                nextInput.focus();
                nextInput.select();
              }
            }, 50);
          }
        }
      }
    }
  };

  const generateNumbering = useCallback(() => {
    console.log('Generating simple numbering with gridSize:', gridSize);
    const newWords = { across: [], down: [] };

    // Système simple : 1 indice par ligne (horizontal) et 1 indice par colonne (vertical)
    
    // Créer automatiquement un indice pour CHAQUE ligne (1 à gridSize.rows)
    for (let row = 0; row < gridSize.rows; row++) {
      newWords.across.push({
        number: row + 1, // Numéro de ligne (1, 2, 3, ...)
        length: gridSize.cols, // Toute la largeur
        startRow: row,
        startCol: 0,
        cells: Array.from({ length: gridSize.cols }, (_, col) => ({ row, col })),
        clue: ''
      });
    }

    // Créer automatiquement un indice pour CHAQUE colonne (1 à gridSize.cols)
    for (let col = 0; col < gridSize.cols; col++) {
      newWords.down.push({
        number: col + 1, // Numéro de colonne (1, 2, 3, ...)
        length: gridSize.rows, // Toute la hauteur
        startRow: 0,
        startCol: col,
        cells: Array.from({ length: gridSize.rows }, (_, row) => ({ row, col })),
        clue: ''
      });
    }

    console.log('Generated simple words:', { 
      acrossCount: newWords.across.length, 
      downCount: newWords.down.length,
      acrossNumbers: newWords.across.map(w => w.number),
      downNumbers: newWords.down.map(w => w.number)
    });
    
    setWords(newWords);
  }, [gridSize]);

  // Initialiser les indices de manière simple (1-N pour lignes et colonnes)
  const initializeClues = useCallback(() => {
    console.log('Initializing simple clues for gridSize:', gridSize);
    
    setClues(prevClues => {
      const newClues = { across: {}, down: {} };
      
      // Pour les lignes (across) - 1 à rows
      for (let row = 1; row <= gridSize.rows; row++) {
        newClues.across[row] = prevClues.across?.[row] || '';
      }
      
      // Pour les colonnes (down) - 1 à cols  
      for (let col = 1; col <= gridSize.cols; col++) {
        newClues.down[col] = prevClues.down?.[col] || '';
      }
      
      console.log('Initialized simple clues:', {
        acrossKeys: Object.keys(newClues.across),
        downKeys: Object.keys(newClues.down)
      });
      
      return newClues;
    });
  }, [gridSize.rows, gridSize.cols]);

  // Générer automatiquement les mots quand la grille change
  useEffect(() => {
    generateNumbering();
  }, [generateNumbering]);

  // Initialiser les indices quand les mots changent
  useEffect(() => {
    initializeClues();
  }, [initializeClues]);

  const handleClueChange = (direction, number, value) => {
    setClues(prev => ({
      ...prev,
      [direction]: {
        ...prev[direction],
        [number]: value
      }
    }));
  };

  // Calculer le progrès : cellules remplies / cellules totales non bloquées
  const calculateProgress = () => {
    const totalCells = grid.flat();
    const nonBlockedCells = totalCells.filter(cell => !cell.isBlocked);
    const filledCells = nonBlockedCells.filter(cell => cell.value.trim() !== '');
    
    if (nonBlockedCells.length === 0) return 0;
    
    return {
      filled: filledCells.length,
      total: nonBlockedCells.length,
      percentage: Math.round((filledCells.length / nonBlockedCells.length) * 100)
    };
  };

  const validatePuzzle = () => {
    console.log('Validation complète du puzzle...');
    const errors = [];
    
    // 1. Vérifier que le titre est rempli
    if (!puzzleTitle || puzzleTitle.trim() === '') {
      errors.push('Le titre du puzzle est obligatoire');
    }
    
    // 2. Vérifier que la grille a des cellules remplies (pas toutes bloquées)
    let filledCells = 0;
    let emptyCells = 0;
    let totalNonBlockedCells = 0;
    
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        const cell = grid[i][j];
        if (!cell.isBlocked) {
          totalNonBlockedCells++;
          if (cell.value && cell.value.trim() !== '') {
            filledCells++;
          } else {
            emptyCells++;
          }
        }
      }
    }
    
    if (totalNonBlockedCells === 0) {
      errors.push('La grille ne peut pas être entièrement bloquée');
    } else if (emptyCells > 0) {
      errors.push(`${emptyCells} case(s) non-bloquée(s) sont vides. Toutes les cases non-bloquées doivent être remplies`);
    }
    
    // 3. Vérifier qu'on a assez de mots
    const totalWords = words.across.length + words.down.length;
    if (totalWords < 5) {
      errors.push('Le puzzle doit contenir au moins 5 mots');
    }

    // 4. Vérifier que tous les mots ont des indices
    const missingClues = [];
    words.across.forEach(word => {
      if (!clues.across[word.number]?.trim()) {
        missingClues.push(`${word.number} horizontal`);
      }
    });
    words.down.forEach(word => {
      if (!clues.down[word.number]?.trim()) {
        missingClues.push(`${word.number} vertical`);
      }
    });

    if (missingClues.length > 0) {
      errors.push(`Indices manquants: ${missingClues.slice(0, 3).join(', ')}${missingClues.length > 3 ? '...' : ''}`);
    }
    
    // 5. Vérifier la date
    if (!selectedDate) {
      errors.push('La date est obligatoire');
    }
    
    // Afficher les erreurs
    if (errors.length > 0) {
      console.log('Erreurs de validation:', errors);
      errors.forEach(error => toast.error(error));
      return false;
    }
    
    console.log('Validation réussie:', {
      titre: puzzleTitle,
      totalCellsNonBloquees: totalNonBlockedCells,
      cellsRemplies: filledCells,
      totalMots: totalWords,
      indicesHorizontaux: Object.keys(clues.across).length,
      indicesVerticaux: Object.keys(clues.down).length
    });
    
    return true;
  };

  // Function to generate simple numbering synchronously for save
  const generateNumberingSync = () => {
    const newWords = { across: [], down: [] };

    // Système simple : 1 indice par ligne (horizontal) et 1 indice par colonne (vertical)
    
    // Créer automatiquement un indice pour CHAQUE ligne (1 à gridSize.rows)
    for (let row = 0; row < gridSize.rows; row++) {
      newWords.across.push({
        number: row + 1, // Numéro de ligne (1, 2, 3, ...)
        length: gridSize.cols,
        startRow: row,
        startCol: 0
      });
    }

    // Créer automatiquement un indice pour CHAQUE colonne (1 à gridSize.cols)
    for (let col = 0; col < gridSize.cols; col++) {
      newWords.down.push({
        number: col + 1, // Numéro de colonne (1, 2, 3, ...)
        length: gridSize.rows,
        startRow: 0,
        startCol: col
      });
    }

    return newWords;
  };

  const savePuzzle = async () => {
    // Regenerate numbering synchronously before saving
    console.log('Regenerating numbering before save...');
    const currentWords = generateNumberingSync();
    console.log('Generated words for save:', {
      across: currentWords.across.map(w => `${w.number}: ${w.word}`),
      down: currentWords.down.map(w => `${w.number}: ${w.word}`)
    });
    
    // Mettre à jour les mots avec les données actuelles
    setWords(currentWords);
    
    // Validation complète avant sauvegarde
    if (!validatePuzzle()) {
      return;
    }

    setLoading(true);
    try {
      // Convertir le format des données pour correspondre au backend
      const gridForBackend = grid.map((row, rowIndex) => 
        row.map((cell, colIndex) => {
          if (!cell) {
            console.warn(`Cell undefined at [${rowIndex}][${colIndex}]`);
            return '';
          }
          return cell.isBlocked ? '#' : (cell.value || '');
        })
      );

      // Validation côté frontend avant envoi
      console.log('Grid size check:', {
        gridLength: grid.length,
        expectedRows: gridSize.rows,
        firstRowLength: grid[0]?.length,
        expectedCols: gridSize.cols
      });

      // Vérifier que la grille a la bonne taille
      if (grid.length !== gridSize.rows) {
        toast.error(`Erreur de grille: ${grid.length} lignes au lieu de ${gridSize.rows}`);
        return;
      }
      
      if (grid[0]?.length !== gridSize.cols) {
        toast.error(`Erreur de grille: ${grid[0]?.length} colonnes au lieu de ${gridSize.cols}`);
        return;
      }

      // Nettoyer les indices (maintenant ils correspondent directement 1:1)
      const cleanClues = (clueObj) => {
        const cleaned = {};
        Object.entries(clueObj).forEach(([key, value]) => {
          if (value && typeof value === 'string' && value.trim()) {
            cleaned[key] = value.trim();
          }
        });
        return cleaned;
      };

      const puzzleData = {
        title: puzzleTitle.trim(),
        date: selectedDate, // Format YYYY-MM-DD
        language: language === 'arabic' ? 'AR' : 'FR', // Conversion du format
        difficulty: difficulty || 'medium',
        isPublished: Boolean(isPublished),
        rows: parseInt(gridSize.rows),
        cols: parseInt(gridSize.cols),
        grid: gridForBackend,
        cluesHorizontal: cleanClues(clues.across || {}),
        cluesVertical: cleanClues(clues.down || {}),
        solution: gridForBackend // La solution est la même que la grille
      };

      console.log('Sending puzzle data:', JSON.stringify(puzzleData, null, 2));
      console.log('Date format check:', {
        originalDate: selectedDate,
        dateType: typeof selectedDate,
        isValidDate: !isNaN(Date.parse(selectedDate))
      });
      
      // Déterminer si on crée ou on met à jour
      if (currentPuzzleId) {
        console.log('Updating existing puzzle with ID:', currentPuzzleId);
        await api.put(`/admin/puzzle/${currentPuzzleId}`, puzzleData);
        toast.success('Puzzle mis à jour avec succès!');
      } else {
        console.log('Creating new puzzle');
        await api.post('/admin/create-puzzle', puzzleData);
        toast.success('Puzzle créé avec succès!');
      }
      
      if (onBack) onBack();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error('Error saving puzzle:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      // Gestion spécifique pour les erreurs d'authentification
      if (error.response?.status === 401 || error.response?.status === 400) {
        if (error.response.data?.error?.includes('token') || error.response.data?.error === 'Invalid token.') {
          toast.error('Session expirée. Redirection vers la page de connexion...');
          // Supprimer le token expiré
          localStorage.removeItem('adminToken');
          // Rediriger vers la page de connexion après 2 secondes
          setTimeout(() => {
            window.location.href = '/admin/login';
          }, 2000);
          return;
        }
      }
      
      // Afficher plus de détails à l'utilisateur pour les autres erreurs
      if (error.response?.data?.message) {
        toast.error(`Erreur: ${error.response.data.message}`);
      } else if (error.response?.data?.error) {
        toast.error(`Erreur: ${error.response.data.error}`);
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } finally {
      setLoading(false);
    }
  };



  const renderGridCell = (row, col) => {
    const cell = grid[row]?.[col];
    if (!cell) return null;
    
    return (
      <div
        key={`${row}-${col}`}
        className={`
          relative w-12 h-12 border border-gray-300 text-sm font-bold
          flex items-center justify-center
          ${cell.isBlocked ? 'bg-black cursor-pointer hover:bg-gray-800' : 'bg-white'}
        `}
        onClick={() => cell.isBlocked && handleCellUnblock(row, col)}
        title={cell.isBlocked ? "Clic pour débloquer" : "Tapez une lettre ou cliquez sur × pour bloquer"}
      >
        {/* Input pour les cellules blanches */}
        {!cell.isBlocked && (
          <input
            type="text"
            value={cell.value}
            onChange={(e) => handleCellInput(row, col, e.target.value)}
            onKeyDown={(e) => {
              // Ctrl+clic ou Escape pour bloquer la cellule
              if (e.ctrlKey && e.key === ' ') {
                e.preventDefault();
                handleCellClick(row, col);
              }
            }}
            className="w-full h-full text-center border-none outline-none bg-transparent text-sm font-bold focus:ring-2 focus:ring-blue-500 hover:bg-blue-50"
            style={getTextStyleForLanguage()}
            maxLength="1"
            placeholder=""
            data-row={row}
            data-col={col}
            lang={language === 'arabic' ? 'ar' : 'fr'}
          />
        )}
        
        {/* Petit bouton de blocage visible au hover */}
        {!cell.isBlocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCellClick(row, col);
            }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Bloquer cette cellule"
          >
            ×
          </button>
        )}
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'create':
        return (
          <div className="space-y-6">
            {/* Configuration de la grille */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Grid size={20} />
                Configuration de la grille
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lignes
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="25"
                    value={gridSize.rows}
                    onChange={(e) => setGridSize(prev => ({ ...prev, rows: parseInt(e.target.value) || 15 }))}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Colonnes
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="25"
                    value={gridSize.cols}
                    onChange={(e) => setGridSize(prev => ({ ...prev, cols: parseInt(e.target.value) || 15 }))}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulté
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="easy">Facile</option>
                    <option value="medium">Moyen</option>
                    <option value="hard">Difficile</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du puzzle
                </label>
                <input
                  type="text"
                  value={puzzleTitle}
                  onChange={(e) => setPuzzleTitle(e.target.value)}
                  placeholder={language === 'arabic' ? 'أدخل عنوان اللغز...' : 'Entrez le titre du puzzle...'}
                  className="w-full p-2 border rounded-md"
                  style={getTextStyleForLanguage()}
                  lang={language === 'arabic' ? 'ar' : 'fr'}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Langue du puzzle
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="french">🇫🇷 Français (écriture de gauche à droite)</option>
                  <option value="arabic">🇸🇦 العربية (écriture de droite à gauche)</option>
                </select>
                {language === 'arabic' && (
                  <p className="text-sm text-blue-600 mt-1">
                    💡 Mode arabe: Les mots seront écrits de droite à gauche dans les cellules
                  </p>
                )}
              </div>



              {/* Statistiques */}
              {words.across.length > 0 || words.down.length > 0 ? (
                <div className="bg-gray-50 p-3 rounded-md space-y-2">
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600 font-medium">Lignes (horizontaux): {words.across.length}</span>
                    <span className="text-blue-600 font-medium">Colonnes (verticaux): {words.down.length}</span>
                    <span className="text-purple-600 font-medium">Total: {words.across.length + words.down.length}</span>
                  </div>
                  {(() => {
                    const progress = calculateProgress();
                    return (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progression de la grille:</span>
                            <span className="font-medium text-gray-800">{progress.filled}/{progress.total} cellules ({progress.percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                  <p className="text-yellow-800 text-sm">Aucun indice généré. Essayez de remplir quelques cellules et cliquer sur "Régénérer les indices".</p>
                </div>
              )}
            </div>

            {/* Grille avec numérotation sur les côtés */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-600 mb-4">
                <p>• Tapez directement une lettre dans les cellules blanches (passage automatique à la cellule suivante)</p>
                <p>• Cliquez sur le petit bouton rouge (×) qui apparaît au survol pour bloquer une cellule</p>
                <p>• Cliquez sur une cellule noire pour la débloquer</p>
                <p>• Les numéros de lignes (vert) et colonnes (bleu) sont affichés sur les côtés</p>
              </div>
              
              <div className="overflow-auto max-w-full flex justify-center">
                <div className="relative">
                  {/* Numéros de colonnes (top) */}
                  <div className="flex mb-1">
                    <div className="w-8"></div> {/* Espace pour l'alignement */}
                    {Array.from({ length: gridSize.cols }, (_, index) => (
                      <div key={`col-${index}`} className="w-12 h-8 flex items-center justify-center text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>
                    ))}
                  </div>

                  <div className="flex">
                    {/* Numéros de lignes (left) */}
                    <div className="flex flex-col">
                      {Array.from({ length: gridSize.rows }, (_, index) => (
                        <div key={`row-${index}`} className="w-8 h-12 flex items-center justify-center text-sm font-bold text-green-600">
                          {index + 1}
                        </div>
                      ))}
                    </div>

                    {/* Grille principale */}
                    <div 
                      className="inline-grid gap-0 border-2 border-gray-400"
                      style={{ 
                        gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))`,
                        maxWidth: 'fit-content'
                      }}
                    >
                      {grid.map((row, rowIndex) =>
                        row.map((_, colIndex) => renderGridCell(rowIndex, colIndex))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section des indices intégrée */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HelpCircle size={20} />
                Définition des indices par ligne et colonne
              </h3>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Indices horizontaux (par ligne) */}
                <div>
                  <h4 className="font-semibold mb-3 text-green-600">Indices Horizontaux</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {words.across.map((word) => (
                      <div key={word.number} className="border rounded-md p-3 bg-green-50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-green-600">#{word.number} Ligne {word.number}:</span>
                          <span className="text-sm text-gray-600">
                            (Toute la ligne - {word.length} cases)
                          </span>
                        </div>
                        <textarea
                          value={clues.across[word.number] || ''}
                          onChange={(e) => handleClueChange('across', word.number, e.target.value)}
                          placeholder={language === 'arabic' ? `أدخل المؤشر للصف رقم ${word.number}...` : `Entrez l'indice pour la ligne ${word.number}...`}
                          className="w-full p-2 border rounded-md resize-none h-16 focus:ring-2 focus:ring-green-500"
                          style={getTextStyleForLanguage()}
                          lang={language === 'arabic' ? 'ar' : 'fr'}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indices verticaux (par colonne) */}
                <div>
                  <h4 className="font-semibold mb-3 text-blue-600">Indices Verticaux</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {words.down.map((word) => (
                      <div key={word.number} className="border rounded-md p-3 bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-blue-600">#{word.number} Colonne {word.number}:</span>
                          <span className="text-sm text-gray-600">
                            (Toute la colonne - {word.length} cases)
                          </span>
                        </div>
                        <textarea
                          value={clues.down[word.number] || ''}
                          onChange={(e) => handleClueChange('down', word.number, e.target.value)}
                          placeholder={language === 'arabic' ? `أدخل المؤشر للعمود رقم ${word.number}...` : `Entrez l'indice pour la colonne ${word.number}...`}
                          className="w-full p-2 border rounded-md resize-none h-16 focus:ring-2 focus:ring-blue-500"
                          style={getTextStyleForLanguage()}
                          lang={language === 'arabic' ? 'ar' : 'fr'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Options de publication intégrées */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Save size={20} />
                Finaliser et publier
              </h3>

              <div className="space-y-4">
                {/* Résumé */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Titre:</strong> {puzzleTitle}</p>
                      <p><strong>Date:</strong> {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}</p>
                      <p><strong>Langue:</strong> {language === 'french' ? '🇫🇷 Français' : '🇸🇦 العربية'}</p>
                    </div>
                    <div>
                      <p><strong>Difficulté:</strong> {difficulty === 'easy' ? 'Facile' : difficulty === 'medium' ? 'Moyen' : 'Difficile'}</p>
                      <p><strong>Taille:</strong> {gridSize.rows} × {gridSize.cols}</p>
                    </div>
                  </div>
                </div>

                {/* Option de publication */}
                <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <span className="font-medium text-blue-900">Publier immédiatement</span>
                      <p className="text-sm text-blue-700">
                        Si décoché, le puzzle sera sauvegardé comme brouillon
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );





      default:
        return null;
    }
  };

  const getStepTitle = (step) => {
    switch (step) {
      case 'create': return 'Créer le puzzle complet';
      default: return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-4"
    >
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft size={16} />
              Retour
            </button>
            <h1 className="text-2xl font-bold">
              {editPuzzleId ? 'Modifier le puzzle' : 'Créer un nouveau puzzle'}
            </h1>
          </div>
        </div>

        {/* Titre de l'étape */}
        <div className="mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md w-fit">
            <Grid size={16} />
            <span>1. {getStepTitle(currentStep)}</span>
          </div>
        </div>
      </div>

      {/* Contenu de l'étape */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* Action principale */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={savePuzzle}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg font-semibold"
        >
          <Save size={20} />
          {loading ? 'Sauvegarde en cours...' : isPublished ? 'Publier le puzzle' : 'Sauvegarder le brouillon'}
        </button>
      </div>
    </motion.div>
  );
};

export default CreateCrosswordGame;
