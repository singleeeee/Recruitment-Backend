import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateClubAdminDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string; // 初始密码

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  clubId: string; // 要管理的社团 ID
}