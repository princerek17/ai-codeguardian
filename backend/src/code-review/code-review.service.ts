import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCodeReviewDto } from './dto/create-code-review.dto';
import { CodeReview } from './entities/code-review.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class CodeReviewService {
  constructor(
    @InjectRepository(CodeReview)
    private readonly repo: Repository<CodeReview>,
    private readonly aiService: AiService,
  ) {}

  async create(dto: CreateCodeReviewDto) {
    let summary: string;
    let issues: any[];
    let suggestedCode: string;

    try {
      const ai = await this.aiService.reviewCode({
        language: dto.language,
        reviewType: dto.reviewType,
        code: dto.code,
      });

      summary = ai.summary;
      issues = ai.issues;
      suggestedCode = ai.suggestedCode;
    } catch (err: any) {
      // Fallback (keeps app usable even if AI fails)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      summary = `AI failed, saved without AI. Reason: ${err?.message ?? 'unknown error'}`;
      issues = [];
      suggestedCode = dto.code;
    }

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

  async findAll(p?: { limit?: number; offset?: number }) {
    const take = p?.limit ?? undefined;
    const skip = p?.offset ?? undefined;

    return this.repo.find({
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
  }

  async findOne(id: number) {
    const review = await this.repo.findOneBy({ id });
    if (!review) throw new NotFoundException('Code review not found');
    return review;
  }
}
