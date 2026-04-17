import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client as MinioClient } from 'minio';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: MinioClient;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.MINIO_BUCKET || 'pbl5-images';
    this.client = new MinioClient({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, process.env.MINIO_REGION || 'us-east-1');
        this.logger.log(`Bucket '${this.bucket}' created`);
      }
    } catch (err) {
      this.logger.error('MinIO init failed', err);
    }
  }

  async getPresignedUploadUrl(objectKey: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedPutObject(this.bucket, objectKey, expirySeconds);
  }

  async putObject(objectKey: string, stream: Readable, size?: number): Promise<void> {
    await this.client.putObject(this.bucket, objectKey, stream, size);
  }

  async statObject(objectKey: string) {
    return this.client.statObject(this.bucket, objectKey);
  }

  async getPresignedDownloadUrl(objectKey: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, objectKey, expirySeconds);
  }
}
