import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CodeReviewService } from './code-review.service';
import { CreateCodeReviewDto } from './dto/create-code-review.dto';

@Controller('api/v1/code-reviews')
export class CodeReviewController {
  constructor(private readonly service: CodeReviewService) {}

  @Post()
  create(@Body() dto: CreateCodeReviewDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const lim = limit
      ? Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50)
      : undefined; // 1..50
    const off = offset ? Math.max(parseInt(offset, 10) || 0, 0) : undefined; // >=0
    return this.service.findAll({ limit: lim, offset: off });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }
}
