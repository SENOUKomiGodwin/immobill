import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe avec Argon2
    const password_hash = await argon2.hash(dto.password);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash,
        full_name: dto.full_name,
        role: 'user',
        created_by_id: 'system', // Sera remplacé par l'ID de l'utilisateur créé
      },
    });

    // Mettre à jour created_by_id avec l'ID de l'utilisateur lui-même
    await this.prisma.user.update({
      where: { id: user.id },
      data: { created_by_id: user.id },
    });

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };
  }

  async login(dto: LoginDto) {
    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const passwordValid = await argon2.verify(user.password_hash, dto.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer les tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    // Créer un refresh token
    const refresh_token = this.generateRefreshToken();
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7); // 7 jours

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token: refresh_token,
        expires_at,
      },
    });

    return {
      refresh_token,
      access_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    // Trouver le refresh token
    const tokenRecord = await this.prisma.refresh_tokens.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord || tokenRecord.revoked_at || tokenRecord.expires_at < new Date()) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }

    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: tokenRecord.user_id },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    // Générer un nouveau access token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    return user;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    // Toujours retourner succès pour éviter l'énumération d'emails
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      // TODO: Envoyer un email avec un token de réinitialisation
      // Pour l'instant, on simule en retournant toujours succès
      console.log(`Password reset requested for ${dto.email}`);
    }

    return {
      message: 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé',
    };
  }

  async resetPassword(_dto: ResetPasswordDto) {
    // TODO: Valider le token et réinitialiser le mot de passe
    // Pour l'instant, simulation
    throw new Error('Non implémenté: validation de token requise');
  }

  async logout(refresh_tokens: string) {
    // Révoquer le refresh token
    await this.prisma.refresh_tokens.updateMany({
      where: { token: refresh_tokens },
      data: { revoked_at: new Date() },
    });
  }

  private generateRefreshToken(): string {
    return Buffer.from(Date.now() + Math.random().toString()).toString('base64');
  }
}
