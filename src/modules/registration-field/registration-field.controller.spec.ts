import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationFieldController } from './registration-field.controller';

describe('RegistrationFieldController', () => {
  let controller: RegistrationFieldController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationFieldController],
    }).compile();

    controller = module.get<RegistrationFieldController>(RegistrationFieldController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
