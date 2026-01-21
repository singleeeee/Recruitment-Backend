const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoles() {
  try {
    const allRoles = await prisma.role.findMany();
    
    console.log('All roles and their isActive status:');
    allRoles.forEach(role => {
      console.log(`${role.code}: ${role.name} - isActive: ${role.isActive}, level: ${role.level}`);
    });
    
    const activeRoles = await prisma.role.findMany({
      where: { isActive: true }
    });
    
    console.log(`\nActive roles count: ${activeRoles.length}`);
    activeRoles.forEach(role => {
      console.log(`${role.code}: ${role.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();