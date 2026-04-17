"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
const argon2 = require("argon2");
const auth_service_1 = require("../../src/modules/auth/auth.service");
const user_schema_1 = require("../../src/database/schemas/user.schema");
const refresh_token_schema_1 = require("../../src/database/schemas/refresh-token.schema");
describe('AuthService', () => {
    let service;
    let userModelMock;
    let refreshTokenModelMock;
    let jwtServiceMock;
    beforeEach(async () => {
        userModelMock = {
            findOne: jest.fn(),
            findByIdAndUpdate: jest.fn(),
        };
        refreshTokenModelMock = {
            create: jest.fn(),
            findOne: jest.fn(),
            updateOne: jest.fn(),
        };
        jwtServiceMock = {
            signAsync: jest.fn().mockResolvedValue('fake-jwt-token'),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: (0, mongoose_1.getModelToken)(user_schema_1.User.name), useValue: userModelMock },
                { provide: (0, mongoose_1.getModelToken)(refresh_token_schema_1.RefreshToken.name), useValue: refreshTokenModelMock },
                { provide: jwt_1.JwtService, useValue: jwtServiceMock },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
    });
    describe('login', () => {
        it('should throw UnauthorizedException if user not found', async () => {
            userModelMock.findOne.mockReturnValue({ lean: () => null });
            await expect(service.login('a@b.com', 'pass123')).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should throw UnauthorizedException if password wrong', async () => {
            const hash = await argon2.hash('correctpass');
            userModelMock.findOne.mockReturnValue({ lean: () => ({ _id: 'uid', email: 'a@b.com', password_hash: hash, role: 'blind_user' }) });
            await expect(service.login('a@b.com', 'wrongpass')).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should return tokens on valid login', async () => {
            const hash = await argon2.hash('correctpass');
            userModelMock.findOne.mockReturnValue({ lean: () => ({ _id: 'uid123', email: 'a@b.com', password_hash: hash, role: 'blind_user', full_name: 'Test' }) });
            userModelMock.findByIdAndUpdate = jest.fn();
            refreshTokenModelMock.create.mockResolvedValue({});
            const result = await service.login('a@b.com', 'correctpass');
            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('refresh_token');
            expect(result.user.email).toBe('a@b.com');
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map