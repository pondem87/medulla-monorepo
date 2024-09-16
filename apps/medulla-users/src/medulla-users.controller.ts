import { Controller, Get } from '@nestjs/common';
import { MedullaUsersService } from './medulla-users.service';

@Controller()
export class MedullaUsersController {
  constructor(private readonly medullaUsersService: MedullaUsersService) {}

  @Get()
  getHello(): string {
    return this.medullaUsersService.getHello();
  }
}
