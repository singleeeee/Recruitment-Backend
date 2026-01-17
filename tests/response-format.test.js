const axios = require('axios');

async function testResponseFormat() {
  console.log('🚀 开始测试统一响应格式...');
  const BASE_URL = 'http://localhost:3001/api/v1';

  try {
    // 1. 测试健康检查API
    console.log('\n1. 测试健康检查API...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康检查响应:', JSON.stringify(healthResponse.data, null, 2));
    
    // 验证格式
    const expectedKeys = ['code', 'message', 'data', 'success', 'timestamp'];
    const hasAllKeys = expectedKeys.every(key => key in healthResponse.data);
    console.log(`${hasAllKeys ? '✅' : '❌'} 响应格式正确`);

    // 2. 测试用户注册API
    console.log('\n2. 测试用户注册API...');
    const registerData = {
      email: `test${Date.now()}@qq.com`,
      password: '123123',
      name: '测试用户',
      experience: '有项目经验',
      motivation: '想加入团队学习',
      grade: '大四',
      major: '计算机',
      phone: '13811111111'
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✅ 注册响应:', JSON.stringify(registerResponse.data, null, 2));
    
    // 验证注册响应格式
    if (registerResponse.data.code === 201 && registerResponse.data.success === true) {
      console.log('✅ 注册响应格式正确');
    } else {
      console.log('❌ 注册响应格式错误');
    }

    // 3. 测试用户登录API
    console.log('\n3. 测试用户登录API...');
    const loginData = {
      email: registerData.email,
      password: registerData.password
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✅ 登录响应:', JSON.stringify(loginResponse.data, null, 2));
    
    // 验证登录响应格式
    if (loginResponse.data.code === 200 && loginResponse.data.success === true) {
      console.log('✅ 登录响应格式正确');
    } else {
      console.log('❌ 登录响应格式错误');
    }

    // 4. 测试用户资料API
    console.log('\n4. 测试用户资料API...');
    const token = loginResponse.data.data.accessToken; // 注意：这是统一包装后的data中的accessToken
    
    const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ 用户资料响应:', JSON.stringify(profileResponse.data, null, 2));
    
    // 验证用户资料响应格式
    if (profileResponse.data.code === 200 && profileResponse.data.success === true) {
      console.log('✅ 用户资料响应格式正确');
    } else {
      console.log('❌ 用户资料响应格式错误');
    }

    // 5. 测试错误响应格式
    console.log('\n5. 测试错误响应格式...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response) {
        console.log('✅ 错误响应:', JSON.stringify(error.response.data, null, 2));
        
        // 验证错误响应格式
        const errorData = error.response.data;
        if (errorData.code === 401 && errorData.success === false) {
          console.log('✅ 错误响应格式正确');
        } else {
          console.log('❌ 错误响应格式错误');
        }
      }
    }

    console.log('\n🎉 所有响应格式测试完成！');
    
  } catch (error) {
    console.log('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 添加延迟等待服务器准备
setTimeout(() => {
  testResponseFormat().then(() => {
    console.log('\n🏁 响应格式测试完成');
    process.exit(0);
  }).catch(error => {
    console.log('❌ 测试过程中出现错误:', error.message);
    process.exit(1);
  });
}, 2000);