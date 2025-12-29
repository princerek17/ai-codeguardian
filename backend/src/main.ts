import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Allow local dev + your Vercel site.
  // Safer: allow all in dev, strict in prod.
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL, // set this in Railway to your Vercel URL
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // allow non-browser clients (like curl/postman) with no origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // ✅ Railway sets PORT dynamically
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
}

void bootstrap();
