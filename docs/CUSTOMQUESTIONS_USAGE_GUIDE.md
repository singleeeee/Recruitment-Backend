# RecruitmentBatch customQuestions 动态问题使用指南

## 🎯 概述

`customQuestions`（自定义问题）是 `RecruitmentBatch` 模型中的一个 **JSON 字段**，允许管理员为每个招新活动创建个性化的问题。这与 `requiredFields`（预定义的用户档案字段）形成很好的互补。

## 📊 数据结构与类型

### 数据库模型定义
```prisma
model RecruitmentBatch {
  id             String   @id @default(uuid())
  title          String
  description    String?
  // ... 其他字段
  requiredFields String[]  @map("required_fields")      // 预定义字段
  customQuestions Json?   @map("custom_questions")     // 自定义问题
  // ...
}
```

### TypeScript 类型定义
```typescript
interface CustomQuestion {
  id: string;                    // 问题唯一ID
  question: string;              // 问题内容
  type: 'text' | 'choice' | 'file';  // 回答类型
  required: boolean;             // 是否必答
  options?: string[];            // 选择题选项（仅当type为choice时）
}

interface RecruitmentBatch {
  id: string;
  title: string;
  customQuestions?: CustomQuestion[];
  // ...
}
```

## 🎪 与 requiredFields 的区别

| 特性 | requiredFields | customQuestions |
|------|----------------|----------------|
| **字段类型** | String[] | Json |
| **数据来源** | 预定义的用户档案字段 | 管理员自定义问题 |
| **灵活性** | 固定字段列表 | 完全自定义 |
| **使用场景** | 基本信息收集 | 个性化评估 |
| **配置方式** | 选择现有字段 | 创建新问题 |

## 🚀 支持的题型

### 1. 文本类型 (text)
适合开放式回答、简短描述等。
```typescript
{
  id: 'q1',
  question: '为什么想加入我们社团？',
  type: 'text',
  required: true
}
```

### 2. 选择类型 (choice) 
适合有固定选项的问题。
```typescript
{
  id: 'q2',
  question: '你最擅长的编程语言是？',
  type: 'choice',
  required: true,
  options: ['JavaScript', 'Python', 'Java', 'C++', '其他']
}
```

### 3. 文件类型 (file)
适合需要上传文件的问题。
```typescript
{
  id: 'q3', 
  question: '请上传你的作品集或项目截图',
  type: 'file',
  required: false
}
```

## 🛠️ 使用方法

### 1. 创建招新时添加自定义问题

#### 基础示例 - 技术社团
```typescript
const techRecruitmentData = {
  title: "2024年春季程序开发社团招新",
  description: "寻找热爱编程的你",
  clubId: "tech-club-uuid",
  startTime: "2024-02-01T00:00:00.000Z",
  endTime: "2024-03-01T00:00:00.000Z",
  
  // 预定义必填字段
  requiredFields: ["studentId", "phone", "major", "experience"],
  
  // 自定义问题
  customQuestions: [
    {
      id: 'motivation',
      question: '为什么想加入程序开发社团？',
      type: 'text',
      required: true
    },
    {
      id: 'skills',
      question: '你最擅长的编程语言是？',
      type: 'choice', 
      required: true,
      options: ['JavaScript', 'Python', 'Java', 'C++', 'Go', '其他']
    },
    {
      id: 'project',
      question: '请描述一个你最自豪的项目经历',
      type: 'text',
      required: false
    }
  ]
};
```

#### 文艺社团示例
```typescript
const artsRecruitmentData = {
  title: "2024年文艺社团招新", 
  description: "寻找有艺术天赋的你",
  clubId: "arts-club-uuid",
  startTime: "2024-02-01T00:00:00.000Z",
  endTime: "2024-03-01T00:00:00.000Z",
  
  // 基本信息要求
  requiredFields: ["studentId", "phone", "motivation"],
  
  // 个性化问题
  customQuestions: [
    {
      id: 'talent',
      question: '你的艺术特长是什么？',
      type: 'choice',
      required: true,
      options: ['唱歌', '舞蹈', '乐器', '绘画', '摄影', '其他']
    },
    {
      id: 'experience',
      question: '请描述你的相关艺术经历',
      type: 'text',
      required: false
    },
    {
      id: 'portfolio',
      question: '请上传能展示你才艺的作品',
      type: 'file',
      required: false
    }
  ]
};
```

### 2. API 接口使用示例

#### 创建招新接口
```http
POST /api/v1/recruitment
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "2024年春季技术社团招新",
  "description": "寻找热爱编程的你",
  "startTime": "2024-02-01T00:00:00.000Z",
  "endTime": "2024-03-01T00:00:00.000Z",
  "clubId": "tech-club-uuid",
  "requiredFields": ["studentId", "phone", "major"],
  "customQuestions": [
    {
      "id": "q1",
      "question": "为什么想加入我们社团？",
      "type": "text",
      "required": true
    },
    {
      "id": "q2", 
      "question": "你最熟悉的开发领域是？",
      "type": "choice",
      "required": true,
      "options": ["前端开发", "后端开发", "移动开发", "全栈开发", "其他"]
    }
  ]
}
```

### 3. 前端实现建议

#### 动态表单渲染
```typescript
function renderCustomQuestions(questions: CustomQuestion[]) {
  return questions.map(question => {
    switch (question.type) {
      case 'text':
        return (
          <TextArea
            key={question.id}
            label={question.question}
            required={question.required}
            placeholder="请详细回答..."
          />
        );
      
      case 'choice':
        return (
          <Select
            key={question.id}
            label={question.question}
            required={question.required}
            options={question.options?.map(opt => ({ label: opt, value: opt }))}
          />
        );
      
      case 'file':
        return (
          <FileUpload
            key={question.id}
            label={question.question}
            required={question.required}
            accept=".pdf,.doc,.docx,.jpg,.png"
          />
        );
      
      default:
        return null;
    }
  });
}
```

#### 申请提交数据处理
```typescript
interface ApplicationSubmission {
  recruitmentId: string;
  profileFields: { [key: string]: string };  // requiredFields 的答案
  customAnswers: {                           // customQuestions 的答案
    [questionId: string]: string | File;
  };
}

// 示例提交数据
const applicationData = {
  recruitmentId: "recruitment-uuid",
  profileFields: {
    studentId: "2021001001",
    phone: "15706623209",
    major: "计算机科学"
  },
  customAnswers: {
    "q1": "我对编程有浓厚兴趣，希望通过社团提升技能...",
    "q2": "前端开发",
    "q3": <File Object>  // 上传的文件
  }
};
```

### 4. 后端验证逻辑

#### 问题答案验证
```typescript
async function validateCustomAnswers(
  answers: { [questionId: string]: any },
  customQuestions: CustomQuestion[]
) {
  for (const question of customQuestions) {
    const answer = answers[question.id];
    
    // 检查必答问题
    if (question.required && (!answer || answer === '')) {
      throw new BadRequestException(`必须回答问题: ${question.question}`);
    }
    
    // 根据题型验证格式
    if (answer) {
      switch (question.type) {
        case 'choice':
          if (!question.options?.includes(answer)) {
            throw new BadRequestException(`选择题答案无效: ${question.question}`);
          }
          break;
        case 'text':
          if (typeof answer !== 'string') {
            throw new BadRequestException(`文本题答案格式错误: ${question.question}`);
          }
          break;
        case 'file':
          if (!(answer instanceof File)) {
            throw new BadRequestException(`文件题必须上传文件: ${question.question}`);
          }
          break;
      }
    }
  }
}
```

## 🎯 设计建议

### 推荐问题配置

#### 技术类社团
```typescript
recommendedQuestions = [
  {
    id: 'motivation',
    question: '为什么想加入技术社团？',
    type: 'text',
    required: true
  },
  {
    id: 'skills',
    question: '你最擅长的技术栈是？',
    type: 'choice',
    required: true,
    options: ['前端', '后端', '移动端', '数据分析', '人工智能', '其他']
  },
  {
    id: 'project',
    question: '请描述你最自豪的项目',
    type: 'text',
    required: false
  },
  {
    id: 'code',
    question: '请上传代码示例或项目截图',
    type: 'file', 
    required: false
  }
];
```

#### 文艺类社团
```typescript
recommendedQuestions = [
  {
    id: 'talent',
    question: '你的艺术特长是什么？',
    type: 'choice',
    required: true,
    options: ['唱歌', '舞蹈', '乐器', '绘画', '摄影', '设计', '其他']
  },
  {
    id: 'experience',
    question: '请分享你的艺术经历或获奖情况',
    type: 'text',
    required: false
  },
  {
    id: 'portfolio',
    question: '请上传作品或表演视频',
    type: 'file',
    required: false
  }
];
```

### 最佳实践

1. **问题精简**: 一般设置 3-5 个自定义问题即可
2. **题型搭配**: text + choice + file 组合使用
3. **必答适度**: 必答问题不要超过总数的一半
4. **明确指导**: 在问题后添加填写指导
5. **测试验证**: 创建测试确保问题逻辑正确

## 📊 示例响应

### 招新详情返回
```json
{
  "id": "recruitment-uuid",
  "title": "技术社团招新",
  "description": "寻找热爱编程的你",
  "requiredFields": ["studentId", "phone", "major"],
  "customQuestions": [
    {
      "id": "q1",
      "question": "为什么想加入我们社团？",
      "type": "text",
      "required": true
    },
    {
      "id": "q2",
      "question": "你最熟悉的编程语言是？",
      "type": "choice",
      "required": true,
      "options": ["JavaScript", "Python", "Java", "C++"]
    }
  ]
}
```

通过 `customQuestions`，您可以为每个招新活动创建独特的申请体验，收集到更加个性化和有针对性的信息来评估申请者！