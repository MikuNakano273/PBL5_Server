"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const minio_1 = require("minio");
let StorageService = StorageService_1 = class StorageService {
    logger = new common_1.Logger(StorageService_1.name);
    client;
    bucket;
    constructor() {
        this.bucket = process.env.MINIO_BUCKET || 'pbl5-images';
        this.client = new minio_1.Client({
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
        }
        catch (err) {
            this.logger.error('MinIO init failed', err);
        }
    }
    async getPresignedUploadUrl(objectKey, expirySeconds = 3600) {
        return this.client.presignedPutObject(this.bucket, objectKey, expirySeconds);
    }
    async putObject(objectKey, stream, size) {
        await this.client.putObject(this.bucket, objectKey, stream, size);
    }
    async statObject(objectKey) {
        return this.client.statObject(this.bucket, objectKey);
    }
    async getPresignedDownloadUrl(objectKey, expirySeconds = 3600) {
        return this.client.presignedGetObject(this.bucket, objectKey, expirySeconds);
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageService);
//# sourceMappingURL=storage.service.js.map