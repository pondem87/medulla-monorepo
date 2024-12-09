import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MedullaAiModule } from '../src/medulla-ai.module';
import { LONG_TEST_TIMEOUT, SHORT_TEST_TIMEOUT } from '@app/medulla-common/common/constants';

describe('MedullaAiController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MedullaAiModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, LONG_TEST_TIMEOUT);

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) Health check', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Server Active!');
  }, SHORT_TEST_TIMEOUT);
});
