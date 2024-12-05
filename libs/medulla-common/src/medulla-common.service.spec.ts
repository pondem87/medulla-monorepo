import { Test, TestingModule } from '@nestjs/testing';
import { MedullaCommonService } from './medulla-common.service';

describe('MedullaCommonService', () => {
  let service: MedullaCommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedullaCommonService],
    }).compile();

    service = module.get<MedullaCommonService>(MedullaCommonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
