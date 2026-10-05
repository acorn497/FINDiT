import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode, type Photo as PhotoDto } from '@findit/shared';
import { imageSize } from 'image-size';
import { readFile, unlink } from 'node:fs/promises';
import { Repository } from 'typeorm';
import { AppException } from '../common/app.exception';
import { Photo } from './photo.entity';

export const UPLOAD_URL_PREFIX = '/api/uploads';
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

export const photoUrl = (filePath: string) => `${UPLOAD_URL_PREFIX}/${filePath}`;

@Injectable()
export class UploadsService {
  constructor(@InjectRepository(Photo) private readonly photos: Repository<Photo>) {}

  /** 저장된 파일이 실제 이미지인지 확인하고 photos 레코드를 만든다. 아니면 지우고 415. */
  async register(file: Express.Multer.File): Promise<PhotoDto> {
    let size: { width?: number; height?: number; type?: string };
    try {
      size = imageSize(await readFile(file.path));
    } catch {
      size = {};
    }
    if (!size.width || !size.height || !size.type || !IMAGE_TYPES.includes(size.type)) {
      await unlink(file.path).catch(() => undefined);
      throw new AppException(415, ErrorCode.UNSUPPORTED_MEDIA_TYPE, '이미지 파일만 올릴 수 있습니다');
    }
    const saved = await this.photos.save(
      this.photos.create({ filePath: file.filename, width: size.width, height: size.height, bytes: file.size }),
    );
    return UploadsService.toDto(saved);
  }

  static toDto(p: Photo): PhotoDto {
    return { id: p.id, url: photoUrl(p.filePath), width: p.width, height: p.height };
  }
}
