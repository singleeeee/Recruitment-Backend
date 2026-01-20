// 详细检查Swagger UI页面内容
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

async function analyzeSwaggerUI() {
  try {
    console.log('🔬 深度分析Swagger UI页面...');
    
    // 1. 检查Swagger JSON
    const swaggerResponse = await makeRequest('/api/docs-json');
    if (swaggerResponse.statusCode !== 200) {
      console.log('❌ 无法获取Swagger JSON');
      return;
    }
    
    const swaggerData = JSON.parse(swaggerResponse.data);
    
    // 2. 检查Swagger UI HTML页面
    const docsResponse = await makeRequest('/api/docs');
    if (docsResponse.statusCode !== 200) {
      console.log('❌ 无法获取Swagger UI页面');
      return;
    }
    
    const htmlContent = docsResponse.data;
    
    // 3. 分析关键部分
    console.log('\n📊 Swagger配置分析:');
    console.log('   - 总标签数:', swaggerData.tags ? swaggerData.tags.length : 0);
    
    // 查找所有与角色权限相关的标签
    const roleTags = swaggerData.tags ? swaggerData.tags.filter(tag => 
      tag.name.toLowerCase().includes('role') || 
      tag.name.includes('角色') ||
      tag.name.toLowerCase().includes('permission') ||
      tag.name.includes('权限')
    ) : [];
    
    console.log('   - 找到的角色权限相关标签:', roleTags.map(t => `${t.name} (${t.description || '无描述'})`));
    
    // 4. 分析HTML内容
    console.log('\n🔍 HTML内容分析:');
    const roleTagInHTML = htmlContent.includes('role') || htmlContent.includes('角色');
    const permissionTagInHTML = htmlContent.includes('permission') || htmlContent.includes('权限');
    const swaggerUILoaded = htmlContent.includes('swagger-ui');
    
    console.log('   - Swagger UI核心库加载:', swaggerUILoaded ? '✅' : '❌');
    console.log('   - 页面包含角色相关文本:', roleTagInHTML ? '✅' : '❌');
    console.log('   - 页面包含权限相关文本:', permissionTagInHTML ? '✅' : '❌');
    
    // 5. 检查JSON中的路径
    console.log('\n🛣️ 路径分析:');
    const paths = Object.keys(swaggerData.paths || {});
    const rolePaths = paths.filter(p => p.includes('/roles'));
    const permissionPaths = paths.filter(p => p.includes('/permissions'));
    
    console.log('   - 角色路径存在于Swagger JSON:', rolePaths.length > 0 ? '✅' : '❌');
    console.log('   - 权限路径存在于Swagger JSON:', permissionPaths.length > 0 ? '✅' : '❌');
    
    // 6. 检查HTML中是否包含Swagger JSON引用
    const jsonInjected = htmlContent.includes('spec') || htmlContent.includes('swagger.json');
    console.log('   - HTML正确注入Swagger配置:', jsonInjected ? '✅' : '❌');
    
    if (!roleTagInHTML || !permissionTagInHTML) {
      console.log('\n⚠️  最好解决方案:');
      console.log('   1. 请清除浏览器缓存(Ctrl+Shift+Delete)');
      console.log('   2. 强制刷新页面(Ctrl+F5或Cmd+Shift+R)');
      console.log('   3. 在浏览器开发者工具中检查是否有JavaScript错误');
      console.log('   4. 尝试在新的无痕/隐私窗口中打开 http://localhost:3001/api/docs');
      console.log('   5. 检查页面中的标签列表，寻找"角色权限 - Roles"和"权限管理 - Permissions"');
      console.log('   6. 如果仍然看不到，尝试向上滚动查看标签列表');
    } else {
      console.log('\n🎉 Swagger UI看起来配置正确！')
      console.log('   请在浏览器中查看标签，角色和权限相关内容应该可见。');
    }
    
  } catch (error) {
    console.log('❌ 分析过程中出错:', error.message);
  }
}

analyzeSwaggerUI();