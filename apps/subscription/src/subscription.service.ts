import { Injectable } from '@nestjs/common';

@Injectable()
export class SubscriptionService {
  getHello(): string {
    return 'Hello World!';
  }
}
