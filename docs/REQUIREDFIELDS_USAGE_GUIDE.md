# RecruitmentBatch requiredFields 使用指南

## 📋 概述

`requiredFields` 是 `RecruitmentBatch`（招新批次）模型中的一个字段，用于定义申请该招新时需要用户提供的必填档案字段。这个字段的值应该与系统配置的注册字段（RegistrationField）的 `fieldName` 相对应。

## 🏗️ 数据结构与类型

### 数据库模型定义
```prisma
model RecruitmentBatch {
  id             String   @id @default(uuid())
  title          String
  description    String?
  // ... 其他字段
  requiredFields String[]  @map("required_fields")  // 必填字段列表
  // ...
}
```

### TypeScript 类型定义
```typescript
interface RecruitmentBatch {
  id: string;
  title: string;
  description?: string;
  requiredFields?: string[];  // 字符串数组
  // ...
}

interface CreateRecruitmentBatchDto {
  title: string;
  description?: string;
  requiredFields?: string[];  // 必填字段数组
  // ...
}
```

## 🎯 字段用途

### 核心功能
`requiredFields` 的作用是：
1. **控制申请表单**: 指定用户在申请该招新时需要填写哪些档案字段
2. **数据验证**: 确保申请者提供了所有必需的个人信息
3. **灵活性**: 不同招新可以要求不同的必填字段组合

### 业务场景
- 技术社团可能要求：学号、专业、相关经验
- 文艺社团可能要求：学号、加入动机、个人特长
- 学术社团可能要求：学号、专业、年级、学术经历

## 📚 可用的字段名称

系统预定义的注册字段（RegistrationField）的 `fieldName` 包括：

| fieldName | fieldLabel | fieldType | 说明 |
|-----------|------------|-----------|------|
| `studentId` | 学号 | text | 学校学号 |
| `phone` | 手机号 | text | 联系电话 |
| `college` | 学院 | text | 所属学院 |
| `major` | 专业 | text | 专业名称 |
| `grade` | 年级 | select | 年级选择 |
| `experience` | 相关经验 | textarea | 项目/工作经验 |
| `motivation` | 加入动机 | textarea | 申请理由 |
| `portfolio` | 作品集 | file | 作品文件 |

## 🚀 使用方法

### 1. 创建招新时设置 requiredFields

#### 示例 1: 基础必填字段
```typescript
// 只要求最基本的学号和手机号
const createRecruitmentData = {
  title: "2024年春季技术社团招新",
  description: "欢迎热爱技术的同学加入",
  startTime: "2024-02-01T00:00:00.000Z",
  endTime: "2024-03-01T00:00:00.000Z",
  clubId: "club-uuid",
  requiredFields: ["studentId", "phone"]
};
```

#### 示例 2: 技术社团全面要求
```typescript
// 技术社团要求详细的背景信息
const techRecruitmentData = {
  title: "2024年程序开发社团招新",
  description: "寻找有编程基础的同学",
  startTime: "2024-02-01T00:00:00.000Z",
  endTime: "2024-03-01T00:00:00.000Z",
  clubId: "tech-club-uuid",
  requiredFields: [
    "studentId",     // 学号（必填）
    "phone",         // 手机号（必填）
    "college",       // 学院
    "major",         // 专业
    "grade",         // 年级
    "experience"     // 相关经验
  ]
};
```

#### 示例 3: 文艺社团个性化要求
```typescript
// 文艺社团更关注个人特质和动机
const artsRecruitmentData = {
  title: "2024年文艺社团招新",
  description: "寻找有艺术天赋的同学",
  startTime: "2024-02-01T00:00:00.000Z",
  endTime: "2024-03-01T00:00:00.000Z",
  clubId: "arts-club-uuid",
  requiredFields: [
    "studentId",     // 学号
    "phone",         // 联系方式
    "motivation",    // 加入动机（很重要）
    "experience",    // 相关经验或特长
    "portfolio"      // 作品集（如果有）
  ]
};
```

### 2. API 接口使用

#### 创建招新接口
```http
POST /api/v1/recruitment
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "2024年春季技术社团招新",
  "description": "欢迎热爱技术的同学加入",
  "startTime": "2024-02-01T00:00:00.000Z",
  "endTime": "2024-03-01T00:00:00.000Z",
  "clubId": "club-uuid",
  "requiredFields": ["studentId", "phone", "college", "experience"]
}
```

#### 更新招新接口
```http
PUT /api/v1/recruitment/<recruitment-id>
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "requiredFields": ["studentId", "phone", "major", "motivation"]
}
```

### 3. 前端表单实现建议

#### 动态表单生成
```typescript
// 根据 requiredFields 动态生成申请表单
function generateApplicationForm(requiredFields: string[]) {
  const fieldConfigs = {
    studentId: { label: '学号', type: 'text', required: true },
    phone: { label: '手机号', type: 'text', required: true },
    college: { label: '学院', type: 'text', required: false },
    major: { label: '专业', type: 'text', required: false },
    grade: { 
      label: '年级', 
      type: 'select', 
      options: ['大一', '大二', '大三', '大四', '研一', '研二', '研三'],
      required: false 
    },
    experience: { label: '相关经验', type: 'textarea', required: false },
    motivation: { label: '加入动机', type: 'textarea', required: false },
    portfolio: { label: '作品集', type: 'file', required: false }
  };

  return requiredFields.map(fieldName => ({
    fieldName,
    ...fieldConfigs[fieldName]
  }));
}
```

### 4. 后端验证逻辑

#### 申请提交时的验证
```typescript
// 伪代码示例
async function validateApplication(applicationData, recruitmentBatch) {
  const requiredFields = recruitmentBatch.requiredFields || [];
  
  // 检查所有必填字段是否都提供了
  for (const field of requiredFields) {
    if (!applicationData.profileFields || !applicationData.profileFields[field]) {
      throw new BadRequestException(`缺少必填字段: ${field}`);
    }
  }
  
  return true;
}
```

## 🔧 配置建议

### 推荐配置组合

#### 1. 技术类社团
```typescript
recommendedFields = [
  "studentId",   // 基本信息
  "phone",
  "college",
  "major",
  "grade",
  "experience",  // 技术经验很重要
  "motivation"   // 了解技术热情
];
```

#### 2. 学术类社团
```typescript
recommendedFields = [
  "studentId",   // 基本信息
  "phone",
  "college",
  "major",
  "grade",       // 年级相关
  "motivation",  // 学习动机
  "experience"   // 学术经历
];
```

#### 3. 文艺类社团
```typescript
recommendedFields = [
  "studentId",   // 基本信息
  "phone",
  "motivation",  // 参与动机很重要
  "experience",  // 相关才艺
  "portfolio"    // 作品展示
];
```

### 注意事项

1. **字段存在性验证**: 确保 `requiredFields` 中的字段名在系统中已配置
2. **避免过度要求**: 不要设置过多必填字段，降低申请门槛
3. **业务相关性**: 只要求与招新相关的字段
4. **可选配置**: `requiredFields` 是可选的，可以留空表示没有特殊要求

## 🎯 示例响应

### 招新详情返回
```json
{
  "id": "recruitment-uuid",
  "title": "2024年春季技术社团招新",
  "description": "欢迎热爱技术的同学加入",
  "requiredFields": ["studentId", "phone", "college", "experience"],
  "club": {
    "id": "club-uuid",
    "name": "技术社团",
    "description": "专注于技术创新的社团"
  }
}
```

## 📊 最佳实践

1. **逐步增加**: 开始时设置最少的必填字段，根据实际需求逐步增加
2. **用户友好**: 优先选择用户容易提供的字段
3. **业务导向**: 根据社团特点选择合适的字段组合
4. **文档说明**: 在招新描述中说明必填字段的意义
5. **灵活性**: 不同招新活动可以有不同的必填字段要求

---

这份指南提供了完整的 `requiredFields` 使用方法和最佳实践，帮助开发者和运营人员更好地理解和使用这个功能。