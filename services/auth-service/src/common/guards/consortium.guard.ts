import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ConsortiumGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;
    const query = request.query;

    // Obter consortiumId dos parametros, query ou body
    const consortiumId = params.consortiumId || query.consortiumId || request.body?.consortiumId;

    // Se nao houver consortiumId na requisicao, nao precisa validar
    if (!consortiumId) {
      return true;
    }

    // Se o usuario nao tiver consortiumId, nao pode acessar
    if (!user?.consortiumId) {
      throw new ForbiddenException('Consortium access required');
    }

    // Validar se o usuario pertence ao consortium
    if (user.consortiumId !== consortiumId && user.userType !== 'ADMIN_NACIONAL') {
      throw new ForbiddenException('Access denied to this consortium');
    }

    return true;
  }
}
