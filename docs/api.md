# 招新管理系统 API 文档

> **Base URL**: `http://localhost:3001/api/v1`  
> **文档更新日期**: 2026-03-18  
> **在线调试**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)（Swagger UI）

---

## 目录

- [通用说明](#通用说明)
- [一、认证模块](#一认证模块)
- [二、用户模块](#二用户模块)
- [三、招新模块](#三招新模块)
- [四、申请模块](#四申请模块)
- [五、文件模块](#五文件模块)
- [六、社团管理](#六社团管理)
- [七、超级管理员](#七超级管理员)
- [八、角色管理](#八角色管理)
- [九、权限管理](#九权限管理)
- [十、注册字段](#十注册字段)
- [附录：枚举值](#附录枚举值)

---

## 通用说明

### 认证方式

所有需要认证的接口，请在请求头中携带：

```http
Authorization: Bearer <accessToken>
```

### 统一响应格式

所有接口（除文件流接口外）返回统一结构：

```json
{
  "code": 200,
  "message": "请求成功",
  "data": { ... },
  "success": true,
  "timestamp": "2026-03-17T10:00:00.000Z"
}
```

错误时：

```json
{
  "message": "具体错误信息",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### 角色说明

| 角色代码 | 角色名称 | 说明 |
|---|---|---|
| `candidate` | 候选人 | 普通申请用户 |
| `club_admin` | 社团管理员 | 管理自己社团的招新和申请 |
| `super_admin` | 超级管理员 | 拥有所有权限 |

### 测试账号

| 账号 | 密码 | 角色 |
|---|---|---|
| `root@recruitment.com` | `Root123!` | 超级管理员 |
| `admin.tech@university.edu` | `Admin123!` | 社团管理员（计算机技术协会） |
| 其他社团管理员邮箱 | `Admin123!` | 社团管理员 |

---

## 一、认证模块

**路由前缀**: `/auth`

### 1.1 用户注册

```http
POST /auth/register
```

**认证**: 不需要

**请求体**:

```json
{
  "email": "zhangsan@example.com",
  "password": "Password123!",
  "name": "张三",
  "profileFields": {
    "studentId": "2021001001",
    "phone": "13800138000",
    "college": "计算机学院",
    "major": "计算机科学与技术",
    "grade": "大二"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `email` | string | ✅ | 邮箱，需唯一 |
| `password` | string | ✅ | 密码，6~50 位 |
| `name` | string | ❌ | 姓名，最多 100 字符 |
| `profileFields` | object | ❌ | 动态档案字段，key 为字段名 |

**响应**:

```json
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "zhangsan@example.com",
      "name": "张三",
      "role": { "id": "uuid", "name": "候选人", "code": "candidate" },
      "status": "active"
    }
  }
}
```

---

### 1.2 用户登录

```http
POST /auth/login
```

**认证**: 不需要

**请求体**:

```json
{
  "email": "zhangsan@example.com",
  "password": "Password123!"
}
```

**响应**: 同注册，返回 `accessToken`、`refreshToken` 和用户信息。

---

### 1.3 刷新 Token

```http
POST /auth/refresh
```

**认证**: 不需要

**请求体**:

```json
{
  "refreshToken": "eyJ..."
}
```

> `accessToken` 有效期为 15 分钟，`refreshToken` 用于续期，有效期更长。

---

### 1.4 登出

```http
POST /auth/logout
```

**认证**: 不需要

**响应**: `{ "message": "登出成功" }`

---

## 二、用户模块

**路由前缀**: `/users`，所有接口需要登录

### 2.1 获取当前用户信息

```http
GET /users/profile
```

**响应**:

```json
{
  "data": {
    "id": "uuid",
    "email": "zhangsan@example.com",
    "name": "张三",
    "avatar": null,
    "status": "active",
    "role": "candidate",
    "permissions": [{ "code": "file_upload", "module": "file" }],
    "phone": "13800138000",
    "studentId": "2021001001",
    "college": "计算机学院",
    "major": "计算机科学与技术",
    "grade": "大二",
    "profileFields": { "studentId": "2021001001", "phone": "13800138000" },
    "createdAt": "2026-01-17T07:14:27.788Z"
  }
}
```

---

### 2.2 更新基本信息

```http
PUT /users/profile/basic
```

**请求体**:

```json
{
  "name": "张三",
  "avatar": "https://example.com/avatar.jpg"
}
```

---

### 2.3 更新档案字段

```http
PUT /users/profile/fields
```

**请求体**:

```json
{
  "profileFields": {
    "phone": "13800138000",
    "college": "计算机学院",
    "major": "软件工程"
  }
}
```

**响应**:

```json
{
  "data": {
    "message": "档案字段更新成功",
    "updatedFields": ["phone", "college", "major"],
    "profileFields": { "phone": "13800138000", "college": "计算机学院" }
  }
}
```

---

### 2.4 获取档案字段配置

```http
GET /users/profile/fields-config
```

> 用于渲染用户信息编辑表单，返回字段定义和当前值。

**响应**:

```json
{
  "data": {
    "fields": [
      {
        "id": "uuid",
        "fieldName": "phone",
        "fieldLabel": "手机号码",
        "fieldType": "text",
        "isRequired": true,
        "placeholder": "请输入手机号",
        "currentValue": "13800138000"
      }
    ]
  }
}
```

---

## 三、招新模块

**路由前缀**: `/recruitment`

### 3.1 获取招新列表（公开）

```http
GET /recruitment/public
```

**认证**: 不需要

**Query 参数**:

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `clubId` | string | ❌ | 按社团筛选 |
| `search` | string | ❌ | 搜索标题/描述 |
| `page` | number | ❌ | 页码，默认 1 |
| `limit` | number | ❌ | 每页条数，默认 10 |

**响应**:

```json
{
  "data": {
    "data": [
      {
        "id": "uuid",
        "title": "2024 秋季招新",
        "description": "欢迎加入...",
        "startTime": "2024-09-01T00:00:00.000Z",
        "endTime": "2024-10-01T00:00:00.000Z",
        "status": "published",
        "maxApplicants": 50,
        "club": { "id": "uuid", "name": "计算机技术协会" },
        "applicationCount": 25
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 3, "pages": 1 }
  }
}
```

---

### 3.2 获取招新列表（需登录）

```http
GET /recruitment
```

**认证**: 需要（可查看更多状态的招新）

**Query 参数**: 同 3.1，另支持 `status` 字段过滤。

---

### 3.3 获取招新详情（公开）

```http
GET /recruitment/public/:id
```

**认证**: 不需要，仅返回 `published` 状态的招新。

---

### 3.4 获取招新详情（需登录）

```http
GET /recruitment/:id
```

**认证**: 需要

---

### 3.5 创建招新

```http
POST /recruitment
```

**认证**: 需要 | **权限**: `club_admin` / `super_admin`

**请求体**:

```json
{
  "title": "2024 秋季招新",
  "clubId": "uuid",
  "description": "欢迎加入我们！",
  "startTime": "2024-09-01T00:00:00.000Z",
  "endTime": "2024-10-01T00:00:00.000Z",
  "maxApplicants": 50,
  "requiredFields": ["name", "studentId", "phone"],
  "customQuestions": [
    {
      "id": "q1",
      "question": "为什么想加入我们？",
      "type": "text",
      "required": true
    }
  ]
}
```

---

### 3.6 更新招新

```http
PUT /recruitment/:id
```

**认证**: 需要 | **权限**: `club_admin`（自己社团）/ `super_admin`

**请求体**: 同创建，所有字段均为可选。

---

### 3.7 更新招新状态

```http
PUT /recruitment/:id/status
```

**认证**: 需要 | **权限**: `club_admin` / `super_admin`

**请求体**:

```json
{
  "status": "published"
}
```

> 招新状态流转：`draft` → `published` → `ongoing` → `finished` → `archived`

---

### 3.8 删除招新

```http
DELETE /recruitment/:id
```

**认证**: 需要 | **权限**: `club_admin` / `super_admin`

**响应**: `204 No Content`

---

## 四、申请模块

**路由前缀**: `/applications`，所有接口需要登录

### 4.1 仪表盘统计

```http
GET /applications/dashboard
```

**权限**: `club_admin` / `super_admin`

> `club_admin` 只返回自己社团的数据，`super_admin` 返回全局数据。

**响应**:

```json
{
  "data": {
    "stats": {
      "totalApplicants": 156,
      "passedCount": 42,
      "pendingInterviewCount": 28,
      "rejectedCount": 12,
      "submittedCount": 30,
      "screeningCount": 20,
      "offerSentCount": 10,
      "acceptedCount": 14,
      "activeRecruitments": 3
    },
    "recentActivities": [
      {
        "id": "uuid",
        "type": "application_submitted",
        "content": "王小明 提交了「计算机技术协会...」的申请",
        "applicantId": "uuid",
        "applicantName": "王小明",
        "recruitmentTitle": "计算机技术协会 2025 春季招新",
        "clubName": "计算机技术协会",
        "status": "submitted",
        "time": "2026-03-17T10:00:00.000Z"
      }
    ]
  }
}
```

---

### 4.2 获取申请列表

```http
GET /applications
```

**Query 参数**:

| 参数 | 类型 | 说明 |
|---|---|---|
| `status` | string | 按状态筛选，见[申请状态枚举](#申请状态) |
| `recruitmentId` | string | 按招新批次筛选 |
| `applicantId` | string | 按申请人筛选（管理员用） |
| `clubId` | string | 按社团筛选 |
| `page` | number | 页码，默认 1 |
| `limit` | number | 每页条数，默认 10 |

> `candidate` 角色只能看到自己的申请；`club_admin` 只能看到自己社团的申请。

**响应**（每条申请包含完整申请人信息和附件文件）:

```json
{
  "data": {
    "data": [
      {
        "id": "uuid",
        "status": "submitted",
        "resumeText": "自我介绍...",
        "education": { "college": "计算机学院", "major": "软件工程" },
        "skills": { "technical": [{ "name": "Python", "level": "advanced" }] },
        "experiences": [],
        "createdAt": "2026-03-15T10:00:00.000Z",
        "updatedAt": "2026-03-15T10:00:00.000Z",
        "recruitment": {
          "id": "uuid",
          "title": "2024 秋季招新",
          "club": { "id": "uuid", "name": "计算机技术协会" }
        },
        "applicant": {
          "id": "uuid",
          "name": "张三",
          "email": "zhangsan@example.com",
          "avatar": null,
          "phone": "13800138000",
          "studentId": "2021001001",
          "college": "计算机学院",
          "major": "软件工程",
          "grade": "大二"
        },
        "files": [
          {
            "fileId": "uuid",
            "fileType": "resume",
            "description": "个人简历",
            "originalName": "张三_简历.pdf",
            "mimeType": "application/pdf",
            "size": 102400,
            "previewable": true,
            "viewUrl": "http://localhost:3001/api/v1/files/<fileId>/view",
            "downloadUrl": "http://localhost:3001/api/v1/files/<fileId>"
          }
        ]
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 8, "pages": 1 }
  }
}
```

---

### 4.3 获取我的申请

```http
GET /applications/my
```

**权限**: 候选人自己调用，返回自己的全部申请。

---

### 4.4 获取申请详情

```http
GET /applications/:id
```

> 候选人只能查看自己的申请；管理员可查看所有。

**响应**: 同申请列表中的单条数据结构，`files` 字段同样包含 `viewUrl` / `downloadUrl`。

---

### 4.5 提交申请

```http
POST /applications
```

**权限**: 登录用户均可（不限角色）

> ⚠️ 文件需先通过 `POST /files/upload` 上传，拿到 `fileId` 后通过 `fileLinks` 字段关联。

**请求体**:

```json
{
  "recruitmentId": "uuid",
  "resumeText": "我是一名大二学生，熟悉 Python 和 JavaScript...",
  "formData": {
    "college": "计算机学院",
    "major": "软件工程",
    "grade": "大二",
    "phone": "13800138000"
  },
  "skills": {
    "technical": [
      { "name": "Python", "level": "advanced", "years": 2 },
      { "name": "JavaScript", "level": "intermediate", "years": 1 }
    ],
    "soft_skills": [
      { "name": "团队合作", "level": "excellent" }
    ]
  },
  "experiences": [
    {
      "type": "project",
      "title": "校园二手交易平台",
      "description": "基于 React 和 Node.js 开发的全栈项目",
      "startDate": "2023-06-01",
      "endDate": "2023-08-31",
      "skills": ["React", "Node.js", "MongoDB"]
    }
  ],
  "fileLinks": [
    {
      "fileId": "uuid（先调用文件上传接口获取）",
      "fileType": "resume",
      "description": "个人简历 PDF"
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `recruitmentId` | string | ✅ | 招新批次 ID |
| `resumeText` | string | ❌ | 自我介绍 / 简历文本 |
| `formData` | object | ❌ | 表单数据（自定义字段） |
| `skills` | object | ❌ | 技能信息 |
| `experiences` | array | ❌ | 项目/实习/活动经历 |
| `fileLinks` | array | ❌ | 关联的已上传文件列表 |

---

### 4.6 为申请追加文件

```http
PUT /applications/:id/files
```

**权限**: 申请人本人或管理员

> 同一个 `fileId` 重复关联会自动去重（upsert 语义）。

**请求体**:

```json
{
  "fileLinks": [
    {
      "fileId": "uuid",
      "fileType": "portfolio",
      "description": "作品集"
    }
  ]
}
```

`fileType` 可选值：`resume` | `portfolio` | `certificate` | `other`

**响应**: 返回该申请最新的完整文件列表（含 `viewUrl` / `downloadUrl`）：

```json
{
  "data": {
    "files": [
      {
        "fileId": "uuid",
        "fileType": "resume",
        "description": "个人简历",
        "originalName": "张三_简历.pdf",
        "mimeType": "application/pdf",
        "size": 102400,
        "previewable": true,
        "viewUrl": "http://localhost:3001/api/v1/files/<fileId>/view",
        "downloadUrl": "http://localhost:3001/api/v1/files/<fileId>"
      }
    ]
  }
}
```

---

### 4.7 更新申请状态（简历流转）

```http
PUT /applications/:id/status
```

**权限**: `club_admin` / `super_admin`

**请求体**:

```json
{
  "status": "screening",
  "comment": "通过初步筛选，进入面试环节"
}
```

**申请状态流转**:

```
draft（草稿）
  └─→ submitted（已提交）
        ├─→ screening（筛选中）
        │     ├─→ passed（通过筛选）
        │     │     ├─→ interview_scheduled（已安排面试）
        │     │     │     └─→ interview_completed（面试完成）
        │     │     │           ├─→ offer_sent（已发 Offer）
        │     │     │           │     ├─→ accepted（已接受）
        │     │     │           │     └─→ declined（已拒绝）
        │     │     │           └─→ rejected（淘汰）
        │     │     └─→ rejected（淘汰）
        │     └─→ rejected（淘汰）
        └─→ archived（归档）
```

---

### 4.8 删除申请

```http
DELETE /applications/:id
```

**权限**: 申请人本人（仅可删除 `draft` 草稿状态）

**响应**: `204 No Content`

---

## 五、文件模块

**路由前缀**: `/files`

### 5.1 上传文件

```http
POST /files/upload
Content-Type: multipart/form-data
```

**认证**: 需要

**表单字段**:

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `file` | File | ✅ | 文件内容，最大 10MB |
| `category` | string | ❌ | 分类：`resume` / `avatar` / `portfolio` / `certificate` |
| `description` | string | ❌ | 文件描述 |

**支持的文件类型**：`pdf`、`doc`、`docx`、`zip`、`jpg`、`png`、`gif`

**响应**:

```json
{
  "data": {
    "data": {
      "id": "uuid",
      "filename": "张三_简历_1742227456_abc123.pdf",
      "originalName": "张三_简历.pdf",
      "mimeType": "application/pdf",
      "size": "102400",
      "uploadedBy": "user-uuid",
      "createdAt": "2026-03-17T10:00:00.000Z"
    },
    "message": "文件上传成功"
  }
}
```

> ⚠️ 注意：`data.data.id` 就是后续使用的 `fileId`（响应有两层 `data`，这是历史遗留）

---

### 5.2 在线预览文件

```http
GET /files/:id/view
```

**认证**: **不需要**（公开接口，可直接嵌入 `<iframe>`）

**支持预览的类型**: `image/jpeg`、`image/png`、`image/gif`、`application/pdf`

> 响应头为 `Content-Disposition: inline`，浏览器会直接渲染而非触发下载。

**前端使用**:

```tsx
// 直接在新标签打开
window.open(file.viewUrl);

// 嵌入 iframe 预览
<iframe src={file.viewUrl} width="100%" height="600px" />

// 判断是否可预览
{file.previewable ? (
  <Button onClick={() => window.open(file.viewUrl)}>预览</Button>
) : (
  <Button onClick={() => downloadWithAuth(file.downloadUrl)}>下载</Button>
)}
```

---

### 5.3 下载文件

```http
GET /files/:id
Authorization: Bearer <token>
```

**认证**: 需要 | **权限**: 文件上传者本人或管理员（`club_admin` / `super_admin`）

> 返回二进制流，响应头为 `Content-Disposition: attachment`。

**前端下载示例**:

```typescript
async function downloadFile(fileId: string, token: string) {
  const response = await fetch(`/api/v1/files/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '文件名.pdf';
  a.click();
}
```

---

### 5.4 获取我的文件列表

```http
GET /files
```

**认证**: 需要

**响应**: 返回当前用户上传的所有文件列表。

---

### 5.5 删除文件

```http
DELETE /files/:id
```

**认证**: 需要 | **权限**: 文件上传者本人

---

### 5.6 文件使用统计

```http
GET /files/stats/summary
```

**认证**: 需要

**响应**:

```json
{
  "data": {
    "totalFiles": 5,
    "totalSize": 512000,
    "totalSizeFormatted": "500 KB"
  }
}
```

---

### 5.7 文件上传 + 提交申请完整流程

```
步骤 1：上传文件
  POST /files/upload
  → 返回 data.data.id（fileId）

步骤 2：提交申请（携带 fileLinks）
  POST /applications
  body: { recruitmentId, fileLinks: [{ fileId, fileType, description }] }

  或 提交申请后追加文件：
  PUT /applications/:id/files
  body: { fileLinks: [{ fileId, fileType, description }] }

步骤 3：管理员查看简历时
  GET /applications 或 GET /applications/:id
  → 返回的 files[] 中包含 viewUrl / downloadUrl，直接使用即可
```

---

## 六、社团管理

**路由前缀**: `/clubs` | **权限**: `super_admin`

### 6.1 获取社团列表

```http
GET /clubs
```

**Query 参数**: `page`、`limit`、`search`、`isActive`

---

### 6.2 获取社团详情

```http
GET /clubs/:id
```

---

### 6.3 创建社团

```http
POST /clubs
```

**请求体**:

```json
{
  "name": "计算机技术协会",
  "description": "致力于推广计算机技术...",
  "category": "科技",
  "logo": "https://example.com/logo.png"
}
```

---

### 6.4 更新社团信息

```http
PUT /clubs/:id
```

**请求体**: 同创建，所有字段均为可选。

---

### 6.5 删除社团（软删除）

```http
DELETE /clubs/:id
```

---

### 6.6 更新社团管理员列表（全量替换）

```http
PUT /clubs/:id/admins
```

**请求体**:

```json
{
  "adminIds": ["user-uuid-1", "user-uuid-2"]
}
```

---

### 6.7 添加社团管理员

```http
POST /clubs/:id/admins
```

**请求体**: `{ "adminId": "uuid" }`

---

### 6.8 移除社团管理员

```http
DELETE /clubs/:id/admins/:adminId
```

---

## 七、超级管理员

**路由前缀**: `/admin` | **权限**: `super_admin`

### 7.1 获取用户列表

```http
GET /admin/users
```

**Query 参数**:

| 参数 | 说明 |
|---|---|
| `role` | 角色筛选：`candidate` / `club_admin` / `super_admin` |
| `status` | 状态筛选：`active` / `inactive` / `suspended` |
| `search` | 搜索姓名 / 邮箱 |
| `page` / `limit` | 分页 |

**响应**（含统计信息）:

```json
{
  "data": {
    "data": [...用户列表],
    "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 },
    "statistics": {
      "totalUsers": 100,
      "activeUsers": 80,
      "adminUsers": 5,
      "candidateUsers": 95
    }
  }
}
```

---

### 7.2 创建社团管理员账号

```http
POST /admin/users/club-admin
```

**请求体**:

```json
{
  "email": "admin@example.com",
  "password": "Admin123!",
  "name": "管理员张三",
  "clubId": "社团-uuid"
}
```

---

### 7.3 获取用户详情

```http
GET /admin/users/:id
```

---

### 7.4 修改用户状态

```http
PUT /admin/users/:id/status
```

**请求体**:

```json
{
  "status": "suspended",
  "reason": "违规操作"
}
```

---

### 7.5 修改用户角色

```http
PUT /admin/users/:id/role
```

**请求体**:

```json
{
  "roleCode": "club_admin"
}
```

---

### 7.6 更新用户信息

```http
PUT /admin/users/:id
```

**请求体**（均为可选字段）:

```json
{
  "name": "张三",
  "roleCode": "club_admin",
  "status": "active",
  "avatar": "https://...",
  "profileFields": { "phone": "13800138000" }
}
```

---

### 7.7 删除用户（软删除）

```http
DELETE /admin/users/:id
```

---

### 7.8 系统概览统计

```http
GET /admin/stats/overview
```

**响应**:

```json
{
  "data": {
    "overview": {
      "totalUsers": 100,
      "totalClubs": 5,
      "totalRecruitments": 10,
      "activeUsers": 80,
      "activeRecruitments": 3
    },
    "usersByRole": [
      { "roleName": "候选人", "roleCode": "candidate", "count": 95 }
    ],
    "recentUsers": [...]
  }
}
```

---

### 7.9 注册字段管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/admin/registration-fields` | 获取所有字段（含未启用） |
| `GET` | `/admin/registration-fields/active` | 获取启用的字段 |
| `POST` | `/admin/registration-fields` | 创建字段 |
| `PUT` | `/admin/registration-fields/:id` | 更新字段 |
| `DELETE` | `/admin/registration-fields/:id` | 删除字段 |

---

## 八、角色管理

**路由前缀**: `/roles` | **权限**: `super_admin`

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/roles` | 获取所有角色（含权限） |
| `GET` | `/roles/:id` | 获取角色详情 |
| `GET` | `/roles/code/:code` | 按代码获取角色 |
| `POST` | `/roles` | 创建角色 |
| `PUT` | `/roles/:id` | 更新角色 |
| `DELETE` | `/roles/:id` | 删除角色（系统默认角色不可删除） |
| `POST` | `/roles/:id/permissions` | 替换角色权限（全量） |
| `POST` | `/roles/:id/permissions/add` | 追加权限 |
| `DELETE` | `/roles/:id/permissions/remove` | 移除权限 |
| `GET` | `/roles/:id/permissions` | 获取角色权限代码列表 |

**创建角色请求体**:

```json
{
  "name": "测试管理员",
  "code": "test_admin",
  "level": 1,
  "description": "测试用管理员",
  "permissionCodes": ["user_read", "recruitment_read"]
}
```

---

## 九、权限管理

**路由前缀**: `/permissions` | **权限**: `super_admin`

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/permissions` | 获取权限列表（支持 `?module=user` 筛选） |
| `GET` | `/permissions/grouped` | 按模块分组的权限列表 |
| `GET` | `/permissions/modules` | 获取所有权限模块名 |
| `GET` | `/permissions/stats` | 权限统计信息 |
| `GET` | `/permissions/:id` | 权限详情 |
| `GET` | `/permissions/code/:code` | 按代码查询权限 |
| `POST` | `/permissions` | 创建权限 |
| `POST` | `/permissions/batch` | 批量创建权限 |
| `PUT` | `/permissions/:id` | 更新权限 |
| `DELETE` | `/permissions/:id` | 删除权限 |
| `POST` | `/permissions/validate` | 验证权限代码是否存在 |

---

## 十、注册字段

**路由前缀**: `/registration-fields`

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| `GET` | `/registration-fields/active` | 不需要 | 获取所有启用字段（注册/申请均包含） |
| `GET` | `/registration-fields/register` | 不需要 | 仅获取注册用字段 |
| `GET` | `/registration-fields/recruitment` | 不需要 | 仅获取招新申请表用字段 |
| `GET` | `/registration-fields/admin` | `super_admin` | 获取所有字段（含未启用） |
| `GET` | `/registration-fields/admin/:id` | `super_admin` | 字段详情 |
| `POST` | `/registration-fields` | `super_admin` | 创建字段 |
| `PATCH` | `/registration-fields/:id` | `super_admin` | 更新字段 |
| `DELETE` | `/registration-fields/:id` | `super_admin` | 删除字段 |

---

## 附录：枚举值

### 申请状态

| 值 | 说明 | 操作方 |
|---|---|---|
| `draft` | 草稿（未提交） | 候选人 |
| `submitted` | 已提交，等待审核 | 候选人 |
| `screening` | 管理员筛选中 | 管理员 |
| `passed` | 通过简历筛选 | 管理员 |
| `rejected` | 任意阶段淘汰 | 管理员 |
| `interview_scheduled` | 已安排面试时间 | 管理员 |
| `interview_completed` | 面试已结束 | 管理员 |
| `offer_sent` | 已发送录用通知 | 管理员 |
| `accepted` | 候选人接受 Offer | 管理员/候选人 |
| `declined` | 候选人拒绝 Offer | 管理员/候选人 |
| `archived` | 已归档 | 管理员 |

### 招新状态

| 值 | 说明 |
|---|---|
| `draft` | 草稿 |
| `published` | 已发布（接受申请） |
| `ongoing` | 进行中 |
| `finished` | 已结束 |
| `archived` | 已归档 |

### 文件分类（fileType）

| 值 | 说明 |
|---|---|
| `resume` | 简历 |
| `portfolio` | 作品集 |
| `certificate` | 证书 |
| `avatar` | 头像 |
| `other` | 其他 |

### 用户状态

| 值 | 说明 |
|---|---|
| `active` | 正常 |
| `inactive` | 已停用 |
| `suspended` | 已封禁 |

### 注册字段类型（fieldType）

| 值 | 说明 |
|---|---|
| `text` | 单行文本 |
| `textarea` | 多行文本 |
| `select` | 下拉选择 |
| `radio` | 单选 |
| `checkbox` | 多选 |
| `file` | 文件上传 |
| `date` | 日期 |
