const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// ==================== 基础配置数据 ====================

const initialRoles = [
  { name: '系统管理员', code: 'super_admin', level: 2, description: '拥有所有权限，管理其他管理员和系统配置' },
  { name: '社团管理员', code: 'club_admin', level: 1, description: '管理社团的候选人、招新批次、通知等' },
  { name: '候选人', code: 'candidate', level: 0, description: '申请加入社团的用户' },
];

const initialPermissions = [
  { name: '查看所有用户', code: 'user_read', module: 'user', description: '查看用户列表和详情' },
  { name: '创建用户', code: 'user_create', module: 'user', description: '手动创建新用户' },
  { name: '更新用户', code: 'user_update', module: 'user', description: '修改用户信息' },
  { name: '删除用户', code: 'user_delete', module: 'user', description: '删除用户' },
  { name: '查看角色', code: 'role_read', module: 'role', description: '查看角色列表和详情' },
  { name: '创建角色', code: 'role_create', module: 'role', description: '创建新角色' },
  { name: '更新角色', code: 'role_update', module: 'role', description: '修改角色信息' },
  { name: '删除角色', code: 'role_delete', module: 'role', description: '删除角色' },
  { name: '查看招新批次', code: 'recruitment_read', module: 'recruitment', description: '查看招新批次列表和详情' },
  { name: '创建招新批次', code: 'recruitment_create', module: 'recruitment', description: '创建新招新批次' },
  { name: '更新招新批次', code: 'recruitment_update', module: 'recruitment', description: '修改招新批次' },
  { name: '删除招新批次', code: 'recruitment_delete', module: 'recruitment', description: '删除招新批次' },
  { name: '查看申请', code: 'application_read', module: 'application', description: '查看申请列表和详情' },
  { name: '更新申请状态', code: 'application_update', module: 'application', description: '修改申请状态' },
  { name: '删除申请', code: 'application_delete', module: 'application', description: '删除申请' },
  { name: '查看文件', code: 'file_read', module: 'file', description: '查看文件列表和详情' },
  { name: '上传文件', code: 'file_upload', module: 'file', description: '上传文件' },
  { name: '下载文件', code: 'file_download', module: 'file', description: '下载文件' },
  { name: '删除文件', code: 'file_delete', module: 'file', description: '删除文件' },
  { name: '查看系统设置', code: 'systemsetting_read', module: 'system', description: '查看系统设置' },
  { name: '管理系统设置', code: 'systemsetting_manage', module: 'system', description: '管理系统设置' },
  { name: '查看注册字段', code: 'registrationfield_read', module: 'system', description: '查看注册字段配置' },
  { name: '管理注册字段', code: 'registrationfield_manage', module: 'system', description: '管理注册字段配置' },
  { name: '查看社团列表', code: 'club_read', module: 'club', description: '查看社团列表和详情' },
  { name: '管理社团', code: 'club_manage', module: 'club', description: '管理社团信息' },
];

const rolePermissionsMap = {
  super_admin: ['user_read', 'user_create', 'user_update', 'user_delete', 'role_read', 'role_create', 'role_update', 'role_delete', 'recruitment_read', 'recruitment_create', 'recruitment_update', 'recruitment_delete', 'application_read', 'application_update', 'application_delete', 'file_read', 'file_upload', 'file_download', 'file_delete', 'systemsetting_read', 'systemsetting_manage', 'registrationfield_read', 'registrationfield_manage', 'club_read', 'club_manage'],
  club_admin: ['recruitment_read', 'recruitment_create', 'recruitment_update', 'recruitment_delete', 'application_read', 'application_update', 'application_delete', 'file_read', 'file_upload', 'file_download', 'file_delete'],
  candidate: ['file_upload', 'file_download'],
};

const initialRegistrationFields = [
  { fieldName: 'studentId', fieldLabel: '学号', fieldType: 'text', fieldOrder: 1, isRequired: true, isActive: true, placeholder: '请输入学号', helpText: '请输入您的学籍编号', validationRules: JSON.stringify({ pattern: '^[0-9]{10,12}$', message: '学号格式不正确' }) },
  { fieldName: 'phone', fieldLabel: '手机号', fieldType: 'text', fieldOrder: 2, isRequired: true, isActive: true, placeholder: '请输入手机号', helpText: '用于接收面试通知', validationRules: JSON.stringify({ pattern: '^1[3-9]\\d{9}$', message: '手机号格式不正确' }) },
  { fieldName: 'college', fieldLabel: '学院', fieldType: 'text', fieldOrder: 3, isRequired: true, isActive: true, placeholder: '请输入所在学院' },
  { fieldName: 'major', fieldLabel: '专业', fieldType: 'text', fieldOrder: 4, isRequired: true, isActive: true, placeholder: '请输入所学专业' },
  {
    fieldName: 'grade', fieldLabel: '年级', fieldType: 'select', fieldOrder: 5, isRequired: true, isActive: true, placeholder: '请选择年级',
    options: JSON.stringify({ options: [{ label: '大一', value: '大一' }, { label: '大二', value: '大二' }, { label: '大三', value: '大三' }, { label: '大四', value: '大四' }, { label: '研一', value: '研一' }, { label: '研二', value: '研二' }, { label: '研三', value: '研三' }, { label: '博士', value: '博士' }] })
  },
  { fieldName: 'experience', fieldLabel: '相关经验', fieldType: 'textarea', fieldOrder: 6, isRequired: false, isActive: true, placeholder: '请简述您的相关经验（可选）', helpText: '如有竞赛获奖、项目经历、社团经历等，请在此填写' },
  { fieldName: 'motivation', fieldLabel: '加入动机', fieldType: 'textarea', fieldOrder: 7, isRequired: true, isActive: true, placeholder: '请简述您的加入动机', helpText: '请说明您为什么想加入本社团，期望在其中收获什么' },
];

// ==================== 业务演示数据 ====================

// 社团数据
const clubsData = [
  {
    name: '计算机技术协会',
    description: '专注于计算机技术交流与学习，涵盖算法竞赛、Web开发、人工智能等方向，每年举办校级编程大赛。',
    category: '学术科技',
    isActive: true,
  },
  {
    name: '机器人工程实验室',
    description: '致力于机器人研发与智能控制技术探索，参与RoboMaster等国家级机器人竞赛，拥有完善的硬件实验室。',
    category: '学术科技',
    isActive: true,
  },
  {
    name: '创业孵化社',
    description: '为有创业梦想的同学提供资源对接、导师辅导和项目路演平台，已孵化多个校级优秀创业项目。',
    category: '创新创业',
    isActive: true,
  },
  {
    name: '摄影与视觉艺术社',
    description: '涵盖摄影、视频剪辑、平面设计等方向，定期举办摄影展和技术工坊，为校园活动提供摄影记录服务。',
    category: '文化艺术',
    isActive: true,
  },
];

// 社团管理员数据（与社团一一对应）
const clubAdminsData = [
  { email: 'admin.tech@university.edu', name: '陈志远', password: 'Admin123!' },
  { email: 'admin.robot@university.edu', name: '刘思远', password: 'Admin123!' },
  { email: 'admin.startup@university.edu', name: '王晓彤', password: 'Admin123!' },
  { email: 'admin.photo@university.edu', name: '张雨欣', password: 'Admin123!' },
];

// 候选人数据
const candidatesData = [
  {
    email: 'candidate01@student.edu', name: '李明宇', password: 'Test123!',
    profile: { studentId: '20210101001', phone: '13811001001', college: '计算机学院', major: '计算机科学与技术', grade: '大二', experience: '参加过校内ACM训练赛，熟悉C++和Python，自学过Vue.js基础', motivation: '希望在技术协会找到志同道合的伙伴，共同提升编程能力，参与真实项目开发' }
  },
  {
    email: 'candidate02@student.edu', name: '赵思琪', password: 'Test123!',
    profile: { studentId: '20210102002', phone: '13811001002', college: '软件学院', major: '软件工程', grade: '大二', experience: '独立开发过个人博客系统，熟悉React和Node.js，参与过一次校外黑客马拉松', motivation: '想通过协会认识更多技术大佬，提升自己的全栈开发能力，为毕业后的工作做准备' }
  },
  {
    email: 'candidate03@student.edu', name: '孙浩然', password: 'Test123!',
    profile: { studentId: '20210103003', phone: '13811001003', college: '自动化学院', major: '自动化', grade: '大二', experience: '参加过电子设计竞赛，了解嵌入式开发，有STM32开发经验，对机器人感兴趣', motivation: '对机器人技术充满热情，希望在实验室中学习更系统的机器人开发知识并参与竞赛' }
  },
  {
    email: 'candidate04@student.edu', name: '周雨桐', password: 'Test123!',
    profile: { studentId: '20210104004', phone: '13811001004', college: '机械工程学院', major: '机械设计制造', grade: '大三', experience: '熟悉SolidWorks机械建模，参与过院级机械创新设计大赛，获得二等奖', motivation: '希望将机械设计与电子控制结合，在机器人实验室中实现跨学科融合' }
  },
  {
    email: 'candidate05@student.edu', name: '吴子涵', password: 'Test123!',
    profile: { studentId: '20210105005', phone: '13811001005', college: '经济管理学院', major: '工商管理', grade: '大二', experience: '曾在校创业中心参加过商业计划书培训，对互联网创业和商业模式设计有浓厚兴趣', motivation: '想找到技术合伙人，将自己的商业创意转化为实际项目，在创业孵化社获得更多资源' }
  },
  {
    email: 'candidate06@student.edu', name: '郑思远', password: 'Test123!',
    profile: { studentId: '20210106006', phone: '13811001006', college: '经济管理学院', major: '市场营销', grade: '大三', experience: '运营过校内公众号，积累了一定的内容创作和用户运营经验，擅长数据分析', motivation: '希望在创业孵化社学习从0到1搭建产品的完整方法论，认识创业方向的优秀同学' }
  },
  {
    email: 'candidate07@student.edu', name: '陈晓雯', password: 'Test123!',
    profile: { studentId: '20210107007', phone: '13811001007', college: '艺术设计学院', major: '视觉传达设计', grade: '大二', experience: '熟练使用Lightroom、Photoshop，有人像、风光、纪实摄影基础，作品曾发表于校刊', motivation: '希望在摄影社接触更多摄影风格，向前辈学习后期技术，同时记录校园美好瞬间' }
  },
  {
    email: 'candidate08@student.edu', name: '林嘉豪', password: 'Test123!',
    profile: { studentId: '20210108008', phone: '13811001008', college: '新闻传播学院', major: '新闻学', grade: '大三', experience: '有3年视频剪辑经验，熟练使用Premiere和After Effects，独立制作过10+支短视频', motivation: '想在摄影社结合专业所学，参与校园活动的影像记录与宣传片制作工作' }
  },
  {
    email: 'candidate09@student.edu', name: '黄子轩', password: 'Test123!',
    profile: { studentId: '20210109009', phone: '13811001009', college: '计算机学院', major: '人工智能', grade: '大一', experience: '无相关经验，但对编程有强烈兴趣，正在自学Python和机器学习基础', motivation: '大一入学就听说了技术协会，希望通过加入协会找到学习方向，快速成长' }
  },
  {
    email: 'candidate10@student.edu', name: '许静怡', password: 'Test123!',
    profile: { studentId: '20210110010', phone: '13811001010', college: '软件学院', major: '数字媒体技术', grade: '大二', experience: '曾参加学院的UI/UX设计工作坊，了解用户体验设计，对前端开发有一定基础', motivation: '希望在技术协会中将设计思维与技术能力相结合，做出更好的产品' }
  },
];

// 系统设置
const systemSettingsData = [
  { settingKey: 'system_name', settingValue: '高校社团智能招新系统', settingType: 'string', description: '系统名称', isPublic: true },
  { settingKey: 'system_version', settingValue: '1.0.0', settingType: 'string', description: '系统版本号', isPublic: true },
  { settingKey: 'max_applications_per_user', settingValue: '3', settingType: 'number', description: '每个用户最多可提交的申请数量', isPublic: true },
  { settingKey: 'allow_registration', settingValue: 'true', settingType: 'boolean', description: '是否开放用户注册', isPublic: true },
  { settingKey: 'email_notification_enabled', settingValue: 'false', settingType: 'boolean', description: '是否开启邮件通知功能', isPublic: false },
  { settingKey: 'file_max_size_mb', settingValue: '10', settingType: 'number', description: '文件上传最大限制（MB）', isPublic: true },
  { settingKey: 'maintenance_mode', settingValue: 'false', settingType: 'boolean', description: '维护模式开关，开启后普通用户无法登录', isPublic: false },
  { settingKey: 'contact_email', settingValue: 'support@university.edu', settingType: 'string', description: '系统联系邮箱', isPublic: true },
];

// ==================== 主函数 ====================

async function main() {
  console.log('🌱 开始执行数据库种子脚本...\n');

  // ---------- 清理旧数据 ----------
  console.log('🗑️  清理旧数据...');
  await prisma.interviewFeedback.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.application.deleteMany();
  await prisma.recruitmentBatch.deleteMany();
  await prisma.userProfileField.deleteMany();
  await prisma.file.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.registrationField.deleteMany();
  await prisma.club.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.notification.deleteMany();
  console.log('   ✓ 旧数据清理完成\n');

  // ---------- 角色 ----------
  console.log('👥 创建角色...');
  const createdRoles = await Promise.all(
    initialRoles.map(roleData =>
      prisma.role.upsert({ where: { code: roleData.code }, update: roleData, create: roleData })
    )
  );
  const roleMap = Object.fromEntries(createdRoles.map(r => [r.code, r]));
  console.log(`   ✓ 角色: ${createdRoles.map(r => r.name).join('、')}\n`);

  // ---------- 权限 ----------
  console.log('🔐 创建权限...');
  const createdPermissions = await Promise.all(
    initialPermissions.map(permData =>
      prisma.permission.upsert({ where: { code: permData.code }, update: permData, create: permData })
    )
  );
  const permMap = Object.fromEntries(createdPermissions.map(p => [p.code, p]));
  console.log(`   ✓ 共 ${createdPermissions.length} 项权限\n`);

  // ---------- 角色权限关联 ----------
  console.log('🔗 绑定角色权限...');
  for (const [roleCode, permCodes] of Object.entries(rolePermissionsMap)) {
    const role = roleMap[roleCode];
    if (!role) continue;
    for (const permCode of permCodes) {
      const perm = permMap[permCode];
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }
  console.log('   ✓ 角色权限关联完成\n');

  // ---------- 注册字段配置 ----------
  console.log('📋 创建注册字段配置...');
  const createdFields = await Promise.all(
    initialRegistrationFields.map(f => prisma.registrationField.create({ data: f }))
  );
  const fieldMap = Object.fromEntries(createdFields.map(f => [f.fieldName, f]));
  console.log(`   ✓ 字段: ${createdFields.map(f => f.fieldLabel).join('、')}\n`);

  // ---------- 系统设置 ----------
  console.log('⚙️  创建系统设置...');
  await Promise.all(
    systemSettingsData.map(s => prisma.systemSetting.create({ data: s }))
  );
  console.log(`   ✓ 共 ${systemSettingsData.length} 项设置\n`);

  // ---------- 超级管理员 ----------
  console.log('👤 创建超级管理员...');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'root@recruitment.com' },
    update: {},
    create: {
      email: 'root@recruitment.com',
      passwordHash: await bcrypt.hash('Root123!', 10),
      name: '系统管理员',
      roleId: roleMap['super_admin'].id,
      status: 'active',
      emailVerified: true,
    },
  });
  console.log(`   ✓ ${superAdmin.name} <${superAdmin.email}>  密码: Root123!\n`);

  // ---------- 社团 ----------
  console.log('🏫 创建社团...');
  const createdClubs = await Promise.all(
    clubsData.map(c => prisma.club.create({ data: c }))
  );
  createdClubs.forEach(c => console.log(`   ✓ ${c.name}（${c.category}）`));
  console.log();

  // ---------- 社团管理员 ----------
  console.log('🧑‍💼 创建社团管理员...');
  const createdClubAdmins = await Promise.all(
    clubAdminsData.map(async (admin, i) => {
      const user = await prisma.user.create({
        data: {
          email: admin.email,
          passwordHash: await bcrypt.hash(admin.password, 10),
          name: admin.name,
          roleId: roleMap['club_admin'].id,
          clubId: createdClubs[i].id,
          status: 'active',
          emailVerified: true,
        },
      });
      console.log(`   ✓ ${user.name} <${user.email}> → ${createdClubs[i].name}  密码: ${admin.password}`);
      return user;
    })
  );
  console.log();

  // 建立 club.admins 关联
  await Promise.all(
    createdClubAdmins.map((admin, i) =>
      prisma.club.update({
        where: { id: createdClubs[i].id },
        data: { admins: { connect: { id: admin.id } } },
      })
    )
  );

  // ---------- 候选人 ----------
  console.log('🎓 创建候选人...');
  const createdCandidates = await Promise.all(
    candidatesData.map(async (c) => {
      const user = await prisma.user.create({
        data: {
          email: c.email,
          passwordHash: await bcrypt.hash(c.password, 10),
          name: c.name,
          roleId: roleMap['candidate'].id,
          status: 'active',
          emailVerified: true,
        },
      });

      // 写入动态档案字段
      for (const [fieldName, fieldValue] of Object.entries(c.profile)) {
        const field = fieldMap[fieldName];
        if (field && fieldValue) {
          await prisma.userProfileField.create({
            data: { userId: user.id, fieldId: field.id, fieldValue },
          });
        }
      }

      console.log(`   ✓ ${user.name} <${user.email}>`);
      return user;
    })
  );
  console.log();

  // ---------- 招新批次 ----------
  console.log('📢 创建招新批次...');
  const now = new Date();
  const d = (offsetDays) => new Date(now.getTime() + offsetDays * 86400000);

  const recruitmentsData = [
    // 技术协会 —— 已结束批次（有完整流程数据）
    {
      title: '计算机技术协会 2024 秋季招新',
      description: '面向全校招募热爱编程的同学，设有算法竞赛组、Web开发组、AI研究组三个方向，欢迎大一大二同学踊跃报名。',
      clubIndex: 0,
      adminIndex: 0,
      startTime: d(-60), endTime: d(-30),
      status: 'finished',
      maxApplicants: 30,
      requiredFields: ['studentId', 'phone', 'college', 'major', 'grade', 'experience', 'motivation'],
      customQuestions: [
        { question: '请介绍一个你完成过的技术项目', type: 'textarea', required: true },
        { question: '你最擅长的编程语言是什么？', type: 'text', required: true },
      ],
    },
    // 技术协会 —— 进行中批次
    {
      title: '计算机技术协会 2025 春季招新',
      description: '春季小规模补充招募，主要面向有一定技术基础的同学，优先考虑算法方向和全栈开发方向。',
      clubIndex: 0,
      adminIndex: 0,
      startTime: d(-5), endTime: d(20),
      status: 'ongoing',
      maxApplicants: 10,
      requiredFields: ['studentId', 'phone', 'college', 'major', 'grade', 'experience', 'motivation'],
      customQuestions: [
        { question: '描述一次你解决技术难题的经历', type: 'textarea', required: true },
      ],
    },
    // 机器人实验室 —— 进行中
    {
      title: '机器人工程实验室 2025 年度招新',
      description: '诚邀对机器人、嵌入式系统、视觉识别感兴趣的同学加入，将参加 RoboMaster 2025 等国家级赛事。',
      clubIndex: 1,
      adminIndex: 1,
      startTime: d(-3), endTime: d(25),
      status: 'ongoing',
      maxApplicants: 15,
      requiredFields: ['studentId', 'phone', 'college', 'major', 'grade', 'experience', 'motivation'],
      customQuestions: [
        { question: '你了解哪些机器人相关技术栈（如ROS、OpenCV、STM32等）？', type: 'textarea', required: true },
        { question: '你每周可以投入多少时间在实验室？', type: 'text', required: true },
      ],
    },
    // 创业孵化社 —— 即将开始
    {
      title: '创业孵化社 2025 春季纳新',
      description: '寻找有商业洞察力和执行力的同学，不限专业，有想法、敢实践的你就是我们要找的人！',
      clubIndex: 2,
      adminIndex: 2,
      startTime: d(3), endTime: d(30),
      status: 'published',
      maxApplicants: 20,
      requiredFields: ['studentId', 'phone', 'college', 'major', 'grade', 'motivation'],
      customQuestions: [
        { question: '你有什么创业想法？请简要描述', type: 'textarea', required: false },
        { question: '你希望在创业社中担任什么角色？（技术/运营/产品/市场）', type: 'text', required: true },
      ],
    },
    // 摄影社 —— 草稿
    {
      title: '摄影与视觉艺术社 2025 招新',
      description: '不论你是摄影新手还是有经验的创作者，只要热爱影像艺术，都欢迎来和我们一起用镜头记录世界。',
      clubIndex: 3,
      adminIndex: 3,
      startTime: d(7), endTime: d(35),
      status: 'draft',
      maxApplicants: 25,
      requiredFields: ['studentId', 'phone', 'college', 'major', 'grade', 'experience', 'motivation'],
      customQuestions: [
        { question: '请分享一张你最满意的摄影作品链接或描述', type: 'textarea', required: false },
      ],
    },
  ];

  const createdRecruitments = await Promise.all(
    recruitmentsData.map(async (r) => {
      const rec = await prisma.recruitmentBatch.create({
        data: {
          title: r.title,
          description: r.description,
          clubId: createdClubs[r.clubIndex].id,
          adminId: createdClubAdmins[r.adminIndex].id,
          startTime: r.startTime,
          endTime: r.endTime,
          status: r.status,
          maxApplicants: r.maxApplicants,
          requiredFields: r.requiredFields,
          customQuestions: r.customQuestions,
        },
      });
      console.log(`   ✓ [${r.status.padEnd(9)}] ${rec.title}`);
      return rec;
    })
  );
  console.log();

  // ---------- 申请记录 ----------
  console.log('📝 创建申请记录...');

  // 秋季已结束批次的申请（覆盖所有关键状态）
  const finishedRecruitment = createdRecruitments[0]; // 技术协会秋季
  const ongoingTechRecruitment = createdRecruitments[1]; // 技术协会春季
  const ongoingRobotRecruitment = createdRecruitments[2]; // 机器人实验室

  const applicationScenarios = [
    // ---- 已结束批次：技术协会秋季 ----
    {
      recruitment: finishedRecruitment,
      applicant: createdCandidates[0], // 李明宇
      status: 'accepted',
      resumeText: '本人计算机科学与技术大二学生，熟悉C++/Python，参加过校内ACM训练赛，自学Vue.js，希望在Web开发组深入学习全栈技术。',
      education: { school: '某大学', college: '计算机学院', major: '计算机科学与技术', grade: '大二' },
      skills: { languages: ['C++', 'Python', 'JavaScript'], frameworks: ['Vue.js'], tools: ['Git', 'VSCode'] },
      experiences: [{ type: '竞赛', name: '校内ACM训练赛', result: '参与奖', year: 2024 }],
    },
    {
      recruitment: finishedRecruitment,
      applicant: createdCandidates[1], // 赵思琪
      status: 'accepted',
      resumeText: '软件工程专业，独立开发过个人博客系统，熟悉React和Node.js，参与过黑客马拉松，有完整的项目开发经验。',
      education: { school: '某大学', college: '软件学院', major: '软件工程', grade: '大二' },
      skills: { languages: ['JavaScript', 'TypeScript', 'Python'], frameworks: ['React', 'Node.js', 'Express'], tools: ['Git', 'Docker', 'MySQL'] },
      experiences: [{ type: '项目', name: '个人博客系统', role: '独立开发', year: 2024 }, { type: '竞赛', name: '校外黑客马拉松', result: '优秀奖', year: 2024 }],
    },
    {
      recruitment: finishedRecruitment,
      applicant: createdCandidates[8], // 黄子轩
      status: 'rejected',
      resumeText: '大一新生，对编程充满热情，正在自学Python和机器学习，暂无项目经验，但学习能力强。',
      education: { school: '某大学', college: '计算机学院', major: '人工智能', grade: '大一' },
      skills: { languages: ['Python'], frameworks: [], tools: ['Jupyter Notebook'] },
      experiences: [],
    },
    {
      recruitment: finishedRecruitment,
      applicant: createdCandidates[9], // 许静怡
      status: 'offer_sent',
      resumeText: '数字媒体技术专业，具备UI/UX设计经验，了解前端开发，希望在技术协会将设计与技术相结合。',
      education: { school: '某大学', college: '软件学院', major: '数字媒体技术', grade: '大二' },
      skills: { languages: ['HTML', 'CSS', 'JavaScript'], frameworks: ['Vue.js'], tools: ['Figma', 'Sketch', 'Git'] },
      experiences: [{ type: '培训', name: 'UI/UX设计工作坊', year: 2024 }],
    },

    // ---- 进行中批次：技术协会春季 ----
    {
      recruitment: ongoingTechRecruitment,
      applicant: createdCandidates[2], // 孙浩然（申请技术协会）
      status: 'screening',
      resumeText: '自动化专业，参加过电子设计竞赛，有嵌入式开发基础，希望在技术协会学习软件开发技能，实现软硬件结合。',
      education: { school: '某大学', college: '自动化学院', major: '自动化', grade: '大二' },
      skills: { languages: ['C', 'Python'], frameworks: [], tools: ['Keil', 'STM32CubeMX'] },
      experiences: [{ type: '竞赛', name: '院级电子设计竞赛', result: '三等奖', year: 2024 }],
    },
    {
      recruitment: ongoingTechRecruitment,
      applicant: createdCandidates[5], // 郑思远
      status: 'submitted',
      resumeText: '市场营销专业，运营过校内公众号，擅长数据分析，希望在技术协会学习技术并参与产品运营相关工作。',
      education: { school: '某大学', college: '经济管理学院', major: '市场营销', grade: '大三' },
      skills: { languages: [], frameworks: [], tools: ['Excel', 'Python数据分析', '微信公众号运营'] },
      experiences: [{ type: '运营', name: '校内公众号', followers: 2000, year: 2023 }],
    },

    // ---- 进行中批次：机器人实验室 ----
    {
      recruitment: ongoingRobotRecruitment,
      applicant: createdCandidates[2], // 孙浩然（同时申请机器人）
      status: 'interview_scheduled',
      resumeText: '自动化专业大二学生，有STM32嵌入式开发经验，参加过电子设计竞赛，对机器人运动控制方向非常感兴趣。',
      education: { school: '某大学', college: '自动化学院', major: '自动化', grade: '大二' },
      skills: { languages: ['C', 'C++', 'Python'], frameworks: ['ROS基础'], tools: ['Keil', 'OpenCV入门', 'Git'] },
      experiences: [{ type: '竞赛', name: '院级电子设计竞赛', result: '三等奖', year: 2024 }],
    },
    {
      recruitment: ongoingRobotRecruitment,
      applicant: createdCandidates[3], // 周雨桐
      status: 'passed',
      resumeText: '机械设计制造专业大三，熟悉SolidWorks建模，获院级机械创新大赛二等奖，希望结合机械设计与电控技术。',
      education: { school: '某大学', college: '机械工程学院', major: '机械设计制造', grade: '大三' },
      skills: { languages: ['C语言基础'], frameworks: [], tools: ['SolidWorks', 'AutoCAD', 'MATLAB'] },
      experiences: [{ type: '竞赛', name: '院级机械创新设计大赛', result: '二等奖', year: 2024 }],
    },
  ];

  const createdApplications = [];
  for (const scenario of applicationScenarios) {
    const app = await prisma.application.create({
      data: {
        recruitmentId: scenario.recruitment.id,
        applicantId: scenario.applicant.id,
        status: scenario.status,
        resumeText: scenario.resumeText,
        education: scenario.education,
        skills: scenario.skills,
        experiences: scenario.experiences,
        aiScore: ['accepted', 'passed', 'offer_sent', 'interview_scheduled'].includes(scenario.status)
          ? (Math.random() * 30 + 70).toFixed(1)  // 70~100
          : (Math.random() * 40 + 40).toFixed(1), // 40~80
        aiAnalysis: {
          summary: `${scenario.applicant.name}的申请综合评分已完成`,
          strengths: ['有相关背景', '动机明确'],
          suggestions: ['可进一步了解具体项目经验'],
        },
      },
    });
    createdApplications.push({ app, scenario });
    console.log(`   ✓ ${scenario.applicant.name} → ${scenario.recruitment.title.substring(0, 15)}...  [${scenario.status}]`);
  }
  console.log();

  // ---------- 面试安排 ----------
  console.log('🗓️  创建面试安排...');

  // 为 interview_scheduled 和 accepted/offer_sent 状态的申请创建面试
  const interviewTargets = createdApplications.filter(({ scenario }) =>
    ['interview_scheduled', 'accepted', 'offer_sent', 'passed'].includes(scenario.status)
  );

  const createdInterviews = [];
  for (const { app, scenario } of interviewTargets) {
    const isCompleted = ['accepted', 'offer_sent', 'passed'].includes(scenario.status);
    const interview = await prisma.interview.create({
      data: {
        applicationId: app.id,
        scheduledTime: isCompleted ? d(-10) : d(5),
        duration: 45,
        location: isCompleted ? '实验楼A206' : '线上腾讯会议',
        meetingLink: isCompleted ? null : 'https://meeting.tencent.com/dm/xxxxxxxxxxx',
        status: isCompleted ? 'completed' : 'scheduled',
        questions: [
          { question: '请自我介绍，重点介绍你的技术背景', type: 'open' },
          { question: '描述一个你做过的项目，遇到了什么挑战，如何解决的', type: 'open' },
          { question: '为什么想加入我们社团？加入后希望做什么贡献', type: 'open' },
        ],
      },
    });
    createdInterviews.push({ interview, app, scenario, isCompleted });
    console.log(`   ✓ ${scenario.applicant.name} 的面试  [${interview.status}]  ${isCompleted ? '已结束' : '待进行'}`);
  }
  console.log();

  // ---------- 面试反馈 ----------
  console.log('💬 创建面试反馈...');
  const completedInterviews = createdInterviews.filter(({ isCompleted }) => isCompleted);

  for (const { interview, scenario } of completedInterviews) {
    const isAccepted = ['accepted', 'offer_sent'].includes(scenario.status);
    await prisma.interviewFeedback.create({
      data: {
        interviewId: interview.id,
        interviewerId: createdClubAdmins[scenario.recruitment.clubId ? 0 : 0].id,
        technicalScore: isAccepted ? (Math.random() * 10 + 85).toFixed(1) : (Math.random() * 20 + 60).toFixed(1),
        communicationScore: isAccepted ? (Math.random() * 10 + 80).toFixed(1) : (Math.random() * 20 + 55).toFixed(1),
        overallScore: isAccepted ? (Math.random() * 10 + 83).toFixed(1) : (Math.random() * 20 + 58).toFixed(1),
        recommendation: isAccepted ? 'strongly_recommend' : 'pending',
        notes: isAccepted
          ? `${scenario.applicant.name}表现优秀，技术基础扎实，沟通能力强，主动性好，建议录用。`
          : `${scenario.applicant.name}基础尚可，但项目经验稍显不足，建议观察后再定。`,
      },
    });
    console.log(`   ✓ ${scenario.applicant.name} 的面试反馈  推荐: ${isAccepted ? '强烈推荐' : '待定'}`);
  }
  console.log();

  // ---------- 通知 ----------
  console.log('🔔 创建通知...');
  const notifications = [
    { userId: createdCandidates[0].id, type: 'offer_sent', title: '恭喜你通过了招新！', content: '你已成功通过计算机技术协会 2024 秋季招新，欢迎加入！请于 3 日内确认入选结果。', read: true },
    { userId: createdCandidates[1].id, type: 'offer_sent', title: '恭喜你通过了招新！', content: '你已成功通过计算机技术协会 2024 秋季招新，欢迎加入！请于 3 日内确认入选结果。', read: false },
    { userId: createdCandidates[8].id, type: 'rejection', title: '很遗憾，本次招新未能通过', content: '感谢你报名计算机技术协会 2024 秋季招新。经过综合评估，本次遗憾未能录用，期待你下次再来！', read: true },
    { userId: createdCandidates[2].id, type: 'interview_invitation', title: '面试邀请通知', content: '你的机器人工程实验室申请已进入面试阶段，面试时间为本周五下午 3 点，请提前登录系统确认。', read: false },
    { userId: createdCandidates[3].id, type: 'status_update', title: '申请状态更新', content: '你申请机器人工程实验室的状态已更新为"初审通过"，请耐心等待面试通知。', read: false },
  ];

  await Promise.all(notifications.map(n => prisma.notification.create({ data: n })));
  console.log(`   ✓ 共 ${notifications.length} 条通知\n`);

  // ---------- 完成 ----------
  console.log('='.repeat(60));
  console.log('✅ 种子数据初始化完成！\n');
  console.log('📋 账号速查表：');
  console.log('   超级管理员:  root@recruitment.com        / Root123!');
  clubAdminsData.forEach((a, i) => {
    console.log(`   社团管理员:  ${a.email.padEnd(36)} / ${a.password}  →  ${createdClubs[i].name}`);
  });
  candidatesData.slice(0, 3).forEach(c => {
    console.log(`   候选人:      ${c.email.padEnd(36)} / ${c.password}`);
  });
  console.log('   ... 以及更多候选人账号，密码均为 Test123!');
  console.log('='.repeat(60));
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.error('\n❌ 种子脚本执行失败:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
