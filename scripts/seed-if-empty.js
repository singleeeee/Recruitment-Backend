const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.role.count();
  if (count === 0) {
    console.log('DB is empty, running seed...');
    execSync('node prisma/seed.js', { stdio: 'inherit' });
    console.log('Seed completed.');
  } else {
    console.log(`DB already has ${count} roles, skipping seed.`);
  }
}

main()
  .catch((e) => {
    console.error('Seed check failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
