import { Test, TestingModule } from '@nestjs/testing';
import { CodeReviewController } from './code-review.controller';

describe('CodeReviewController', () => {
  let controller: CodeReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CodeReviewController],
    }).compile();

    controller = module.get<CodeReviewController>(CodeReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
