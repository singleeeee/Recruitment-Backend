import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { HealthModule } from './health/health.module';
import { FilesModule } from './modules/files/files.module';
import { RegistrationFieldModule } from './modules/registration-field/registration-field.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RecruitmentModule,
    ApplicationsModule,
    FilesModule,
    RegistrationFieldModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
