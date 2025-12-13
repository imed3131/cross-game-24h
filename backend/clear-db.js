const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function clearData() {
  try {
    // Clear all data
    await prisma.playerStats.deleteMany({});
    await prisma.crosswordPuzzle.deleteMany({});
    
    // Keep only the admin user, or recreate it
    await prisma.user.deleteMany({});
    
    // Recreate admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@crossword.com',
        password: hashedPassword,
      },
    });
    
    console.log('Database cleared! Only admin user remains.');
    console.log('Admin: admin@crossword.com / admin123');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
