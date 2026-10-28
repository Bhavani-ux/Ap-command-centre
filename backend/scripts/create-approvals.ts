import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { email: 'admin@acme.com' } });
  if (!admin) {
    console.error('Admin user not found!');
    return;
  }

  const invoices = await prisma.invoice.findMany({
    where: { status: 'completeness_check' },
    take: 5,
  });

  console.log(`Creating approvals for ${invoices.length} invoices...`);

  for (const invoice of invoices) {
    // Check if approval already exists
    const existing = await prisma.approval.findFirst({
      where: {
        invoiceId: invoice.id,
        level: invoice.doaLevel || 3,
      },
    });

    if (!existing) {
      // Create approval assigned to admin
      await prisma.approval.create({
        data: {
          invoiceId: invoice.id,
          approverId: admin.id,
          level: invoice.doaLevel || 3,
          status: 'pending',
          assignedAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000), // Random time in last 2 days
          dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Due in 3 days
          isEscalated: false,
        },
      });
    }

    // Update invoice status to pending_approval
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'pending_approval',
        approvalStatus: 'pending_approval',
      },
    });
  }

  console.log('✅ Approvals created successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
