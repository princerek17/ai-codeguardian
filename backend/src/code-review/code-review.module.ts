import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodeReviewController } from './code-review.controller';
import { CodeReviewService } from './code-review.service';
import { CodeReview } from './entities/code-review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CodeReview])],
  controllers: [CodeReviewController],
  providers: [CodeReviewService],
})
export class CodeReviewModule {}
