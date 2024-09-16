import { NestFactory } from '@nestjs/core';
import { MedullaUsersModule } from './medulla-users.module';

async function bootstrap() {
  const app = await NestFactory.create(MedullaUsersModule);
  await app.listen(3000);
}
bootstrap();
