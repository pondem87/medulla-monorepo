import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MedullaAiModule } from '../src/medulla-ai.module';

describe('MedullaAiController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MedullaAiModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 10000);

  it('/ (GET) Health check', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Server Active!');
  }, 10000);
});
