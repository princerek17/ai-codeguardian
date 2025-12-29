import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Always listen on Railway's assigned port (local fallback = 3001)
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;

  // Allowed origins (local + your Vercel URL from env)
  const allowedOrigins = new Set(
    [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL?.trim(), // e.g. https://your-app.vercel.app
    ].filter(Boolean) as string[],
  );

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl/postman) that send no Origin header
      if (!origin) return callback(null, true);

      // Allow exact matches
      if (allowedOrigins.has(origin)) return callback(null, true);

      // Helpful error for debugging
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
