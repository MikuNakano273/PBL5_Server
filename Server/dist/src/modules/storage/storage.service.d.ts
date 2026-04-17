import { OnModuleInit } from '@nestjs/common';
import { Readable } from 'stream';
export declare class StorageService implements OnModuleInit {
    private readonly logger;
    private readonly client;
    private readonly bucket;
    constructor();
    onModuleInit(): Promise<void>;
    getPresignedUploadUrl(objectKey: string, expirySeconds?: number): Promise<string>;
    putObject(objectKey: string, stream: Readable, size?: number): Promise<void>;
    statObject(objectKey: string): Promise<import("minio").BucketItemStat>;
    getPresignedDownloadUrl(objectKey: string, expirySeconds?: number): Promise<string>;
}
