const express = require('express');
const { authenticateAdmin } = require('../middleware/auth');
const { validatePuzzle } = require('../middleware/validation');
const {
  createPuzzle,
  getPuzzle,
  getPuzzlesByDate,
  updatePuzzle,
  deletePuzzle,
  getAllPuzzles,
  getStats,
} = require('../controllers/adminController');

// Nouveau contrôleur pour la création
const {
  createCrosswordPuzzle,
  getPuzzleForEdit,
  previewWords,
  togglePuzzlePublishStatus
} = require('../controllers/puzzleCreationController');

const router = express.Router();

// All admin routes require authentication
router.use(authenticateAdmin);

// Routes spécifiques en premier (pour éviter les conflits)
router.post('/create-puzzle', createCrosswordPuzzle);
router.get('/edit-puzzle/:date', getPuzzleForEdit);
router.get('/puzzles-by-date/:date', getPuzzleForEdit); // Même fonction, gère multiple/single
router.post('/preview-words', previewWords);
router.get('/puzzles', getAllPuzzles); // Avant /puzzle pour éviter conflit
router.get('/stats', getStats); // Stats route
router.get('/get-puzzle/:id', getPuzzle); // Route dédiée pour éviter conflits

// Routes avec paramètres ID (après les routes spécifiques)
router.get('/puzzle/:id', getPuzzle);
router.post('/puzzle', validatePuzzle, createPuzzle);
router.put('/puzzle/:id', validatePuzzle, updatePuzzle);
router.patch('/puzzle/:id/toggle-publish', togglePuzzlePublishStatus);
router.delete('/puzzle/:id', deletePuzzle);

// Routes avec query parameters
router.get('/puzzle', getPuzzlesByDate);



module.exports = router;
