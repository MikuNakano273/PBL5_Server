"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const image_requests_service_1 = require("../../src/modules/image-requests/image-requests.service");
const image_request_schema_1 = require("../../src/database/schemas/image-request.schema");
describe('ImageRequestsService', () => {
    let service;
    let imageRequestModelMock;
    let visionQueueMock;
    beforeEach(async () => {
        imageRequestModelMock = {
            create: jest.fn(),
            findById: jest.fn(),
        };
        visionQueueMock = { add: jest.fn() };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                image_requests_service_1.ImageRequestsService,
                { provide: (0, mongoose_1.getModelToken)(image_request_schema_1.ImageRequest.name), useValue: imageRequestModelMock },
                { provide: (0, bullmq_1.getQueueToken)('vision-jobs'), useValue: visionQueueMock },
            ],
        }).compile();
        service = module.get(image_requests_service_1.ImageRequestsService);
    });
    it('should create an image request', async () => {
        imageRequestModelMock.create.mockResolvedValue({ _id: 'req1', request_code: 'REQ-abc' });
        const result = await service.create({
            device_id: '6566f4e4b5b3bc76a1e4000a',
            blind_user_id: '6566f4e4b5b3bc76a1e4000b',
            captured_at: new Date().toISOString(),
        });
        expect(result).toHaveProperty('request_code');
        expect(imageRequestModelMock.create).toHaveBeenCalled();
    });
    it('should be idempotent - not requeue if already done', async () => {
        const mockReq = {
            _id: 'req1',
            status: 'done',
            ai_status: 'done',
            image_path: 'existing-key',
            save: jest.fn(),
        };
        imageRequestModelMock.findById.mockResolvedValue(mockReq);
        await service.attachImage('req1', 'images/test.jpg');
        expect(imageRequestModelMock.findById).toHaveBeenCalled();
    });
});
//# sourceMappingURL=image-requests.service.spec.js.map