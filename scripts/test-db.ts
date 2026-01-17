import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');

    // 测试连接
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // 检查表是否存在
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;
    console.log('📋 Tables in database:', tables.map((t) => t.tablename));

    // 创建测试用户
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'candidate',
        name: 'Test User',
        studentId: '20210001',
      },
    });
    console.log('✅ Created test user:', testUser.id);

    // 查询用户
    const users = await prisma.user.findMany();
    console.log('👥 Total users:', users.length);

    // 删除测试数据
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log('🗑️  Cleaned up test data');

    console.log('\n✨ All database tests passed!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase()
  .then(() => {
    console.log('✨ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
