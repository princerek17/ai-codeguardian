import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }
}
