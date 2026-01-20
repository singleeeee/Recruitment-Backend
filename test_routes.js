const axios = require('axios');

try {
  // 简单的测试脚本，检查roles API是否可用
  axios.get('http://localhost:3001/api/v1/roles')
    .then(response => {
      console.log('Roles API response status:', response.status);
      console.log('Roles API data:', response.data);
    })
    .catch(error => {
      console.log('Roles API error:', error.response?.status, error.message);
      
      // 测试其他已知工作的API
      return axios.get('http://localhost:3001/api/v1/health')
        .then(response => {
          console.log('Health API works:', response.status);
        })
        .catch(healthError => {
          console.log('Health API also failed:', healthError.message);
        });
    });
} catch (error) {
  console.log('Request failed:', error.message);
}