import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationFieldService } from './registration-field.service';

describe('RegistrationFieldService', () => {
  let service: RegistrationFieldService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegistrationFieldService],
    }).compile();

    service = module.get<RegistrationFieldService>(RegistrationFieldService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
