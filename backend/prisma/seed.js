const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crossword.com' },
    update: {},
    create: {
      email: 'admin@crossword.com',
      password: hashedPassword,
    },
  });

  // Create sample crossword puzzles
  const sampleGrid = [
    ['C', 'A', 'R', '', ''],
    ['H', '', 'O', '', ''],
    ['A', '', 'S', 'U', 'N'],
    ['T', '', 'E', '', ''],
    ['', '', '', '', '']
  ];

  const sampleCluesHorizontal = [
    { number: 1, clue: "Vehicle with four wheels", answer: "CAR", startRow: 0, startCol: 0, length: 3 },
    { number: 3, clue: "A flower", answer: "ROSE", startRow: 1, startCol: 2, length: 4 },
    { number: 4, clue: "Yellow star in the sky", answer: "SUN", startRow: 2, startCol: 2, length: 3 }
  ];

  const sampleCluesVertical = [
    { number: 1, clue: "Animal that purrs", answer: "CHAT", startRow: 0, startCol: 0, length: 4 },
    { number: 2, clue: "First letter of alphabet", answer: "A", startRow: 0, startCol: 1, length: 1 }
  ];

  const puzzle1 = await prisma.crosswordPuzzle.create({
    data: {
      title: "Puzzle du jour",
      date: new Date("2025-12-09"),
      language: 'FR',
      difficulty: 'medium',
      rows: 5,
      cols: 5,
      grid: JSON.stringify(sampleGrid),
      cluesHorizontal: JSON.stringify(sampleCluesHorizontal),
      cluesVertical: JSON.stringify(sampleCluesVertical),
      solution: JSON.stringify(sampleGrid),
      numbering: JSON.stringify({1: {row: 0, col: 0}, 2: {row: 0, col: 1}, 3: {row: 1, col: 2}, 4: {row: 2, col: 2}}),
      isPublished: true
    },
  });

  // Create sample Arabic puzzle
  const arabicGrid = [
    ['ك', 'ت', 'ا', 'ب', ''],
    ['', '', '', 'ي', ''],
    ['', '', '', 'ت', ''],
    ['', '', '', '', ''],
    ['', '', '', '', '']
  ];

  const arabicCluesHorizontal = [
    { number: 1, clue: "مجموعة من الأوراق للقراءة", answer: "كتاب", startRow: 0, startCol: 0, length: 4 }
  ];

  const arabicCluesVertical = [
    { number: 2, clue: "مكان للسكن", answer: "بيت", startRow: 0, startCol: 3, length: 3 }
  ];

  const puzzle2 = await prisma.crosswordPuzzle.create({
    data: {
      title: "لغز عربي",
      date: new Date("2025-12-10"),
      language: 'AR',
      difficulty: 'easy',
      rows: 5,
      cols: 5,
      grid: JSON.stringify(arabicGrid),
      cluesHorizontal: JSON.stringify(arabicCluesHorizontal),
      cluesVertical: JSON.stringify(arabicCluesVertical),
      solution: JSON.stringify(arabicGrid),
      numbering: JSON.stringify({1: {row: 0, col: 0}, 2: {row: 0, col: 3}}),
      isPublished: true
    },
  });

  // Create sample player stats
  await prisma.playerStats.create({
    data: {
      date: new Date(),
      puzzlesCompleted: 5,
      language: 'FR',
      totalTimeSpent: 1800, // 30 minutes
    },
  });

  await prisma.playerStats.create({
    data: {
      date: new Date(),
      puzzlesCompleted: 3,
      language: 'AR',
      totalTimeSpent: 1200, // 20 minutes
    },
  });

  console.log('Database seeded successfully!');
  console.log('Admin user created: admin@crossword.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
