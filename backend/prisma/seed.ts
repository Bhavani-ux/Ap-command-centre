import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Company
  const company = await prisma.company.upsert({
    where: { code: 'ACME' },
    update: {},
    create: {
      name: 'Acme Corporation',
      code: 'ACME',
      email: 'info@acme.com',
      phone: '+91-22-12345678',
      address: '123 Business Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India',
      isActive: true,
    },
  });
  console.log('✅ Company created');

  // Create Departments
  const finance = await prisma.department.upsert({
    where: { code_companyId: { code: 'FIN', companyId: company.id } },
    update: {},
    create: {
      name: 'Finance',
      code: 'FIN',
      companyId: company.id,
    },
  });

  const operations = await prisma.department.upsert({
    where: { code_companyId: { code: 'OPS', companyId: company.id } },
    update: {},
    create: {
      name: 'Operations',
      code: 'OPS',
      companyId: company.id,
    },
  });
  console.log('✅ Departments created');

  // Create System Roles with all role codes
  const roles = [
    { name: 'System Admin', code: 'SYSTEM_ADMIN' },
    { name: 'CFO', code: 'CFO' },
    { name: 'Finance Controller', code: 'FINANCE_CONTROLLER' },
    { name: 'Functional Head', code: 'FUNCTIONAL_HEAD' },
    { name: 'Branch Manager', code: 'BRANCH_MANAGER' },
    { name: 'AP Clerk', code: 'AP_CLERK' },
    { name: 'Auditor', code: 'AUDITOR' },
  ];

  const createdRoles = [];
  for (const role of roles) {
    const r = await prisma.role.upsert({
      where: { code_companyId: { code: role.code, companyId: company.id } },
      update: {},
      create: {
        name: role.name,
        code: role.code,
        companyId: company.id,
        isSystem: true,
      },
    });
    createdRoles.push(r);
  }
  console.log('✅ Roles created');

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      companyId: company.id,
      departmentId: finance.id,
      roles: { connect: [{ id: createdRoles[0].id }] },
    },
  });

  await prisma.user.upsert({
    where: { email: 'cfo@acme.com' },
    update: {},
    create: {
      email: 'cfo@acme.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Chen',
      companyId: company.id,
      departmentId: finance.id,
      roles: { connect: [{ id: createdRoles[1].id }] },
    },
  });

  await prisma.user.upsert({
    where: { email: 'clerk@acme.com' },
    update: {},
    create: {
      email: 'clerk@acme.com',
      password: hashedPassword,
      firstName: 'Amit',
      lastName: 'Patel',
      companyId: company.id,
      departmentId: finance.id,
      roles: { connect: [{ id: createdRoles[5].id }] },
    },
  });
  console.log('✅ Users created');

  // Create Vendors
  const vendor = await prisma.vendor.upsert({
    where: { code_companyId: { code: 'V001', companyId: company.id } },
    update: {},
    create: {
      name: 'Office Supplies Inc',
      code: 'V001',
      email: 'billing@officesupplies.com',
      category: 'Office Supplies',
      companyId: company.id,
    },
  });
  console.log('✅ Vendors created');

  // Create GL Account
  const glAccount = await prisma.glAccount.upsert({
    where: {
      accountNumber_companyId: {
        accountNumber: '5100',
        companyId: company.id,
      },
    },
    update: {},
    create: {
      accountNumber: '5100',
      accountName: 'Office Supplies',
      accountType: 'Expense',
      companyId: company.id,
    },
  });
  console.log('✅ GL Account created');

  // Create DOA Rules
  await prisma.doaMatrixRule.create({
    data: {
      companyId: company.id,
      roleCode: 'AP_CLERK',
      minAmount: 0,
      maxAmount: 10000,
      approvalLevel: 1,
      autoApprove: true,
    },
  });
  console.log('✅ DOA Rules created');

  // Create Invoice
  const invoice = await prisma.invoice.create({
    data: {
      referenceNumber: 'REF-2024-000001',
      invoiceNumber: 'INV-2024-001',
      vendorId: vendor.id,
      companyId: company.id,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      category: 'Office Supplies',
      subtotal: 1000,
      taxAmount: 180,
      totalAmount: 1180,
      amountDue: 1180,
      status: 'draft',
      ageInDays: 0,
    },
  });

  await prisma.invoiceLineItem.create({
    data: {
      invoiceId: invoice.id,
      lineNumber: 1,
      description: 'Office supplies',
      quantity: 1,
      unitPrice: 1000,
      amount: 1000,
      glAccountId: glAccount.id,
    },
  });
  console.log('✅ Invoice created');

  // Create sample email intake records
  console.log('✅ Creating sample email intake records...');

  const emails = [
    {
      messageId: 'msg-001@jiostar.com',
      from: 'billing@jiostar.com',
      to: 'ap.invoices@asianet.co.in',
      subject: 'JioStar_E-96761_Oct Carriage Fee',
      body: 'Please find attached invoice for October carriage fees.',
      attachmentCount: 1,
      status: 'received',
      isSuspicious: false,
    },
    {
      messageId: 'msg-002@sterlite.com',
      from: 'accounts@sterlite.com',
      to: 'ap.invoices@asianet.co.in',
      subject: 'Sterlite_NW-7567_OFC Supply Batch 12',
      body: 'Invoice attached for OFC supply batch 12.',
      attachmentCount: 1,
      status: 'received',
      isSuspicious: false,
    },
    {
      messageId: 'msg-003@kseb.in',
      from: 'noreply@kseb.in',
      to: 'ap.invoices@asianet.co.in',
      subject: 'KSEB Pole Rental — Kochi Division Q3',
      body: 'Q3 pole rental invoice attached.',
      attachmentCount: 1,
      status: 'received',
      isSuspicious: false,
    },
    {
      messageId: 'msg-004@freemoney.biz',
      from: 'win-lottery@freemoney.biz',
      to: 'ap.invoices@asianet.co.in',
      subject: 'You WON 10 Crore!! Claim now',
      body: 'Congratulations! You have won 10 crore rupees. Click here to claim your prize!',
      attachmentCount: 1,
      status: 'received',
      isSuspicious: true,
      suspicionReasons: ['Spam keyword detected: "won"', 'Spam keyword detected: "crore"', 'Suspicious sender domain: freemoney.biz'],
    },
    {
      messageId: 'msg-005@gmail.com',
      from: 'lco.thrissur@gmail.com',
      to: 'ap.invoices@asianet.co.in',
      subject: 'Thrissur Alliance — Sept Commission Settlement',
      body: 'Commission settlement for September attached.',
      attachmentCount: 1,
      status: 'received',
      isSuspicious: false,
    },
  ];

  for (const emailData of emails) {
    await prisma.emailIntake.create({
      data: {
        ...emailData,
        receivedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('✅ Email intake records created');

  console.log('\n✅ Seed complete! Login: admin@acme.com / password123\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
