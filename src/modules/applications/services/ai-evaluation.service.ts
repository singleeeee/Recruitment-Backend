import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';
import * as fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;
import * as mammoth from 'mammoth';

/** AI 评估结果结构 */
interface AiEvaluationResult {
  score: number;           // 0-100 综合评分
  summary: string;         // 一句话总结
  strengths: string[];     // 优势亮点
  weaknesses: string[];    // 不足之处
  recommendation: string;  // 录取建议: strongly_recommend | recommend | pending | not_recommend
  details: {
    motivation: number;    // 动机与热情 0-100
    experience: number;    // 相关经验 0-100
    skills: number;        // 技能匹配 0-100
    expression: number;    // 表达能力 0-100
  };
}

@Injectable()
export class AiEvaluationService {
  private readonly logger = new Logger(AiEvaluationService.name);
  private readonly openai: OpenAI | null;
  /** AI 功能是否可用（未配置 API Key 时为 false，静默跳过） */
  private readonly aiEnabled: boolean;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const baseURL = this.configService.get<string>('OPENAI_BASE_URL');

    if (apiKey && baseURL) {
      this.openai = new OpenAI({ apiKey, baseURL });
      this.aiEnabled = true;
      this.logger.log(`AI 评估已启用，baseURL=${baseURL}`);
    } else {
      this.openai = null;
      this.aiEnabled = false;
      this.logger.warn('未配置 OPENAI_API_KEY 或 OPENAI_BASE_URL，AI 评估功能已禁用');
    }
  }

  /**
   * 异步触发 AI 评估（不阻塞申请创建接口）
   */
  async triggerEvaluation(applicationId: string): Promise<void> {
    if (!this.aiEnabled) return; // 未配置时静默跳过
    // 异步执行，不 await，不阻塞调用方
    this.runEvaluation(applicationId).catch((err) => {
      this.logger.error(`AI 评估失败 [applicationId=${applicationId}]: ${err.message}`, err.stack);
    });
  }

  /**
   * 核心评估逻辑
   */
  private async runEvaluation(applicationId: string): Promise<void> {
    this.logger.log(`开始 AI 评估 [applicationId=${applicationId}]`);

    // 1. 查询申请及关联文件
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        files: {
          include: {
            file: true,
          },
        },
        recruitment: {
          select: {
            title: true,
            description: true,
          },
        },
      },
    });

    if (!application) {
      this.logger.warn(`申请不存在 [applicationId=${applicationId}]`);
      return;
    }

    // 2. 收集所有文本内容
    const textParts: string[] = [];

    // 2a. 招新信息（提供上下文）
    if (application.recruitment) {
      textParts.push(
        `【招新信息】\n招新名称：${application.recruitment.title}\n${application.recruitment.description || ''}`,
      );
    }

    // 2b. 表单填写的文本简历
    if (application.resumeText) {
      textParts.push(`【文本简历】\n${application.resumeText}`);
    }

    // 2c. 结构化表单数据（education 字段）
    if (application.education) {
      const edu = application.education as Record<string, any>;
      const eduLines = Object.entries(edu)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      if (eduLines) {
        textParts.push(`【申请表单】\n${eduLines}`);
      }
    }

    // 2d. 技能信息
    if (application.skills) {
      textParts.push(`【技能信息】\n${JSON.stringify(application.skills, null, 2)}`);
    }

    // 2e. 项目/经历
    if (application.experiences) {
      textParts.push(`【项目经历】\n${JSON.stringify(application.experiences, null, 2)}`);
    }

    // 2f. 从附件中提取文本
    for (const appFile of application.files) {
      const { storagePath, mimeType, originalName } = appFile.file;
      const extracted = await this.extractTextFromFile(storagePath, mimeType, originalName);
      if (extracted) {
        textParts.push(`【附件：${originalName}】\n${extracted}`);
      }
    }

    if (textParts.length === 0) {
      this.logger.warn(`申请内容为空，跳过 AI 评估 [applicationId=${applicationId}]`);
      return;
    }

    // 3. 构建 Prompt 并调用 LLM
    const fullContext = textParts.join('\n\n---\n\n');
    const result = await this.callLLM(fullContext);

    // 4. 写回数据库
    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        aiScore: result.score,
        aiAnalysis: result as any,
      },
    });

    this.logger.log(
      `AI 评估完成 [applicationId=${applicationId}] score=${result.score} recommendation=${result.recommendation}`,
    );
  }

  /**
   * 从文件中提取文本
   */
  private async extractTextFromFile(
    storagePath: string,
    mimeType: string,
    originalName: string,
  ): Promise<string | null> {
    if (!fs.existsSync(storagePath)) {
      this.logger.warn(`文件不存在: ${storagePath}`);
      return null;
    }

    try {
      // PDF
      if (mimeType === 'application/pdf') {
        const buffer = fs.readFileSync(storagePath);
        const data = await pdfParse(buffer);
        return data.text?.trim() || null;
      }

      // DOCX
      if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        const result = await mammoth.extractRawText({ path: storagePath });
        return result.value?.trim() || null;
      }

      // 图片：让 LLM 直接识别（视觉能力）
      if (mimeType.startsWith('image/')) {
        return await this.extractTextFromImage(storagePath, mimeType);
      }

      this.logger.warn(`不支持的文件类型，跳过提取: ${mimeType} (${originalName})`);
      return null;
    } catch (err) {
      this.logger.error(`文件文本提取失败 [${originalName}]: ${err.message}`);
      return null;
    }
  }

  /**
   * 图片文字提取（base64 传给视觉模型）
   */
  private async extractTextFromImage(imagePath: string, mimeType: string): Promise<string | null> {
    if (!this.openai) return null;
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64 = imageBuffer.toString('base64');

      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('AI_MODEL') || 'DeepSeek-V3.2-Meituan',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请提取这张图片中的所有文字内容，保持原有格式，不要添加任何解释。',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      });

      return response.choices[0]?.message?.content?.trim() || null;
    } catch (err) {
      this.logger.error(`图片文字提取失败: ${err.message}`);
      return null;
    }
  }

  /**
   * 调用 LLM 进行评估
   */
  private async callLLM(resumeContext: string): Promise<AiEvaluationResult> {
    if (!this.openai) throw new Error('AI 服务未初始化');
    const systemPrompt = `你是一个专业的社团招新评估助手。请根据申请人提交的简历和申请信息，进行客观、公正的综合评估。

评估维度：
1. 动机与热情（motivation）：申请人对该社团/岗位的热情和动机是否清晰、真诚
2. 相关经验（experience）：是否有相关的项目经历、实践经验或学习背景
3. 技能匹配（skills）：技能与招新要求的匹配程度
4. 表达能力（expression）：简历/申请书的表达是否清晰、有条理

请严格按照以下 JSON 格式输出，不要输出任何其他内容：
{
  "score": <综合评分 0-100 的整数>,
  "summary": "<一句话总结申请人特点，不超过50字>",
  "strengths": ["<优势1>", "<优势2>", "<优势3>"],
  "weaknesses": ["<不足1>", "<不足2>"],
  "recommendation": "<strongly_recommend|recommend|pending|not_recommend 之一>",
  "details": {
    "motivation": <0-100 整数>,
    "experience": <0-100 整数>,
    "skills": <0-100 整数>,
    "expression": <0-100 整数>
  }
}`;

    const response = await this.openai.chat.completions.create({
      model: this.configService.get<string>('AI_MODEL') || 'DeepSeek-V3.2-Meituan',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `请评估以下申请人的简历信息：\n\n${resumeContext}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // 低温度，保证输出稳定
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('LLM 返回内容为空');
    }

    const result = JSON.parse(content) as AiEvaluationResult;

    // 基本校验
    if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) {
      throw new Error(`LLM 返回的 score 无效: ${result.score}`);
    }

    return result;
  }

  /**
   * 手动重新评估（供管理员触发）
   */
  async reEvaluate(applicationId: string): Promise<void> {
    this.logger.log(`手动触发重新评估 [applicationId=${applicationId}]`);
    await this.runEvaluation(applicationId);
  }
}
