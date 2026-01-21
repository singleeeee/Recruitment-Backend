const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoleCodes() {
  const roles = await prisma.role.findMany();
  console.log('Role codes and names:');
  roles.forEach(r => {
    console.log(`${r.code}: ${r.name} - isActive: ${r.isActive}`);
  });
  await prisma.$disconnect();
}

checkRoleCodes();