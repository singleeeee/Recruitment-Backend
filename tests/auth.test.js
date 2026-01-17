const axios = require('axios');
const BASE_URL = 'http://localhost:3001/api/v1';

async function testAuth() {
  console.log('开始测试认证功能...');
  
  // 1. 测试健康检查
  try {
    console.log('1. 测试健康检查...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康检查成功:', healthResponse.data);
  } catch (error) {
    console.log('❌ 健康检查失败:', error.response?.data || error.message);
    return;
  }

  // 2. 测试用户注册
  try {
    console.log('\n2. 测试用户注册...');
    const registerData = {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: '测试用户',
      studentId: `20210000${Math.floor(Math.random() * 1000)}`,
      college: '计算机学院',
      major: '计算机科学与技术',
      grade: '2021级',
      phone: '13800138000'
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✅ 注册成功:', registerResponse.data.user);
    
    // 3. 测试用户登录
    try {
      console.log('\n3. 测试用户登录...');
      const loginData = {
        email: registerData.email,
        password: registerData.password
      };
      
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
      console.log('✅ 登录成功:', loginResponse.data.user);
      console.log('🔑 Token:', loginResponse.data.accessToken.substring(0, 50) + '...');
      
      // 4. 测试用户资料端点
      try {
        console.log('\n4. 测试用户资料端点...');
        const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${loginResponse.data.accessToken}`
          }
        });
        console.log('✅ 获取用户资料成功:', profileResponse.data);
      } catch (error) {
        console.log('❌ 获取用户资料失败:', error.response?.data || error.message);
      }
      
    } catch (error) {
      console.log('❌ 登录失败:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('❌ 注册失败:', error.response?.data || error.message);
  }
}

testAuth().then(() => {
  console.log('\n🏁 测试完成');
  process.exit(0);
}).catch(error => {
  console.log('❌ 测试过程中出现错误:', error.message);
  process.exit(1);
});