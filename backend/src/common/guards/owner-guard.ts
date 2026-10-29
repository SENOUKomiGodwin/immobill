import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.currentUser;

    if (!user) {
      return false;
    }

    // Injecter le filtre de propriétaire dans la requête
    // Les services l'utiliseront pour filtrer automatiquement
    request.ownerFilter = user.role === 'admin' ? {} : { created_by_id: user.id };

    return true;
  }
}
