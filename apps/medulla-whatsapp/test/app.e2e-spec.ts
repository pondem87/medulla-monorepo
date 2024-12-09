import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MedullaWhatsappModule } from './../src/medulla-whatsapp.module';

describe('MedullaWhatsappController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MedullaWhatsappModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 15000);

  afterAll(() => {
    process.exit();
  });

  it('/ (GET): Health check', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Server Active!');
  });

});
