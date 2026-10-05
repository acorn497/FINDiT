import { Controller, HttpCode, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ErrorCode } from '@findit/shared';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname } from 'node:path';
import { diskStorage } from 'multer';
import { AppException } from '../common/app.exception';
import { config } from '../config';
import { MAX_UPLOAD_BYTES, UploadsService } from './uploads.service';

const EXT: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /** multipart 사진 1장 (필드 이름 file). 5MB 초과 413, 이미지가 아니면 415 */
  @Post()
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(config.uploadDir, { recursive: true });
          cb(null, config.uploadDir);
        },
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${EXT[file.mimetype] ?? extname(file.originalname)}`),
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new AppException(415, ErrorCode.UNSUPPORTED_MEDIA_TYPE, '이미지 파일만 올릴 수 있습니다'), false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new AppException(400, ErrorCode.VALIDATION_FAILED, '사진 파일을 첨부해 주세요');
    return this.uploads.register(file);
  }
}
