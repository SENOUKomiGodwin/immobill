import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe.skip('Payment Concurrency and Cancellation (e2e) - Requires PostgreSQL', () => {
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
    await prisma.payments.deleteMany();
    await prisma.rent_dues.deleteMany();
    await prisma.leases.deleteMany();
    await prisma.units.deleteMany();
    await prisma.tenants.deleteMany();
    await prisma.properties.deleteMany();
    await prisma.users.deleteMany();
    await prisma.owner_counters.deleteMany();
    await app.close();
  });

  describe('Payment Concurrency', () => {
    let authToken: string;
    let rentDueId: string;

    beforeAll(async () => {
      // Register and login
      await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'concurrency@test.com',
        password: 'password123',
        full_name: 'Test User',
      });

      const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
        email: 'concurrency@test.com',
        password: 'password123',
      });

      authToken = loginResponse.body.access_token;

      // Create property
      const property = await prisma.properties.create({
        data: {
          name: 'Test Property',
          type: 'Immeuble',
          created_by_id: loginResponse.body.user.id,
        },
      });

      // Create unit
      const unit = await prisma.units.create({
        data: {
          property_id: property.id,
          label: 'Unit 1',
          type: 'Appartement',
          rent_amount: 50000,
          charges_amount: 5000,
          status: 'Libre',
          created_by_id: loginResponse.body.user.id,
        },
      });

      // Create tenant
      const tenant = await prisma.tenants.create({
        data: {
          full_name: 'Test Tenant',
          rent_amount: 55000,
          created_by_id: loginResponse.body.user.id,
        },
      });

      // Create lease
      const lease = await prisma.leases.create({
        data: {
          unit_id: unit.id,
          tenant_id: tenant.id,
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-12-31'),
          rent_amount: 50000,
          charges_amount: 5000,
          deposit_amount: 0,
          due_day: 5,
          grace_days: 7,
          penalty_enabled: false,
          status: 'Actif',
          unit_label: unit.label,
          unit_type: unit.type,
          property_id: property.id,
          property_name: property.name,
          tenant_name: tenant.full_name,
          tenant_phone: tenant.phone,
          created_by_id: loginResponse.body.user.id,
        },
      });

      // Create rent due
      const rentDue = await prisma.rent_dues.create({
        data: {
          lease_id: lease.id,
          period: '2024-01',
          due_date: new Date('2024-01-05'),
          amount_due: 55000,
          amount_paid: 0,
          status: 'Attente',
        },
      });

      rentDueId = rentDue.id;
    });

    it('should handle concurrent payments correctly with row locking', async () => {
      const amountDue = 55000;

      // Simulate two concurrent payments
      const payment1 = request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          due_id: rentDueId,
          amount: 30000,
          method: 'Virement',
        });

      const payment2 = request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          due_id: rentDueId,
          amount: 30000,
          method: 'Virement',
        });

      // Execute both concurrently
      const [result1, result2] = await Promise.allSettled([payment1, payment2]);

      // One should succeed, one should fail with 400 (exceeds balance)
      const succeeded =
        result1.status === 'fulfilled'
          ? (result1 as PromiseFulfilledResult<Response>).value
          : (result2 as PromiseFulfilledResult<Response>).value;
      const failed =
        result1.status === 'rejected'
          ? (result1 as PromiseRejectedResult).reason
          : (result2 as PromiseRejectedResult).reason;

      expect(succeeded.status).toBe(200);

      // The failed one should be due to exceeding balance
      expect(failed.response?.status).toBe(400);
      expect(failed.response?.data?.message).toContain('dépasse le solde');

      // Verify the rent due was updated correctly
      const rentDue = await prisma.rent_dues.findUnique({
        where: { id: rentDueId },
      });

      expect(rentDue.amount_paid).toBe(30000);
      expect(rentDue.amount_due).toBe(amountDue);
    });

    it('should allow exact balance payment after partial payment', async () => {
      // Reset rent due
      await prisma.rent_dues.update({
        where: { id: rentDueId },
        data: { amount_paid: 0 },
      });

      // First payment: 30000
      await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          due_id: rentDueId,
          amount: 30000,
          method: 'Virement',
        })
        .expect(201);

      // Second payment: exact balance (25000)
      await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          due_id: rentDueId,
          amount: 25000,
          method: 'Virement',
        })
        .expect(201);

      // Verify rent due is fully paid
      const rentDue = await prisma.rent_dues.findUnique({
        where: { id: rentDueId },
      });

      expect(rentDue.amount_paid).toBe(55000);
    });
  });

  describe('Payment Cancellation', () => {
    let authToken: string;
    let paymentId: string;
    let rentDueId: string;

    beforeAll(async () => {
      // Register and login
      await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'cancel@test.com',
        password: 'password123',
        full_name: 'Cancel User',
      });

      const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
        email: 'cancel@test.com',
        password: 'password123',
      });

      authToken = loginResponse.body.access_token;

      // Create property, unit, tenant, lease, rent due
      const property = await prisma.properties.create({
        data: {
          name: 'Cancel Property',
          type: 'Immeuble',
          created_by_id: loginResponse.body.user.id,
        },
      });

      const unit = await prisma.units.create({
        data: {
          property_id: property.id,
          label: 'Unit 2',
          type: 'Appartement',
          rent_amount: 50000,
          charges_amount: 5000,
          status: 'Libre',
          created_by_id: loginResponse.body.user.id,
        },
      });

      const tenant = await prisma.tenants.create({
        data: {
          full_name: 'Cancel Tenant',
          rent_amount: 55000,
          created_by_id: loginResponse.body.user.id,
        },
      });

      const lease = await prisma.leases.create({
        data: {
          unit_id: unit.id,
          tenant_id: tenant.id,
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-12-31'),
          rent_amount: 50000,
          charges_amount: 5000,
          deposit_amount: 0,
          due_day: 5,
          grace_days: 7,
          penalty_enabled: false,
          status: 'Actif',
          unit_label: unit.label,
          unit_type: unit.type,
          property_id: property.id,
          property_name: property.name,
          tenant_name: tenant.full_name,
          tenant_phone: tenant.phone,
          created_by_id: loginResponse.body.user.id,
        },
      });

      const rentDue = await prisma.rent_dues.create({
        data: {
          lease_id: lease.id,
          period: '2024-02',
          due_date: new Date('2024-02-05'),
          amount_due: 55000,
          amount_paid: 0,
          status: 'Attente',
        },
      });

      rentDueId = rentDue.id;

      // Create payment
      const payment = await prisma.payments.create({
        data: {
          due_id: rentDueId,
          lease_id: lease.id,
          period: '2024-02',
          amount: 30000,
          method: 'Virement',
          receipt_number: 'Q-2024-0001',
          payment_date: new Date(),
          tenant_name: tenant.full_name,
          unit_label: unit.label,
          property_name: property.name,
          created_by_id: loginResponse.body.user.id,
        },
      });

      paymentId = payment.id;

      // Update rent due
      await prisma.rent_dues.update({
        where: { id: rentDueId },
        data: { amount_paid: 30000 },
      });
    });

    it('should cancel payment and revert rent due amount', async () => {
      // Cancel payment
      await request(app.getHttpServer())
        .post(`/api/payments/${paymentId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Erreur de paiement',
        })
        .expect(200);

      // Verify payment is cancelled
      const payment = await prisma.payments.findUnique({
        where: { id: paymentId },
      });

      expect(payment.cancelled).toBe(true);
      expect(payment.cancellation_reason).toBe('Erreur de paiement');
      expect(payment.cancelled_at).not.toBeNull();

      // Verify rent due amount was reverted
      const rentDue = await prisma.rent_dues.findUnique({
        where: { id: rentDueId },
      });

      expect(rentDue.amount_paid).toBe(0);

      // Verify audit log was created
      const auditLog = await prisma.audit_log.findFirst({
        where: {
          entity_type: 'Payment',
          entity_id: paymentId,
          action: 'CANCEL',
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog?.action).toBe('CANCEL');
    });

    it('should not allow cancelling already cancelled payment', async () => {
      await request(app.getHttpServer())
        .post(`/api/payments/${paymentId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Double annulation',
        })
        .expect(400);
    });
  });
});
