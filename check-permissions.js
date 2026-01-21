const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPermissions() {
  const superAdminRole = await prisma.role.findUnique({
    where: { code: 'super_admin' },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });
  
  console.log(`超级管理员角色权限数量: ${superAdminRole.permissions.length}`);
  console.log('权限列表:');
  superAdminRole.permissions.forEach(rp => {
    console.log(`- ${rp.permission.code}: ${rp.permission.name} (${rp.permission.module})`);
  });
  
  await prisma.$disconnect();
}

checkPermissions();