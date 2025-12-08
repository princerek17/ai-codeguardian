import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCodeReviewDto } from './dto/create-code-review.dto';
import { CodeReview } from './entities/code-review.entity';

@Injectable()
export class CodeReviewService {
  constructor(
    @InjectRepository(CodeReview)
    private readonly repo: Repository<CodeReview>,
  ) {}

  async create(dto: CreateCodeReviewDto) {
    const summary = 'Demo summary (AI not integrated yet) :(';
    const issues = [
      {
        type: 'Style',
        line: 1,
        severity: 'low',
        message: 'Use a clearer function name.',
      },
    ];
    const suggestedCode = dto.code;

    const review = this.repo.create({
      language: dto.language,
      reviewType: dto.reviewType,
      originalCode: dto.code,
      summary,
      issues,
      suggestedCode,
    });

    return this.repo.save(review);
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const review = await this.repo.findOneBy({ id });
    if (!review) throw new NotFoundException('Code review not found');
    return review;
  }
}
