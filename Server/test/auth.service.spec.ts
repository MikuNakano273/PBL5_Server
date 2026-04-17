import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from '../../src/modules/auth/auth.service';
import { User } from '../../src/database/schemas/user.schema';
import { RefreshToken } from '../../src/database/schemas/refresh-token.schema';

describe('AuthService', () => {
  let service: AuthService;
  let userModelMock: any;
  let refreshTokenModelMock: any;
  let jwtServiceMock: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModelMock },
        { provide: getModelToken(RefreshToken.name), useValue: refreshTokenModelMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      userModelMock.findOne.mockReturnValue({ lean: () => null });
      await expect(service.login('a@b.com', 'pass123')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password wrong', async () => {
      const hash = await argon2.hash('correctpass');
      userModelMock.findOne.mockReturnValue({ lean: () => ({ _id: 'uid', email: 'a@b.com', password_hash: hash, role: 'blind_user' }) });
      await expect(service.login('a@b.com', 'wrongpass')).rejects.toThrow(UnauthorizedException);
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
