import { Module } from '@nestjs/common';
import { MedullaUsersController } from './medulla-users.controller';
import { MedullaUsersService } from './medulla-users.service';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule],
  controllers: [MedullaUsersController],
  providers: [MedullaUsersService],
})
export class MedullaUsersModule {}
