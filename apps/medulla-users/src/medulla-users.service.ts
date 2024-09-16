import { Injectable } from '@nestjs/common';

@Injectable()
export class MedullaUsersService {
  getHello(): string {
    return 'Hello World!';
  }
}
