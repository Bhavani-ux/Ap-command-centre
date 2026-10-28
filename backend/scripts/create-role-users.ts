import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ROLE_USERS = [
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
    password: 'auditor123',
    firstName: 'Vikram',
    lastName: 'Iyer',
    roleCode: 'AUDITOR',
  },
];

async function main() {
  console.log('Creating users for each role...\n');

  // Get company
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company found! Run seed script first.');
    process.exit(1);
  }

  for (const roleUser of ROLE_USERS) {
    const hashedPassword = await bcrypt.hash(roleUser.password, 10);

    // Find the role
    const role = await prisma.role.findFirst({
      where: {
        code: roleUser.roleCode,
        companyId: company.id,
      },
    });

    if (!role) {
      console.log(`❌ Role ${roleUser.roleCode} not found, skipping ${roleUser.email}`);
      continue;
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: roleUser.email },
      include: { roles: true },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          firstName: roleUser.firstName,
          lastName: roleUser.lastName,
          isActive: true,
          roles: {
            set: [{ id: role.id }],
          },
        },
        include: { roles: true },
      });
      console.log(`✅ Updated: ${roleUser.email} (${roleUser.roleCode})`);
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: roleUser.email,
          password: hashedPassword,
          firstName: roleUser.firstName,
          lastName: roleUser.lastName,
          companyId: company.id,
          isActive: true,
          roles: {
            connect: [{ id: role.id }],
          },
        },
        include: { roles: true },
      });
      console.log(`✅ Created: ${roleUser.email} (${roleUser.roleCode})`);
    }
  }

  console.log('\n✅ All users created/updated successfully!');
  console.log('\nYou can now login with:');
  ROLE_USERS.forEach((u) => {
    console.log(`  ${u.email} / ${u.password} (${u.roleCode})`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
