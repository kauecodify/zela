import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    const tokens = await this.authService.generateTokens(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        consortiumId: user.consortiumId,
        clientId: user.clientId
      },
      ...tokens
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const tokens = await this.authService.login(loginDto);
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        consortiumId: user.consortiumId,
        clientId: user.clientId,
        municipalityId: user.municipalityId
      },
      ...tokens
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Request() req: any, @Body() body: { refreshToken: string }) {
    return this.authService.logout(req.user.sub, body.refreshToken);
  }

  @Post('invalidate-sessions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate all user sessions' })
  @ApiResponse({ status: 200, description: 'All sessions invalidated' })
  async invalidateSessions(@Request() req: any) {
    return this.authService.invalidateSessions(req.user.sub);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate current token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  async validate(@Request() req: any) {
    return {
      valid: true,
      user: req.user
    };
  }
}
