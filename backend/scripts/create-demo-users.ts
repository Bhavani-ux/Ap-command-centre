import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_USERS = [
  {
    email: 'admin@asianet.co.in',
    password: 'admin123',
    firstName: 'Arun',
    lastName: 'Menon',
    roleCode: 'SYSTEM_ADMIN',
  },
  {
    email: 'cfo@asianet.co.in',
    password: 'cfo123',
    firstName: 'Deepa',
    lastName: 'Nair',
    roleCode: 'CFO',
  },
  {
    email: 'fc@asianet.co.in',
    password: 'fc123',
    firstName: 'Rajesh',
    lastName: 'Pillai',
    roleCode: 'FINANCE_CONTROLLER',
  },
  {
    email: 'func@asianet.co.in',
    password: 'func123',
    firstName: 'Suresh',
    lastName: 'Kumar',
    roleCode: 'FUNCTIONAL_HEAD',
  },
  {
    email: 'branch@asianet.co.in',
    password: 'branch123',
    firstName: 'Lakshmi',
    lastName: 'Varma',
    roleCode: 'BRANCH_MANAGER',
  },
  {
    email: 'clerk@asianet.co.in',
    password: 'clerk123',
    firstName: 'Anju',
    lastName: 'Thomas',
    roleCode: 'AP_CLERK',
  },
  {
    email: 'auditor@asianet.co.in',
    password: 'view123',
    firstName: 'Vikram',
    lastName: 'Iyer',
    roleCode: 'AUDITOR',
  },
];

async function main() {
  console.log('Creating demo users...');

  // Get or create company
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Asianet Satellite Communications Ltd',
        code: 'ASCL',
        email: 'info@asianet.co.in',
        isActive: true,
      },
    });
    console.log('Created company:', company.name);
  }

  // Create or update roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { code_companyId: { code: 'SYSTEM_ADMIN', companyId: company.id } },
      update: { name: 'System Admin', isActive: true },
      create: {
        code: 'SYSTEM_ADMIN',
        name: 'System Admin',
        companyId: company.id,
        isActive: true,
        isSystem: true,
      },
    }),
    prisma.role.upsert({
      where: { code_companyId: { code: 'CFO', companyId: company.id } },
      update: { name: 'CFO', isActive: true },
      create: {
        code: 'CFO',
        name: 'CFO',
        companyId: company.id,
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { code_companyId: { code: 'FINANCE_CONTROLLER', companyId: company.id } },
      update: { name: 'Finance Controller', isActive: true },
      create: {
        code: 'FINANCE_CONTROLLER',
        name: 'Finance Controller',
        companyId: company.id,
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { code_companyId: { code: 'FUNCTIONAL_HEAD', companyId: company.id } },
      update: { name: 'Functional Head', isActive: true },
      create: {
        code: 'FUNCTIONAL_HEAD',
        name: 'Functional Head',
        companyId: company.id,
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { code_companyId: { code: 'BRANCH_MANAGER', companyId: company.id } },
      update: { name: 'Branch Manager', isActive: true },
      create: {
        code: 'BRANCH_MANAGER',
        name: 'Branch Manager',
        companyId: company.id,
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { code_companyId: { code: 'AP_CLERK', companyId: company.id } },
      update: { name: 'AP Clerk', isActive: true },
      create: {
        code: 'AP_CLERK',
        name: 'AP Clerk',
        companyId: company.id,
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { code_companyId: { code: 'AUDITOR', companyId: company.id } },
      update: { name: 'Auditor', isActive: true },
      create: {
        code: 'AUDITOR',
        name: 'Auditor',
        companyId: company.id,
        isActive: true,
      },
    }),
  ]);

  console.log('Created/updated roles:', roles.length);

  // Create demo users
  for (const demoUser of DEMO_USERS) {
    const hashedPassword = await bcrypt.hash(demoUser.password, 10);

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { email: demoUser.email },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          isActive: true,
        },
      });
      console.log(`Updated user: ${demoUser.email}`);
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: demoUser.email,
          password: hashedPassword,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          companyId: company.id,
          isActive: true,
        },
      });
      console.log(`Created user: ${demoUser.email}`);
    }

    // Assign role
    const role = roles.find((r) => r.code === demoUser.roleCode);
    if (role) {
      // Check if role already assigned
      const existingUserRole = await prisma.userRole.findFirst({
        where: {
          userId: user.id,
          roleId: role.id,
        },
      });

      if (!existingUserRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });
        console.log(`  -> Assigned role: ${role.name}`);
      }
    }
  }

  console.log('\n✅ Demo users created successfully!');
  console.log('\nYou can now login with:');
  DEMO_USERS.forEach((u) => {
    console.log(`  ${u.email} / ${u.password} (${u.roleCode})`);
  });
}

main()
  .catch((e) => {
    console.error('Error creating demo users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
