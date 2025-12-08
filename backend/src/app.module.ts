import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
//import { AppController } from './app.controller';
//import { AppService } from './app.service';
import { CodeReviewModule } from './code-review/code-review.module';
import { CodeReview } from './code-review/entities/code-review.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [CodeReview],
      synchronize: true,
    }),
    CodeReviewModule,
  ],
  //controllers: [AppController],
  //providers: [AppService],
})
export class AppModule {}
