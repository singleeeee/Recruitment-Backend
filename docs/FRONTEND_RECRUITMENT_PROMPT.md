# 招新模块前端开发 Prompt

## 🎯 概述

你是一名前端开发工程师，需要根据后端已实现的招新模块接口和业务逻辑，开发完整的前端招新管理功能。请仔细阅读以下业务流程、接口规范和实现要求。

## 📋 业务流程

### 1. 用户角色和权限
- **普通用户 (candidate)**: 可以浏览公开的招新信息，提交申请
- **社团管理员 (club_admin)**: 可以管理自己社团的招新，包括创建、编辑、删除、状态管理
- **超级管理员 (super_admin)**: 可以管理所有招新

### 2. 招新生命周期
```
草稿 (draft) → 已发布 (published) → 进行中 (ongoing) → 已结束 (finished) → 已归档 (archived)
```

### 3. 主要业务流程

#### 用户浏览流程
1. 用户访问公开招新列表页面
2. 可以搜索、筛选招新
3. 点击招新卡片查看详情
4. 如果招新开放申请，用户可点击申请按钮

#### 管理员管理流程
1. 管理员登录后访问招新管理页面
2. 查看所有招新列表（包括草稿、已发布等）
3. 创建新的招新
4. 编辑现有招新信息
5. 更新招新状态（发布、结束等）
6. 删除招新（仅当没有申请时）

## 🚀 API 接口规范

### 认证和基础信息
- **Base URL**: `/api/v1`
- **认证方式**: JWT Bearer Token
- **响应格式**: 统一响应封装

### 公开接口 (无需登录)

#### 获取招新列表
```typescript
GET /api/v1/recruitment/public

// 查询参数
interface RecruitmentPublicQuery {
  page?: number;        // 页码，默认1
  limit?: number;       // 每页数量，默认10
  clubId?: string;      // 社团ID筛选
  search?: string;      // 搜索关键词
}

// 响应格式
interface RecruitmentListResponse {
  data: RecruitmentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

#### 获取招新详情
```typescript
GET /api/v1/recruitment/public/:id

// 响应格式
interface RecruitmentDetail {
  id: string;
  title: string;
  description: string;
  startTime: string;    // ISO日期字符串
  endTime: string;      // ISO日期字符串
  status: 'draft' | 'published' | 'ongoing' | 'finished' | 'archived';
  maxApplicants?: number;
  requiredFields?: string[];
  customQuestions?: CustomQuestion[];
  club: {
    id: string;
    name: string;
    description: string;
  };
  applicationCount: number;
}
```

### 受保护接口 (需要登录)

#### 管理员接口
```typescript
// 获取招新列表（管理员）
GET /api/v1/recruitment
Authorization: Bearer <token>

// 创建招新
POST /api/v1/recruitment
Authorization: Bearer <token>
Content-Type: application/json

// 更新招新
PUT /api/v1/recruitment/:id
Authorization: Bearer <token>
Content-Type: application/json

// 更新状态
PUT /api/v1/recruitment/:id/status
Authorization: Bearer <token>
Content-Type: application/json

// 删除招新
DELETE /api/v1/recruitment/:id
Authorization: Bearer <token>
```

## 📐 数据模型

### 招新基础信息
```typescript
interface Recruitment {
  id: string;
  title: string;
  clubId: string;
  description: string;
  startTime: string;    // ISO 8601
  endTime: string;      // ISO 8601
  status: RecruitmentStatus;
  maxApplicants?: number;
  requiredFields?: string[];
  customQuestions?: CustomQuestion[];
  adminId: string;
  createdAt: string;
  updatedAt: string;
}

enum RecruitmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ONGOING = 'ongoing',
  FINISHED = 'finished',
  ARCHIVED = 'archived'
}

interface CustomQuestion {
  id: string;
  question: string;
  type: 'text' | 'choice' | 'file';
  required: boolean;
  options?: string[];   // 仅当type为choice时存在
}
```

### 创建招新数据
```typescript
interface CreateRecruitmentData {
  title: string;
  clubId: string;
  description: string;
  startTime: string;    // ISO 8601
  endTime: string;      // ISO 8601
  maxApplicants?: number;
  requiredFields?: string[];
  customQuestions?: CustomQuestion[];
}
```

### 更新状态数据
```typescript
interface UpdateStatusData {
  status: RecruitmentStatus;
}
```

## 🎨 UI/UX 设计要求

### 1. 公开页面
- **招新列表页面** (`/recruitment`)
  - 响应式网格布局展示招新卡片
  - 搜索栏支持标题和描述搜索
  - 筛选器支持按社团筛选
  - 分页控件
  - 招新卡片显示：标题、社团名称、时间、申请人数、状态标签

- **招新详情页面** (`/recruitment/:id`)
  - 完整的招新信息展示
  - 招新要求和要求字段
  - 自定义问题展示
  - 申请按钮（如果招新开放申请）
  - 返回列表按钮

### 2. 管理页面 (需要登录)
- **招新管理列表** (`/admin/recruitment`)
  - 表格或卡片展示所有招新
  - 支持多种状态筛选
  - 批量操作功能
  - 快速状态更新

- **创建招新页面** (`/admin/recruitment/create`)
  - 表单验证
  - 日期选择器
  - 动态字段添加（必填字段、自定义问题）
  - 实时保存草稿功能

- **编辑招新页面** (`/admin/recruitment/:id/edit`)
  - 预填充表单数据
  - 验证时间有效性
  - 保存和取消按钮

## 🔧 技术要求

### 必选技术栈
- **框架**: React 18+ 或 Vue 3+
- **状态管理**: Redux Toolkit / Zustand / Pinia
- **路由**: React Router / Vue Router
- **HTTP 客户端**: Axios
- **UI 组件库**: Ant Design / Element Plus / Tailwind CSS
- **表单处理**: React Hook Form / VeeValidate
- **日期处理**: date-fns / dayjs

### 功能要求
1. **错误处理**: 统一的错误提示和异常处理
2. **加载状态**: 所有API调用显示加载状态
3. **数据缓存**: 合理使用缓存避免重复请求
4. **权限控制**: 根据用户角色显示不同功能
5. **响应式设计**: 支持移动端和桌面端
6. **表单验证**: 前端验证 + 后端错误提示
7. **用户体验**: 平滑的页面切换和操作反馈

## 📝 页面规范

### 页面结构
```
src/
├── pages/
│   ├── recruitment/
│   │   ├── index.tsx          # 公开招新列表
│   │   ├── [id].tsx           # 公开招新详情
│   │   └── admin/
│   │       ├── index.tsx      # 管理列表
│   │       ├── create.tsx     # 创建招新
│   │       └── edit/
│   │           └── [id].tsx   # 编辑招新
├── components/
│   ├── recruitment/
│   │   ├── RecruitmentCard.tsx
│   │   ├── RecruitmentList.tsx
│   │   ├── RecruitmentForm.tsx
│   │   └── StatusBadge.tsx
├── services/
│   └── recruitment.ts        # API服务
├── store/
│   └── recruitmentSlice.ts   # 状态管理
└── types/
    └── recruitment.ts        # TypeScript类型定义
```

### 错误处理规范
```typescript
// API错误统一处理
try {
  const response = await recruitmentService.getList(params);
  // 处理成功响应
} catch (error) {
  if (error.response?.status === 401) {
    // 跳转到登录页面
  } else if (error.response?.status === 403) {
    // 显示权限不足提示
  } else {
    // 显示通用错误提示
  }
}
```

## 🎯 开发建议

### 1. 开发顺序建议
1. 定义TypeScript类型和接口
2. 实现API服务层
3. 创建基础UI组件
4. 实现公开页面（列表、详情）
5. 实现管理页面（列表、创建、编辑）
6. 添加状态管理和缓存
7. 完善错误处理和用户体验

### 2. 性能优化
- 使用React.memo/Vue computed优化渲染
- 实现虚拟滚动用于大数据列表
- 合理使用useCallback/useMemo
- 图片和资源的懒加载

### 3. 可访问性
- 语义化HTML结构
- ARIA标签支持
- 键盘导航支持
- 屏幕阅读器兼容

## 📚 参考资料

### 状态说明
- **草稿**: 招新创建但未发布，只有管理员可见
- **已发布**: 公开可见，用户可以申请
- **进行中**: 招新时间范围内，接受申请
- **已结束**: 招新时间结束，不再接受申请
- **已归档**: 历史招新，仅用于查看

### 权限说明
- 普通用户只能查看公开的招新
- 社团管理员可以管理自己社团的招新
- 超级管理员可以管理所有招新
- 删除招新需要没有申请记录

### 时间验证
- 开始时间必须早于结束时间
- 招新开始后不能修改时间
- 结束时间不能早于当前时间

---

请根据以上规范和要求，开发出功能完整、用户体验良好的招新模块前端界面。注意代码的可维护性、可扩展性和性能优化。