import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

class LoginDto {
  @IsEmail()
  email!: string;
  @IsString()
  @MinLength(6)
  password!: string;
}

class RefreshDto {
  @IsString()
  refresh_token!: string;
}

@ApiTags('Mobile Auth')
@Controller('mobile/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.authService.revokeRefreshToken(dto.refresh_token);
  }
}
