const express = require('express');
const { validateLanguageInput } = require('../middleware/validation');
const {
  getTodaysPuzzles,
  getPuzzlesByDate,
  submitSolution,
  getAllPuzzleDates,
} = require('../controllers/playerController');

const router = express.Router();

// Player routes (no authentication required)
router.get('/today', getTodaysPuzzles);
router.get('/date/:date', getPuzzlesByDate);
router.get('/dates', getAllPuzzleDates);
router.post('/submit/:id', validateLanguageInput, submitSolution);

module.exports = router;
