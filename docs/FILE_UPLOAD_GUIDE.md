# 文件上传功能使用指南

## 📋 概述

本文档详细说明了如何在招新系统中使用文件上传功能，包括API接口说明、使用说明和最佳实践。

## 🛠️ 支持的文件类型

### 文档类型
- **PDF文件**：`.pdf` - 简历、证明材料等
- **Word文档**：`.doc` - Word 97-2003文档
- **Word文档**：`.docx` - Word 2007+文档
- **压缩文件**：`.zip` - 作品集、项目代码等

### 图片类型
- **JPEG图片**：`.jpg`, `.jpeg` - 头像、证明材料等
- **PNG图片**：`.png` - 头像、图标等
- **GIF图片**：`.gif` - 动态图片（不推荐用于简历）

## 📏 文件大小限制

- **最大文件大小**：10MB
- **建议简历大小**：≤5MB
- **建议图片大小**：≤2MB

## 📂 文件分类

系统支持以下文件分类，用于区分不同类型的上传文件：

| 分类 | 代码 | 用途 | 示例 |
|------|------|------|------|
| 简历 | `resume` | 个人简历 | CV.pdf |
| 头像 | `avatar` | 个人头像 | avatar.jpg |
| 作品集 | `portfolio` | 作品或项目 | project.zip |
| 证书 | `certificate` | 技能证书 | certificate.pdf |

## 🔗 API接口说明

### 1. 上传文件

**Endpoint**: `POST /api/v1/files/upload`

**Headers**:
```
Content-Type: multipart/form-data
Authorization: Bearer <your-jwt-token>
```

**Parameters**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | File | 是 | 要上传的文件 |
| `category` | String | 否 | 文件分类（resume/avatar/portfolio/certificate）|
| `description` | String | 否 | 文件描述 |

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "filename": "resume_1640995200000_abc123.pdf",
    "originalName": "my_resume.pdf",
    "mimeType": "application/pdf",
    "size": 1048576,
    "uploadedBy": "user-id",
    "createdAt": "2026-01-18T10:30:00Z",
    "url": "http://localhost:3001/api/v1/files/123e4567-e89b-12d3-a456-426614174000"
  },
  "message": "文件上传成功",
  "timestamp": "2026-01-18T10:30:00Z"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "文件大小不能超过10MB",
    "details": {
      "file": "文件过大"
    }
  },
  "timestamp": "2026-01-18T10:30:00Z"
}
```

### 2. 获取用户文件列表

**Endpoint**: `GET /api/v1/files`

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Query参数**:
- `category` (可选) - 按分类筛选文件

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "filename": "resume_1640995200000_abc123.pdf",
      "originalName": "my_resume.pdf",
      "mimeType": "application/pdf",
      "size": 1048576,
      "uploadedBy": "user-id",
      "createdAt": "2026-01-18T10:30:00Z"
    }
  ],
  "message": "获取文件列表成功"
}
```

### 3. 下载文件

**Endpoint**: `GET /api/v1/files/:id`

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**响应**: 直接返回文件内容，用于下载

### 4. 预览文件

**Endpoint**: `GET /api/v1/files/:id/view`

**适用文件**: PDF、JPEG、PNG、GIF（无需登录）

**响应**: 文件内容，用于浏览器内预览

### 5. 删除文件

**Endpoint**: `DELETE /api/v1/files/:id`

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**响应**:
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

### 6. 获取文件统计

**Endpoint**: `GET /api/v1/files/stats/summary`

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "totalFiles": 5,
    "totalSize": 5242880,
    "totalSizeFormatted": "5.00 MB"
  },
  "message": "获取文件统计成功"
}
```

## 💻 使用示例

### 使用cURL上传文件

```bash
curl -X POST http://localhost:3001/api/v1/files/upload \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/resume.pdf" \
  -F "category=resume" \
  -F "description=我的最新简历"
```

### 使用JavaScript上传文件

```javascript
async function uploadFile(file, category = 'resume') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  
  try {
    const response = await fetch('/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${yourJwtToken}`,
      },
      body: formData,
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('文件上传成功:', result.data);
    } else {
      console.error('上传失败:', result.error);
    }
  } catch (error) {
    console.error('网络错误:', error);
  }
}
```

### 使用Postman测试

1. 打开Postman
2. 创建新的POST请求
3. URL: `http://localhost:3001/api/v1/files/upload`
4. Headers:
   - `Authorization`: `Bearer your-jwt-token`
5. Body → form-data:
   - `file`: File (选择要上传的文件)
   - `category`: Text (如: resume)
6. 点击Send

## ⚠️ 安全注意事项

1. **文件验证**：
   - 系统会验证文件类型和内容的一致性
   - 不支持的文件类型会被自动拒绝

2. **权限控制**：
   - 用户只能访问自己上传的文件
   - 删除操作需要文件所有者权限

3. **病毒防护**：
   - 建议在生产环境中集成病毒扫描
   - 定期检查和清理上传文件

## 🚨 常见错误

| 错误代码 | 错误信息 | 解决方案 |
|----------|----------|----------|
| `VALIDATION_ERROR` | 文件大小不能超过10MB | 压缩文件或选择更小的文件 |
| `VALIDATION_ERROR` | 不支持的文件类型 | 转换为PDF或支持的格式 |
| `VALIDATION_ERROR` | 文件类型与扩展名不匹配 | 检查文件实际类型 |
| `VALIDATION_ERROR` | 请上传文件 | 确保选择了文件 |
| `UNAUTHORIZED` | 无权访问此文件 | 检查用户权限 |
| `NOT_FOUND` | 文件不存在 | 检查文件ID是否正确 |

## 🎯 最佳实践

1. **文件格式**：
   - 简历优先使用PDF格式
   - 图片使用JPEG或PNG格式
   - 作品集可以打包为ZIP

2. **文件大小**：
   - 简历控制在1-3MB
   - 图片压缩到合适大小
   - 作品集可以包含必要的说明文档

3. **文件命名**：
   - 使用有意义的文件名
   - 避免特殊字符
   - 包含版本信息（如果适用）

4. **文件组织**：
   - 合理选择文件分类
   - 添加文件描述
   - 定期清理不需要的文件

## 🔧 故障排除

### 上传失败
1. 检查网络连接
2. 确认文件格式是否支持
3. 检查文件大小是否超限
4. 确认是否已登录

### 下载失败  
1. 检查文件ID是否正确
2. 确认是否有权限访问
3. 检查文件是否已被删除
4. 尝试重新登录获取新的token

## 📞 技术支持

如果遇到问题，请提供以下信息：
- 错误消息
- 使用的API端点
- 文件大小和类型
- 浏览器或客户端信息
- 相关的时间戳