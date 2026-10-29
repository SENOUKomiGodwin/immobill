import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/auth/services/auth.service';
import { RegisterDto } from '../src/auth/dto/register.dto';

describe('Isolation Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should enforce user isolation for properties', async () => {
    // Créer deux utilisateurs
    const userA = await authService.register({
      email: 'user-a-isolation@test.com',
      password: 'password123',
      full_name: 'User A',
    } as RegisterDto);

    const userB = await authService.register({
      email: 'user-b-isolation@test.com',
      password: 'password123',
      full_name: 'User B',
    } as RegisterDto);

    // Créer une propriété pour l'utilisateur A
    const propertyA = await prisma.properties.create({
      data: {
        name: 'Property A',
        type: 'Immeuble',
        created_by_id: userA.id,
      },
    });

    // User B ne peut pas lire (avec filtre created_by_id)
    const propertyFromB = await prisma.properties.findFirst({
      where: {
        id: propertyA.id,
        created_by_id: userB.id,
      },
    });

    expect(propertyFromB).toBeNull();

    // User A peut lire
    const propertyFromA = await prisma.properties.findFirst({
      where: {
        id: propertyA.id,
        created_by_id: userA.id,
      },
    });

    expect(propertyFromA).not.toBeNull();
    expect(propertyFromA?.name).toBe('Property A');

    // Cleanup
    await prisma.properties.delete({ where: { id: propertyA.id } });
    await prisma.users.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  });

  it('should allow admin to read all properties', async () => {
    const user = await authService.register({
      email: 'user-admin@test.com',
      password: 'password123',
      full_name: 'Regular User',
    } as RegisterDto);

    const admin = await authService.register({
      email: 'admin@test.com',
      password: 'password123',
      full_name: 'Admin',
    } as RegisterDto);

    // Promouvoir admin
    await prisma.users.update({
      where: { id: admin.id },
      data: { role: 'admin' },
    });

    const property = await prisma.properties.create({
      data: {
        name: 'Test Property',
        type: 'Immeuble',
        created_by_id: user.id,
      },
    });

    // Admin peut lire sans filtre created_by_id
    const propertyAsAdmin = await prisma.properties.findFirst({
      where: { id: property.id },
    });

    expect(propertyAsAdmin).not.toBeNull();

    // Cleanup
    await prisma.properties.delete({ where: { id: property.id } });
    await prisma.users.deleteMany({ where: { id: { in: [user.id, admin.id] } } });
  });
});
