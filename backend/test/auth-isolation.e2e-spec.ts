import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Auth & Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.users.deleteMany();
    await prisma.properties.deleteMany();
    await prisma.units.deleteMany();
    await app.close();
  });

  describe('Authentication', () => {
    it('POST /auth/register - should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.role).toBe('user');
    });

    it('POST /auth/register - should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(409);
    });

    it('POST /auth/login - should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('POST /auth/login - should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('GET /auth/me - should return authenticated user', async () => {
      const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
        .expect(200);

      expect(response.body.email).toBe('test@example.com');
    });

    it('GET /auth/me - should reject without token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });

  describe('Owner Isolation', () => {
    let userA: { id: string; access_token: string };
    let userB: { id: string; access_token: string };
    let propertyAId: string;

    beforeAll(async () => {
      // Register user A
      const registerA = await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'usera@example.com',
        password: 'password123',
        full_name: 'User A',
      });

      const loginA = await request(app.getHttpServer()).post('/api/auth/login').send({
        email: 'usera@example.com',
        password: 'password123',
      });

      userA = { id: registerA.body.id, access_token: loginA.body.access_token };

      // Register user B
      const registerB = await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'userb@example.com',
        password: 'password123',
        full_name: 'User B',
      });

      const loginB = await request(app.getHttpServer()).post('/api/auth/login').send({
        email: 'userb@example.com',
        password: 'password123',
      });

      userB = { id: registerB.body.id, access_token: loginB.body.access_token };

      // Create property for user A (using direct Prisma for now)
      const propertyA = await prisma.properties.create({
        data: {
          name: 'Property A',
          type: 'Immeuble',
          address: '123 Main St',
          city: 'Paris',
          created_by_id: userA.id,
        },
      });
      propertyAId = propertyA.id;
    });

    it("User B cannot read user A's property", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${propertyAId}`)
        .set('Authorization', `Bearer ${userB.access_token}`)
        .expect(404); // Should not find it

      // The property should not be accessible to user B
      expect(response.body).not.toHaveProperty('id', propertyAId);
    });

    it('User A can read their own property', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${propertyAId}`)
        .set('Authorization', `Bearer ${userA.access_token}`)
        .expect(200);

      expect(response.body.id).toBe(propertyAId);
      expect(response.body.name).toBe('Property A');
    });

    it("User B cannot update user A's property", async () => {
      await request(app.getHttpServer())
        .patch(`/api/properties/${propertyAId}`)
        .set('Authorization', `Bearer ${userB.access_token}`)
        .send({ name: 'Hacked Property' })
        .expect(404); // Should not find it to update
    });

    it("User B cannot delete user A's property", async () => {
      await request(app.getHttpServer())
        .delete(`/api/properties/${propertyAId}`)
        .set('Authorization', `Bearer ${userB.access_token}`)
        .expect(404); // Should not find it to delete
    });
  });
});
