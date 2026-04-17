import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalApiGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth: string | undefined = req.headers['authorization'];
    const expected = `Bearer ${process.env.INTERNAL_WORKER_TOKEN || 'internal-secret'}`;
    if (!auth || auth !== expected) throw new UnauthorizedException('Internal token required');
    return true;
  }
}
