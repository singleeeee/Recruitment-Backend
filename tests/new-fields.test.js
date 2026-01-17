const axios = require('axios');

async function testNewFields() {
  console.log('🚀 开始测试新字段功能...');
  const BASE_URL = 'http://localhost:3001/api/v1';

  // 使用前端提供的数据格式进行注册测试
  const testUserData = {
    email: "1197826934@qq.com",
    experience: "1",
    grade: "大四",
    major: "计算机科学与技术",
    motivation: "123123213123",
    name: "阮志荣",
    password: "123123",
    phone: "15706623209"
  };

  console.log('📝 使用的测试数据:', JSON.stringify(testUserData, null, 2));

  // 1. 测试用户注册（带新字段）
  try {
    console.log('\n1. 测试用户注册（带experience和motivation字段）...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUserData);
    
    console.log('✅ 注册成功！');
    console.log('📋 返回的用户信息:');
    console.log(JSON.stringify(registerResponse.data.user, null, 2));
    
    // 验证新字段是否包含在响应中
    if (registerResponse.data.user.experience !== undefined) {
      console.log('✅ experience字段正常返回');
    }
    if (registerResponse.data.user.motivation !== undefined) {
      console.log('✅ motivation字段正常返回');
    }

    // 2. 测试用户登录  
    try {
      console.log('\n2. 测试用户登录...');
      const loginData = {
        email: testUserData.email,
        password: testUserData.password
      };
      
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
      console.log('✅ 登录成功！');
      
      const token = loginResponse.data.accessToken;
      console.log(`🔑 令牌: ${token.substring(0, 50)}...`);

      // 3. 测试用户资料获取（验证新字段）
      try {
        console.log('\n3. 测试获取用户资料...');
        const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('✅ 获取用户资料成功！');
        console.log('📋 完整的用户资料:');
        console.log(JSON.stringify(profileResponse.data, null, 2));
        
        // 验证数据库中新字段
        const user = profileResponse.data;
        if (user.experience === testUserData.experience) {
          console.log('✅ experience字段保存和读取正确');
        } else {
          console.log(`❌ experience字段不匹配: 期望 "${testUserData.experience}", 实际 "${user.experience}"`);
        }
        
        if (user.motivation === testUserData.motivation) {
          console.log('✅ motivation字段保存和读取正确');
        } else {
          console.log(`❌ motivation字段不匹配: 期望 "${testUserData.motivation}", 实际 "${user.motivation}"`);
        }
        
      } catch (error) {
        console.log('❌ 获取用户资料失败:', error.response?.data || error.message);
      }
      
    } catch (error) {
      console.log('❌ 登录失败:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('❌ 注册失败:', error.response?.data || error.message);
    
    // 如果邮箱已存在，尝试用不同的邮箱
    if (error.response?.data?.message?.includes('邮箱已被注册')) {
      console.log('\n📧 邮箱已存在，使用新邮箱重试...');
      const newUserData = { ...testUserData };
      newUserData.email = `test${Date.now()}@qq.com`;
      newUserData.name = '新用户';
      
      try {
        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, newUserData);
        console.log('✅ 使用新邮箱注册成功！');
        console.log('📋 新用户信息:', registerResponse.data.user);
      } catch (retryError) {
        console.log('❌ 重试注册仍失败:', retryError.response?.data || retryError.message);
      }
    }
  }
  
  console.log('\n🏁 新字段功能测试完成');
}

testNewFields().then(() => {
  process.exit(0);
}).catch(error => {
  console.log('❌ 测试过程中出现错误:', error.message);
  process.exit(1);
});