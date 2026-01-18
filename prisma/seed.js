const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const initialRoles = [
  { name: '超级管理员', code: 'system_admin', description: '拥有所有权限，管理其他管理员和系统配置', isActive: true },
  { name: '社团管理员', code: 'club_admin', description: '管理社团的候选人、招新批次、通知等', isActive: true },
  { name: '候选人', code: 'candidate', description: '申请加入社团的用户', isActive: true },
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
  system_admin: ['user_read', 'user_create', 'user_update', 'user_delete', 'role_read', 'role_create', 'role_update', 'role_delete', 'recruitment_read', 'recruitment_create', 'recruitment_update', 'recruitment_delete', 'application_read', 'application_update', 'application_delete', 'file_read', 'file_upload', 'file_download', 'file_delete', 'systemsetting_read', 'systemsetting_manage', 'registrationfield_read', 'registrationfield_manage', 'club_read', 'club_manage'],
  club_admin: ['recruitment_read', 'recruitment_create', 'recruitment_update', 'recruitment_delete', 'application_read', 'application_update', 'application_delete', 'file_read', 'file_upload', 'file_download', 'file_delete'],
  candidate: ['file_upload', 'file_download'],
};

const initialRegistrationFields = [
  { fieldName: 'studentId', fieldLabel: '学号', fieldType: 'text', fieldOrder: 1, isRequired: true, isActive: true, placeholder: '请输入学号' },
  { fieldName: 'phone', fieldLabel: '手机号', fieldType: 'text', fieldOrder: 2, isRequired: true, isActive: true, placeholder: '请输入手机号' },
  { fieldName: 'college', fieldLabel: '学院', fieldType: 'text', fieldOrder: 3, isRequired: true, isActive: true, placeholder: '请输入学院' },
  { fieldName: 'major', fieldLabel: '专业', fieldType: 'text', fieldOrder: 4, isRequired: true, isActive: true, placeholder: '请输入专业' },
  { fieldName: 'grade', fieldLabel: '年级', fieldType: 'select', fieldOrder: 5, isRequired: true, isActive: true, placeholder: '请选择年级', options: JSON.stringify({ options: [ { label: '大一', value: '大一' }, { label: '大二', value: '大二' }, { label: '大三', value: '大三' }, { label: '大四', value: '大四' }, { label: '研一', value: '研一' }, { label: '研二', value: '研二' }, { label: '研三', value: '研三' }, { label: '博士', value: '博士' }, ] }) },
  { fieldName: 'experience', fieldLabel: '相关经验', fieldType: 'textarea', fieldOrder: 6, isRequired: false, isActive: true, placeholder: '请简述您的相关经验（可选）' },
  { fieldName: 'motivation', fieldLabel: '加入动机', fieldType: 'textarea', fieldOrder: 7, isRequired: true, isActive: true, placeholder: '请简述您的加入动机' },
];

async function main() {
  console.log('开始执行数据库种子脚本...');

  await prisma.userProfileField.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.file.deleteMany();
  await prisma.interviewFeedback.deleteMany();
  await prisma.application.deleteMany();
  await prisma.recruitmentBatch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.registrationField.deleteMany();
  await prisma.club.deleteMany();
  await prisma.systemSetting.deleteMany();
  console.log('已清理旧数据。');

  const createdRoles = await Promise.all(
    initialRoles.map(async (roleData) => {
      return prisma.role.upsert({
        where: { code: roleData.code },
        update: roleData,
        create: roleData,
      });
    })
  );
  console.log(`已创建/更新角色: ${createdRoles.map(r => r.code).join(', ')}`);

  const createdPermissions = await Promise.all(
    initialPermissions.map(async (permissionData) => {
      return prisma.permission.upsert({
        where: { code: permissionData.code },
        update: permissionData,
        create: permissionData,
      });
    })
  );
  console.log(`已创建/更新权限: ${createdPermissions.length} 项`);

  for (const roleCode of Object.keys(rolePermissionsMap)) {
    const role = createdRoles.find(r => r.code === roleCode);
    const permissionCodes = rolePermissionsMap[roleCode];

    if (role) {
      for (const permissionCode of permissionCodes) {
        const permission = createdPermissions.find(p => p.code === permissionCode);
        if (permission) {
          await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id, }, },
            update: { roleId: role.id, permissionId: permission.id, },
            create: { roleId: role.id, permissionId: permission.id, },
          });
        }
      }
    }
  }
  console.log('已完成角色与权限关联。');

  const superAdminRole = createdRoles.find(r => r.code === 'super_admin');
  if (!superAdminRole) { throw new Error('超级管理员角色未找到，无法创建默认超级管理员。'); }

  const defaultSuperAdminPwd = 'Root123!';
  const hashedPassword = await bcrypt.hash(defaultSuperAdminPwd, 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'root@recruitment.com' },
    update: { roleId: superAdminRole.id, passwordHash: hashedPassword, name: '超级管理员', status: 'active', emailVerified: true, },
    create: { email: 'root@recruitment.com', passwordHash: hashedPassword, name: '超级管理员', roleId: superAdminRole.id, status: 'active', emailVerified: true, },
  });
  console.log(`已创建/更新超级管理员用户: ${superAdminUser.email}，默认密码: ${defaultSuperAdminPwd}`);

  for (const fieldData of initialRegistrationFields) {
    await prisma.registrationField.create({
      data: fieldData,
    });
  }
  console.log(`已创建/更新初始 RegistrationField: ${initialRegistrationFields.map(f => f.fieldName).join(', ')}`);

  console.log('数据库种子脚本执行完成。');
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.error('种子脚本执行失败:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();