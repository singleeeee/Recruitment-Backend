const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoles() {
  try {
    const allRoles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    console.log(`Total roles found: ${allRoles.length}`);
    console.log('Roles:', JSON.stringify(allRoles, null, 2));
    
    const activeRoles = allRoles.filter(role => role.isActive);
    console.log(`\nActive roles: ${activeRoles.length}`);
    console.log('Active roles:', JSON.stringify(activeRoles, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();