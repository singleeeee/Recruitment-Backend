import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    // ---- 添加调试日志 ----
    console.log(`[LocalStrategy DEBUG] Attempting to validate user: Email='${email}', Password='${password ? '[PROVIDED]' : '[NOT PROVIDED]'}'.`);
    // ---------------------
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      console.log(`[LocalStrategy DEBUG] User validation failed for email: ${email}`);
      throw new UnauthorizedException('邮箱或密码错误');
    }
    console.log(`[LocalStrategy DEBUG] User validation successful for email: ${email}`);
    return user;
  }
}