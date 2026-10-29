import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConstraints() {
  console.log('🧪 Testing database constraints...\n');

  // Test 1: UNIQUE (lease_id, period) pour RentDue
  console.log('Test 1: UNIQUE (lease_id, period) for RentDue');
  try {
    const lease = await prisma.lease.create({
      data: {
        unit_id: 'test-unit-1',
        tenant_id: 'test-tenant-1',
        start_date: new Date('2024-01-01'),
        created_by_id: 'test-user',
      },
    });

    const due1 = await prisma.rentDue.create({
      data: {
        lease_id: lease.id,
        period: '2024-01',
        due_date: new Date('2024-01-31'),
        amount_due: 100000,
        created_by_id: 'test-user',
      },
    });

    try {
      await prisma.rentDue.create({
        data: {
          lease_id: lease.id,
          period: '2024-01', // Même période
          due_date: new Date('2024-01-31'),
          amount_due: 100000,
          created_by_id: 'test-user',
        },
      });
      console.log('❌ FAILED: Duplicate period should be rejected');
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('✅ PASSED: Duplicate period rejected (P2002)');
      } else {
        console.log('❌ FAILED: Wrong error code', error.code);
      }
    }

    // Cleanup
    await prisma.rentDue.deleteMany({ where: { lease_id: lease.id } });
    await prisma.lease.delete({ where: { id: lease.id } });
  } catch (error) {
    console.log('❌ Test 1 setup failed:', error);
  }

  // Test 2: Index unique partiel pour un seul bail actif par unité
  console.log('\nTest 2: Partial unique index for active lease per unit');
  try {
    const unit = await prisma.unit.create({
      data: {
        property_id: 'test-property-1',
        label: 'Test Unit',
        status: 'LIBRE',
        created_by_id: 'test-user',
      },
    });

    const lease1 = await prisma.lease.create({
      data: {
        unit_id: unit.id,
        tenant_id: 'test-tenant-1',
        start_date: new Date('2024-01-01'),
        status: 'ACTIF',
        created_by_id: 'test-user',
      },
    });

    try {
      await prisma.lease.create({
        data: {
          unit_id: unit.id,
          tenant_id: 'test-tenant-2',
          start_date: new Date('2024-02-01'),
          status: 'ACTIF', // Deuxième bail actif sur même unité
          created_by_id: 'test-user',
        },
      });
      console.log('❌ FAILED: Second active lease should be rejected');
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('✅ PASSED: Second active lease rejected (P2002)');
      } else {
        console.log('❌ FAILED: Wrong error code', error.code);
      }
    }

    // Test qu'un bail terminé est autorisé
    try {
      await prisma.lease.create({
        data: {
          unit_id: unit.id,
          tenant_id: 'test-tenant-2',
          start_date: new Date('2024-02-01'),
          status: 'TERMINE', // Bail terminé OK
          created_by_id: 'test-user',
        },
      });
      console.log('✅ PASSED: Terminated lease allowed on same unit');
    } catch (error: any) {
      console.log('❌ FAILED: Terminated lease should be allowed', error.code);
    }

    // Cleanup
    await prisma.lease.deleteMany({ where: { unit_id: unit.id } });
    await prisma.unit.delete({ where: { id: unit.id } });
  } catch (error) {
    console.log('❌ Test 2 setup failed:', error);
  }

  // Test 3: receipt_number unique par propriétaire
  console.log('\nTest 3: Unique receipt_number per owner');
  try {
    const due1 = await prisma.rentDue.create({
      data: {
        lease_id: 'test-lease-1',
        period: '2024-01',
        due_date: new Date('2024-01-31'),
        amount_due: 100000,
        created_by_id: 'user-1',
      },
    });

    const due2 = await prisma.rentDue.create({
      data: {
        lease_id: 'test-lease-2',
        period: '2024-02',
        due_date: new Date('2024-02-28'),
        amount_due: 100000,
        created_by_id: 'user-2', // Autre propriétaire
      },
    });

    const payment1 = await prisma.payment.create({
      data: {
        due_id: due1.id,
        amount: 100000,
        payment_date: new Date('2024-01-15'),
        receipt_number: 'Q-2024-0001',
        created_by_id: 'user-1',
      },
    });

    try {
      // Même numéro pour même propriétaire = erreur
      await prisma.payment.create({
        data: {
          due_id: due1.id,
          amount: 50000,
          payment_date: new Date('2024-01-20'),
          receipt_number: 'Q-2024-0001', // Dupliqué
          created_by_id: 'user-1',
        },
      });
      console.log('❌ FAILED: Duplicate receipt_number should be rejected');
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('✅ PASSED: Duplicate receipt_number rejected (P2002)');
      } else {
        console.log('❌ FAILED: Wrong error code', error.code);
      }
    }

    try {
      // Même numéro pour autre propriétaire = OK
      await prisma.payment.create({
        data: {
          due_id: due2.id,
          amount: 100000,
          payment_date: new Date('2024-02-15'),
          receipt_number: 'Q-2024-0001', // Même numéro mais autre propriétaire
          created_by_id: 'user-2',
        },
      });
      console.log('✅ PASSED: Same receipt_number allowed for different owner');
    } catch (error: any) {
      console.log('❌ FAILED: Same receipt_number should be allowed for different owner', error.code);
    }

    // Cleanup
    await prisma.payment.deleteMany({ where: { due_id: { in: [due1.id, due2.id] } } });
    await prisma.rentDue.deleteMany({ where: { id: { in: [due1.id, due2.id] } } });
  } catch (error) {
    console.log('❌ Test 3 setup failed:', error);
  }

  // Test 4: UNIQUE (due_id, tier) pour Reminder
  console.log('\nTest 4: UNIQUE (due_id, tier) for Reminder');
  try {
    const due = await prisma.rentDue.create({
      data: {
        lease_id: 'test-lease-3',
        period: '2024-03',
        due_date: new Date('2024-03-31'),
        amount_due: 100000,
        created_by_id: 'test-user',
      },
    });

    await prisma.reminder.create({
      data: {
        due_id: due.id,
        tier: 1,
        method: 'WhatsApp',
        created_by_id: 'test-user',
      },
    });

    try {
      await prisma.reminder.create({
        data: {
          due_id: due.id,
          tier: 1, // Même palier
          method: 'SMS',
          created_by_id: 'test-user',
        },
      });
      console.log('❌ FAILED: Duplicate reminder tier should be rejected');
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('✅ PASSED: Duplicate reminder tier rejected (P2002)');
      } else {
        console.log('❌ FAILED: Wrong error code', error.code);
      }
    }

    try {
      // Autre palier OK
      await prisma.reminder.create({
        data: {
          due_id: due.id,
          tier: 7, // Palier différent
          method: 'SMS',
          created_by_id: 'test-user',
        },
      });
      console.log('✅ PASSED: Different reminder tier allowed');
    } catch (error: any) {
      console.log('❌ FAILED: Different reminder tier should be allowed', error.code);
    }

    // Cleanup
    await prisma.reminder.deleteMany({ where: { due_id: due.id } });
    await prisma.rentDue.delete({ where: { id: due.id } });
  } catch (error) {
    console.log('❌ Test 4 setup failed:', error);
  }

  // Test 5: UNIQUE (owner_id, year) pour owner_counters
  console.log('\nTest 5: UNIQUE (owner_id, year) for owner_counters');
  try {
    await prisma.owner_counters.create({
      data: {
        owner_id: 'user-1',
        year: 2024,
        sequence: 1,
      },
    });

    try {
      await prisma.owner_counters.create({
        data: {
          owner_id: 'user-1',
          year: 2024, // Dupliqué
          sequence: 2,
        },
      });
      console.log('❌ FAILED: Duplicate owner_counter should be rejected');
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('✅ PASSED: Duplicate owner_counter rejected (P2002)');
      } else {
        console.log('❌ FAILED: Wrong error code', error.code);
      }
    }

    try {
      // Autre année OK
      await prisma.owner_counters.create({
        data: {
          owner_id: 'user-1',
          year: 2025, // Année différente
          sequence: 1,
        },
      });
      console.log('✅ PASSED: Different year allowed for same owner');
    } catch (error: any) {
      console.log('❌ FAILED: Different year should be allowed', error.code);
    }

    // Cleanup
    await prisma.owner_counters.deleteMany({ where: { owner_id: 'user-1' } });
  } catch (error) {
    console.log('❌ Test 5 setup failed:', error);
  }

  console.log('\n✨ All constraint tests completed');
}

testConstraints()
  .catch((e) => {
    console.error('Test suite failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
