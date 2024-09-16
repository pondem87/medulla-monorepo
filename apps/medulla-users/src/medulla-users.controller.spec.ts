import { Test, TestingModule } from '@nestjs/testing';
import { MedullaUsersController } from './medulla-users.controller';
import { MedullaUsersService } from './medulla-users.service';

describe('MedullaUsersController', () => {
  let medullaUsersController: MedullaUsersController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MedullaUsersController],
      providers: [MedullaUsersService],
    }).compile();

    medullaUsersController = app.get<MedullaUsersController>(MedullaUsersController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(medullaUsersController.getHello()).toBe('Hello World!');
    });
  });
});
