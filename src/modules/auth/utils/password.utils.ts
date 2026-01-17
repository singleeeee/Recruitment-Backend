import * as bcrypt from 'bcrypt';

export class PasswordUtils {
  private static readonly saltRounds = 10;

  /**
   * 对密码进行哈希加密
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(password, salt);
  }

  /**
   * 验证密码是否匹配
   */
  static async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}