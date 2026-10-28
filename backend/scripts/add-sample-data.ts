import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company found!');
    return;
  }

  console.log('Adding sample vendors and invoices...');

  // Add vendors
  const vendors = [
    { name: 'Kollam Distribution Co', code: 'LC57158', email: 'billing@kollam-dist.com', category: 'Commissions', gstNumber: '32AABCK5678M1Z5' },
    { name: 'Trivandrum Corporation', code: 'PR99604', email: 'accounts@trivandrum-corp.com', category: 'Pole/Utilities', gstNumber: '32AABCT1234M1Z5' },
    { name: 'CDOT Alcatel', code: 'NW42103', email: 'billing@cdot-alcatel.com', category: 'Network Materials', gstNumber: '29AABCC7890M1Z5' },
    { name: 'Sun TV Network Ltd', code: 'CN39790', email: 'finance@suntvnetwork.com', category: 'Content', gstNumber: '33AABCS4567M1Z5' },
    { name: 'Thrissur Cable Alliance', code: 'LC17743', email: 'billing@thrissur-cable.com', category: 'Commissions', gstNumber: '32AABCT9876M1Z5' },
  ];

  for (const v of vendors) {
    await prisma.vendor.upsert({
      where: { code_companyId: { code: v.code, companyId: company.id } },
      update: {},
      create: { ...v, companyId: company.id, isActive: true },
    });
  }
  console.log('✅ Vendors created');

  // Add invoices
  const invoiceData = [
    { ref: 'ASCL-AP-LCO-2610-00027', invNo: 'LC/57158/2610', vendor: 'LC57158', category: 'Commissions', amount: 1794900, doa: 3 },
    { ref: 'ASCL-AP-PRU-2610-00031', invNo: 'PR/99604/2610', vendor: 'PR99604', category: 'Pole/Utilities', amount: 109000, doa: 2 },
    { ref: 'ASCL-AP-NWM-2610-00020', invNo: 'NW/42103/2610', vendor: 'NW42103', category: 'Network Materials', amount: 1676000, doa: 3 },
    { ref: 'ASCL-AP-CNT-2610-00021', invNo: 'CN/39790/2610', vendor: 'CN39790', category: 'Content', amount: 23300000, doa: 5 },
    { ref: 'ASCL-AP-LCO-2610-00026', invNo: 'LC/17743/2610', vendor: 'LC17743', category: 'Commissions', amount: 219000, doa: 2 },
  ];

  for (const inv of invoiceData) {
    const vendor = await prisma.vendor.findFirst({
      where: { code: inv.vendor, companyId: company.id },
    });
    if (!vendor) continue;

    await prisma.invoice.upsert({
      where: { referenceNumber: inv.ref },
      update: {},
      create: {
        referenceNumber: inv.ref,
        invoiceNumber: inv.invNo,
        vendorId: vendor.id,
        companyId: company.id,
        invoiceDate: new Date('2026-10-26'),
        dueDate: new Date('2026-11-25'),
        category: inv.category,
        subtotal: Math.round(inv.amount * 0.85),
        taxAmount: Math.round(inv.amount * 0.15),
        totalAmount: inv.amount,
        amountDue: inv.amount,
        currency: 'INR',
        status: 'completeness_check',
        approvalStatus: 'pending_approval',
        paymentStatus: 'unpaid',
        source: 'email',
        doaLevel: inv.doa,
        ageInDays: 0,
      },
    });
  }
  console.log('✅ Invoices created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
