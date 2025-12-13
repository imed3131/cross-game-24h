const Joi = require('joi');

const validatePuzzle = (req, res, next) => {
  const schema = Joi.object({
    date: Joi.date().required(),
    language: Joi.string().valid('FR', 'AR').required(),
    gridSize: Joi.number().integer().min(3).max(400).optional(), // Make optional for backward compatibility
    rows: Joi.number().integer().min(3).max(25).optional(),
    cols: Joi.number().integer().min(3).max(25).optional(), 
    title: Joi.string().optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
    isPublished: Joi.boolean().optional(),
    grid: Joi.array().items(Joi.array().items(Joi.string())).required(),
    cluesHorizontal: Joi.alternatives().try(
      // Accept object format: {1: "clue1", 2: "clue2"}
      Joi.object().pattern(Joi.string(), Joi.string()),
      // Accept array format for backward compatibility
      Joi.array().items(
        Joi.object({
          number: Joi.number().required(),
          clue: Joi.string().required(),
          answer: Joi.string().required(),
          startRow: Joi.number().required(),
          startCol: Joi.number().required(),
          length: Joi.number().required()
        })
      )
    ).required(),
    cluesVertical: Joi.alternatives().try(
      // Accept object format: {1: "clue1", 2: "clue2"}
      Joi.object().pattern(Joi.string(), Joi.string()),
      // Accept array format for backward compatibility
      Joi.array().items(
        Joi.object({
          number: Joi.number().required(),
          clue: Joi.string().required(),
          answer: Joi.string().required(),
          startRow: Joi.number().required(),
          startCol: Joi.number().required(),
          length: Joi.number().required()
        })
      )
    ).required(),
    solution: Joi.array().items(Joi.array().items(Joi.string())).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  // Custom validation: ensure either gridSize or (rows AND cols) are provided
  const { gridSize, rows, cols } = req.body;
  if (!gridSize && (!rows || !cols)) {
    return res.status(400).json({ 
      error: 'Either gridSize or both rows and cols must be provided' 
    });
  }

  next();
};

const validateLanguageInput = (req, res, next) => {
  const { language, input } = req.body;
  
  if (language === 'FR') {
    // French characters validation
    const frenchRegex = /^[A-Za-zÀ-ÿ\s]*$/;
    if (!frenchRegex.test(input)) {
      return res.status(400).json({ 
        error: 'Invalid characters for French puzzle. Only French letters are allowed.' 
      });
    }
  } else if (language === 'AR') {
    // Arabic characters validation
    const arabicRegex = /^[\u0600-\u06FF\s]*$/;
    if (!arabicRegex.test(input)) {
      return res.status(400).json({ 
        error: 'Invalid characters for Arabic puzzle. Only Arabic letters are allowed.' 
      });
    }
  }
  
  next();
};

module.exports = { validatePuzzle, validateLanguageInput };
