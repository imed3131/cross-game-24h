const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const users = await prisma.user.findMany();
    console.log('Found users:', users);
    
    if (users.length === 0) {
      console.log('No users found in database');
    } else {
      console.log(`Found ${users.length} user(s)`);
      users.forEach(user => {
        console.log(`- Email: ${user.email}, ID: ${user.id}, Created: ${user.createdAt}`);
      });
    }
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
