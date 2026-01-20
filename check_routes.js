// 检查Swagger文档和API端点的Node脚本
const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function checkAPIs() {
  try {
    // 1. 检查健康检查端点
    console.log('🔍 1. 检查服务器健康状态...');
    const healthResponse = await makeRequest('/api/v1/health');
    console.log(`Health API: ${healthResponse.statusCode === 200 ? '✅' : '❌'} (${healthResponse.statusCode})`);

    // 2. 检查角色API
    console.log('\n🔍 2. 检查角色权限API...');
    const rolesResponse = await makeRequest('/api/v1/roles');
    console.log(`Roles API: ${rolesResponse.statusCode === 200 ? '✅' : '❌'} (${rolesResponse.statusCode})`);

    // 3. 检查权限API
    const permissionsResponse = await makeRequest('/api/v1/permissions');
    console.log(`Permissions API: ${permissionsResponse.statusCode === 200 ? '✅' : '❌'} (${permissionsResponse.statusCode})`);

    // 4. 检查Swagger JSON
    console.log('\n🔍 3. 检查Swagger文档...');
    const swaggerResponse = await makeRequest('/api/docs-json');
    console.log(`Swagger JSON API: ${swaggerResponse.statusCode === 200 ? '✅' : '❌'} (${swaggerResponse.statusCode})`);

    if (swaggerResponse.statusCode === 200) {
      try {
        const swaggerData = JSON.parse(swaggerResponse.data);
        const paths = Object.keys(swaggerData.paths || {});
        
        // 过滤角色相关的路径
        const rolePaths = paths.filter(p => p.includes('/roles'));
        const permissionPaths = paths.filter(p => p.includes('/permissions'));
        const allAPIPaths = paths.filter(p => !p.startsWith('/api/docs')).length;
        
        console.log(`\n📊 4. Swagger文档统计:`);
        console.log(`   - 总API端点数: ${allAPIPaths}`);
        console.log(`   - 角色相关端点: ${rolePaths.length} 个`);
        console.log(`   - 权限相关端点: ${permissionPaths.length} 个`);
        
        if (rolePaths.length > 0) {
          console.log('\n🎯 5. 角色相关端点详情:');
          rolePaths.forEach((path, index) => {
            console.log(`   ${index + 1}. ${path}`);
          });
        }
        
        if (permissionPaths.length > 0) {
          console.log('\n🎯 6. 权限相关端点详情:');
          permissionPaths.forEach((path, index) => {
            console.log(`   ${index + 1}. ${path}`);
          });
        }

        // 检查标签
        const tags = swaggerData.tags || [];
        const roleTag = tags.find(tag => tag.name === 'roles' || tag.name === '角色权限 - Roles');
        const permissionTag = tags.find(tag => tag.name === 'permissions' || tag.name === '权限管理 - Permissions');
        
        console.log('\n🏷️ 7. Swagger标签检查:');
        console.log(`   - 角色标签: ${roleTag ? '✅' : '❌'} ${roleTag ? '(' + roleTag.name + ')' : ''}`);
        console.log(`   - 权限标签: ${permissionTag ? '✅' : '❌'} ${permissionTag ? '(' + permissionTag.name + ')' : ''}`);
        
      } catch (parseError) {
        console.log('❌ 无法解析Swagger JSON:', parseError.message);
      }
    }

    // 5. 检查HTML文档页面
    console.log('\n🔍 8. 检查Swagger UI页面...');
    const docsResponse = await makeRequest('/api/docs');
    console.log(`Swagger UI页面: ${docsResponse.statusCode === 200 ? '✅' : '❌'} (${docsResponse.statusCode})`);
    
    if (docsResponse.statusCode === 200) {
      // 检查HTML中是否包含角色权限相关的术语
      const hasRoles = docsResponse.data.includes('角色权限 - Roles') || docsResponse.data.includes('roles');
      const hasPermissions = docsResponse.data.includes('权限管理 - Permissions') || docsResponse.data.includes('permissions');
      
      console.log(`   - HTML包含角色权限内容: ${hasRoles ? '✅' : '❌'}`);
      console.log(`   - HTML包含权限管理内容: ${hasPermissions ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.log('❌ 检查过程中出错:', error.message);
  }
}

checkAPIs().then(() => {
  console.log('\n🎉 检查完成！现在您可以访问 http://localhost:3001/api/docs 查看Swagger文档');
  console.log('   如果角色权限API仍然为空，请刷新页面或等待几秒钟让文档加载完成。');
});