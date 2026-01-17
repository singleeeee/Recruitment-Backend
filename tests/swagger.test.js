const axios = require('axios');

async function testSwaggerAPI() {
  console.log('🚀 开始测试Swagger API文档...');
  const BASE_URL = 'http://localhost:3001';

  // 1. 测试Swagger UI页面
  try {
    console.log('\n1. 测试Swagger UI页面...');
    const swaggerResponse = await axios.get(`${BASE_URL}/api/docs`);
    if (swaggerResponse.status === 200 && swaggerResponse.data.includes('Swagger UI')) {
      console.log('✅ Swagger文档页面正常加载');
    } else {
      console.log('❌ Swagger文档页面异常');
    }
  } catch (error) {
    console.log('❌ 无法访问Swagger文档页面:', error.message);
  }

  // 2. 测试Swagger JSON文档
  try {
    console.log('\n2. 测试Swagger JSON文档...');
    const swaggerJsonResponse = await axios.get(`${BASE_URL}/api/docs-json`);
    const docs = swaggerJsonResponse.data;
    
    console.log('✅ Swagger JSON文档API正常');
    console.log(`📋 API标题: ${docs.info.title}`);
    console.log(`🔢 版本: ${docs.info.version}`);
    console.log(`📝 描述: ${docs.info.description.substring(0, 50)}...`);
    console.log(`🏷️  标签数量: ${docs.tags ? docs.tags.length : 0}`);
    
    if (docs.paths) {
      const pathCount = Object.keys(docs.paths).length;
      console.log(`🛣️  API路径数量: ${pathCount}`);
      
      // 列出所有API路径
      console.log('📋 API端点:');
      Object.keys(docs.paths).forEach(path => {
        const methods = Object.keys(docs.paths[path]);
        console.log(`  - ${path}: ${methods.join(', ')}`);
      });
    }
    
  } catch (error) {
    console.log('❌ 无法获取Swagger JSON文档:', error.message);
  }

  // 3. 测试认证流程与API文档的一致性
  try {
    console.log('\n3. 测试API文档完整性...');
    
    // 测试健康检查API
    const healthResponse = await axios.get(`${BASE_URL}/api/v1/health`);
    console.log('✅ 健康检查API工作正常');
    
    // 测试用户注册API
    const registerData = {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: '测试用户',
      studentId: `2021${Math.floor(Math.random() * 10000)}`,
      college: '计算机',
      major: '计算机',
      grade: '2021',
      phone: '13812345678'
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/api/v1/auth/register`, registerData);
    console.log('✅ 用户注册API工作正常');
    console.log(`🔑 用户ID: ${registerResponse.data.user.id}`);
    
    // 测试用户登录API
    const loginData = {
      email: registerData.email,
      password: registerData.password
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, loginData);
    console.log('✅ 用户登录API工作正常');
    
    // 测试用户资料API（需要认证）
    const token = loginResponse.data.accessToken;
    const profileResponse = await axios.get(`${BASE_URL}/api/v1/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ 用户资料API工作正常');
    
    console.log('\n🎉 所有API测试完成！');
    
  } catch (error) {
    console.log('❌ API测试失败:', error.response?.data || error.message);
  }
}

testSwaggerAPI().then(() => {
  console.log('\n🏁 Swagger文档测试完成');
  process.exit(0);
}).catch(error => {
  console.log('❌ 测试过程中出现错误:', error.message);
  process.exit(1);
});