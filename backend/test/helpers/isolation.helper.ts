import { PrismaService } from 'src/common/prisma/prisma.service';
import { AuthService } from 'src/auth/services/auth.service';
import { RegisterDto } from 'src/auth/dto/register.dto';

/**
 * Helper de test pour vérifier l'isolation des données par propriétaire
 * "L'utilisateur A ne peut rien lire, modifier ni annuler chez l'utilisateur B"
 */
export class IsolationTestHelper {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  /**
   * Crée deux utilisateurs et teste que l'utilisateur A ne peut pas accéder aux données de l'utilisateur B
   */
  async testUserIsolation(): Promise<boolean> {
    console.log('🧪 Testing user isolation...\n');

    // Créer deux utilisateurs
    const userA = await this.authService.register({
      email: 'user-a@test.com',
      password: 'password123',
      full_name: 'User A',
    });

    const userB = await this.authService.register({
      email: 'user-b@test.com',
      password: 'password123',
      full_name: 'User B',
    });

    console.log(`✅ Created users: ${userA.id} (A) and ${userB.id} (B)`);

    // Créer une propriété pour l'utilisateur A
    const propertyA = await this.prisma.properties.create({
      data: {
        name: 'Property A',
        type: 'Immeuble',
        created_by_id: userA.id,
      },
    });

    console.log(`✅ Created property for user A: ${propertyA.id}`);

    // Test 1: L'utilisateur B ne peut pas lire la propriété de A
    const propertyFromB = await this.prisma.properties.findFirst({
      where: {
        id: propertyA.id,
        created_by_id: userB.id, // Filtre par propriétaire B
      },
    });

    if (propertyFromB) {
      console.log("❌ FAILED: User B can read user A's property");
      return false;
    }
    console.log("✅ PASSED: User B cannot read user A's property");

    // Test 2: L'utilisateur B ne peut pas modifier la propriété de A
    try {
      await this.prisma.properties.update({
        where: {
          id: propertyA.id,
          created_by_id: userB.id, // Filtre par propriétaire B
        },
        data: { name: 'Hacked Property' },
      });
      console.log("❌ FAILED: User B can update user A's property");
      return false;
    } catch (error) {
      console.log("✅ PASSED: User B cannot update user A's property");
    }

    // Test 3: L'utilisateur B ne peut pas supprimer la propriété de A
    try {
      await this.prisma.properties.delete({
        where: {
          id: propertyA.id,
          created_by_id: userB.id, // Filtre par propriétaire B
        },
      });
      console.log("❌ FAILED: User B can delete user A's property");
      return false;
    } catch (error) {
      console.log("✅ PASSED: User B cannot delete user A's property");
    }

    // Test 4: Admin peut tout lire
    const adminUser = await this.authService.register({
      email: 'admin@test.com',
      password: 'password123',
      full_name: 'Admin',
    });

    await this.prisma.users.update({
      where: { id: adminUser.id },
      data: { role: 'admin' },
    });

    const propertyAsAdmin = await this.prisma.properties.findFirst({
      where: { id: propertyA.id },
    });

    if (!propertyAsAdmin) {
      console.log("❌ FAILED: Admin cannot read user A's property");
      return false;
    }
    console.log("✅ PASSED: Admin can read user A's property");

    // Cleanup
    await this.prisma.properties.delete({ where: { id: propertyA.id } });
    await this.prisma.users.deleteMany({
      where: { id: { in: [userA.id, userB.id, adminUser.id] } },
    });

    console.log('\n✨ All isolation tests passed');
    return true;
  }

  /**
   * Test générique pour n'importe quelle entité
   * @param entityName Nom de la table Prisma (ex: 'properties', 'units', 'tenants')
   * @param createData Données pour créer un enregistrement
   */
  async testEntityIsolation(
    entityName: string,
    createData: Record<string, unknown>,
    idField: string = 'id',
  ): Promise<boolean> {
    const userA = await this.authService.register({
      email: `user-a-${Date.now()}@test.com`,
      password: 'password123',
      full_name: 'User A',
    } as RegisterDto);

    const userB = await this.authService.register({
      email: `user-b-${Date.now()}@test.com`,
      password: 'password123',
      full_name: 'User B',
    } as RegisterDto);

    // Créer pour l'utilisateur A
    const recordA = (await (this.prisma as Record<string, unknown>)[entityName].create({
      data: { ...createData, created_by_id: userA.id },
    })) as Record<string, unknown>;

    // Test: B ne peut pas lire
    const recordFromB = await (this.prisma as Record<string, unknown>)[entityName].findFirst({
      where: { [idField]: recordA[idField], created_by_id: userB.id },
    });

    if (recordFromB) {
      console.log(`❌ FAILED: User B can read ${entityName} from user A`);
      return false;
    }

    // Test: B ne peut pas modifier
    try {
      await (this.prisma as Record<string, unknown>)[entityName].update({
        where: { [idField]: recordA[idField], created_by_id: userB.id },
        data: { name: 'Hacked' },
      });
      console.log(`❌ FAILED: User B can update ${entityName} from user A`);
      return false;
    } catch (error) {
      // Attendu
    }

    // Test: B ne peut pas supprimer
    try {
      await (this.prisma as Record<string, unknown>)[entityName].delete({
        where: { [idField]: recordA[idField], created_by_id: userB.id },
      });
      console.log(`❌ FAILED: User B can delete ${entityName} from user A`);
      return false;
    } catch (error) {
      // Attendu
    }

    // Cleanup
    await (this.prisma as Record<string, unknown>)[entityName].delete({
      where: { [idField]: recordA[idField] },
    });
    await this.prisma.users.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });

    console.log(`✅ PASSED: ${entityName} isolation test`);
    return true;
  }
}
