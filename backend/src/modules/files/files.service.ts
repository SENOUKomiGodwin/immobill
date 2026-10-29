import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestWithOwnerFilter } from '../../common/types/express.d';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.configService.get('MINIO_PORT') || '9000'),
      useSSL: this.configService.get('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get('MINIO_SECRET_KEY') || 'minioadmin',
    });
    this.bucketName = this.configService.get('MINIO_BUCKET') || 'immobill-files';
  }

  private async ensureBucket() {
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    relatedEntityType?: string,
    relatedEntityId?: string,
  ) {
    await this.ensureBucket();

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Le fichier ne doit pas dépasser 5 Mo');
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Types autorisés: PDF, JPG, PNG');
    }

    // Generate unique file key
    const fileKey = `${userId}/${uuidv4()}-${file.originalname}`;

    // Upload to MinIO
    await this.minioClient.putObject(
      this.bucketName,
      fileKey,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    // Save file metadata in database
    const fileMetadata = await this.prisma.$transaction(async (tx) => {
      // Check if related entity exists and belongs to user
      if (relatedEntityType && relatedEntityId) {
        let entityExists = false;
        switch (relatedEntityType) {
          case 'Expense':
            entityExists = !!(await tx.expense.findFirst({
              where: { id: relatedEntityId, created_by_id: userId },
            }));
            break;
          case 'Tenant':
            entityExists = !!(await tx.tenant.findFirst({
              where: { id: relatedEntityId, created_by_id: userId },
            }));
            break;
          // Add more entity types as needed
        }
        if (!entityExists) {
          throw new NotFoundException('Entité liée non trouvée');
        }
      }

      // Save file metadata
      const fileRecord = await tx.file.create({
        data: {
          file_key: fileKey,
          filename: file.originalname,
          content_type: file.mimetype,
          size: file.size,
          bucket: this.bucketName,
          related_entity_type: relatedEntityType,
          related_entity_id: relatedEntityId,
          created_by_id: userId,
        },
      });

      return {
        id: fileRecord.id,
        file_key: fileRecord.file_key,
        filename: fileRecord.filename,
        content_type: fileRecord.content_type,
        size: fileRecord.size,
        bucket: fileRecord.bucket,
      };
    });

    return fileMetadata;
  }

  async getSignedUrl(fileKey: string, expiresIn: number = 3600, request: RequestWithOwnerFilter) {
    await this.ensureBucket();

    // Verify file belongs to user (check prefix)
    const ownerFilter = request.ownerFilter || {};
    const userId = (request.currentUser as { id: string })?.id;

    if (!fileKey.startsWith(`${userId}/`)) {
      throw new NotFoundException('Fichier non trouvé');
    }

    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        fileKey,
        expiresIn,
      );
      return { url, expires_in: expiresIn };
    } catch (error) {
      throw new NotFoundException('Fichier non trouvé');
    }
  }

  async deleteFile(fileKey: string, request: RequestWithOwnerFilter) {
    await this.ensureBucket();

    // Verify file belongs to user
    const userId = (request.currentUser as { id: string })?.id;
    if (!fileKey.startsWith(`${userId}/`)) {
      throw new NotFoundException('Fichier non trouvé');
    }

    try {
      await this.minioClient.removeObject(this.bucketName, fileKey);
      return { message: 'Fichier supprimé' };
    } catch (error) {
      throw new NotFoundException('Fichier non trouvé');
    }
  }

  // Adapter method for Base44 compatibility (simplified - no MinIO for now)
  async upload(body: { file_name: string; content_type: string; size: number; file_key: string }, request: RequestWithOwnerFilter) {
    const userId = (request.currentUser as { id: string })?.id;

    // Save file metadata in database (simplified - no actual file storage)
    const fileRecord = await this.prisma.file.create({
      data: {
        file_key: body.file_key,
        filename: body.file_name,
        content_type: body.content_type,
        size: body.size,
        bucket: 'local',
        created_by_id: userId,
      },
    });

    return {
      file_uri: fileRecord.file_key,
      id: fileRecord.id,
    };
  }

  // Adapter method for Base44 compatibility (simplified - no MinIO for now)
  async createSignedUrl(body: { file_uri: string; expires_in: number }, request: RequestWithOwnerFilter) {
    const userId = (request.currentUser as { id: string })?.id;

    // For now, return a placeholder URL
    // In production, this would generate a real signed URL from MinIO or S3
    return {
      signed_url: `https://placeholder-storage.example.com/${body.file_uri}`,
    };
  }
}
