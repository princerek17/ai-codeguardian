import { IsIn, IsString, MinLength } from 'class-validator';

export const SUPPORTED_LANGUAGES = [
  'auto',

  'python',
  'javascript',
  'typescript',

  'java',
  'c',
  'cpp',
  'csharp',

  'go',
  'rust',

  'php',
  'ruby',

  'swift',
  'kotlin',
  'dart',

  'sql',
  'html',
  'css',

  'bash',
  'powershell',

  'yaml',
  'json',
] as const;

export class CreateCodeReviewDto {
  @IsIn(SUPPORTED_LANGUAGES)
  language: (typeof SUPPORTED_LANGUAGES)[number];

  @IsString()
  reviewType: string;

  @IsString()
  @MinLength(1)
  code: string;
}
