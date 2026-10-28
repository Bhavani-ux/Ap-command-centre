-- Add sample vendors
INSERT INTO vendors (id, name, code, email, category, gst_number, company_id, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Kollam Distribution Co', 'LC57158', 'billing@kollam-dist.com', 'Commissions', '32AABCK5678M1Z5', (SELECT id FROM companies LIMIT 1), true, NOW(), NOW()),
  (gen_random_uuid(), 'Trivandrum Corporation', 'PR99604', 'accounts@trivandrum-corp.com', 'Pole/Utilities', '32AABCT1234M1Z5', (SELECT id FROM companies LIMIT 1), true, NOW(), NOW()),
  (gen_random_uuid(), 'CDOT Alcatel', 'NW42103', 'billing@cdot-alcatel.com', 'Network Materials', '29AABCC7890M1Z5', (SELECT id FROM companies LIMIT 1), true, NOW(), NOW()),
  (gen_random_uuid(), 'Sun TV Network Ltd', 'CN39790', 'finance@suntvnetwork.com', 'Content', '33AABCS4567M1Z5', (SELECT id FROM companies LIMIT 1), true, NOW(), NOW()),
  (gen_random_uuid(), 'Thrissur Cable Alliance', 'LC17743', 'billing@thrissur-cable.com', 'Commissions', '32AABCT9876M1Z5', (SELECT id FROM companies LIMIT 1), true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Add sample invoices with proper formatting
INSERT INTO invoices (
  id, reference_number, invoice_number, vendor_id, company_id,
  invoice_date, due_date, category, subtotal, tax_amount, total_amount,
  amount_paid, amount_due, currency, status, approval_status, payment_status,
  source, doa_level, age_in_days, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  'ASCL-AP-LCO-2610-00027',
  'LC/57158/2610',
  (SELECT id FROM vendors WHERE code = 'LC57158' LIMIT 1),
  (SELECT id FROM "Company" LIMIT 1),
  '2026-10-26'::date,
  '2026-11-25'::date,
  'Commissions',
  1521610,
  273290,
  1794900,
  0,
  1794900,
  'INR',
  'completeness_check',
  'pending_approval',
  'unpaid',
  'email',
  3,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE reference_number = 'ASCL-AP-LCO-2610-00027');

INSERT INTO invoices (
  id, reference_number, invoice_number, vendor_id, company_id,
  invoice_date, due_date, category, subtotal, tax_amount, total_amount,
  amount_paid, amount_due, currency, status, approval_status, payment_status,
  source, doa_level, age_in_days, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  'ASCL-AP-PRU-2610-00031',
  'PR/99604/2610',
  (SELECT id FROM vendors WHERE code = 'PR99604' LIMIT 1),
  (SELECT id FROM "Company" LIMIT 1),
  '2026-10-26'::date,
  '2026-11-25'::date,
  'Pole/Utilities',
  92373,
  16627,
  109000,
  0,
  109000,
  'INR',
  'completeness_check',
  'pending_approval',
  'unpaid',
  'email',
  2,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE reference_number = 'ASCL-AP-PRU-2610-00031');

INSERT INTO invoices (
  id, reference_number, invoice_number, vendor_id, company_id,
  invoice_date, due_date, category, subtotal, tax_amount, total_amount,
  amount_paid, amount_due, currency, status, approval_status, payment_status,
  source, doa_level, age_in_days, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  'ASCL-AP-NWM-2610-00020',
  'NW/42103/2610',
  (SELECT id FROM vendors WHERE code = 'NW42103' LIMIT 1),
  (SELECT id FROM "Company" LIMIT 1),
  '2026-10-26'::date,
  '2026-11-25'::date,
  'Network Materials',
  1420339,
  255661,
  1676000,
  0,
  1676000,
  'INR',
  'completeness_check',
  'pending_approval',
  'unpaid',
  'email',
  3,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE reference_number = 'ASCL-AP-NWM-2610-00020');

INSERT INTO invoices (
  id, reference_number, invoice_number, vendor_id, company_id,
  invoice_date, due_date, category, subtotal, tax_amount, total_amount,
  amount_paid, amount_due, currency, status, approval_status, payment_status,
  source, doa_level, age_in_days, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  'ASCL-AP-CNT-2610-00021',
  'CN/39790/2610',
  (SELECT id FROM vendors WHERE code = 'CN39790' LIMIT 1),
  (SELECT id FROM "Company" LIMIT 1),
  '2026-10-26'::date,
  '2026-11-25'::date,
  'Content',
  19689831,
  3544170,
  23300000,
  0,
  23300000,
  'INR',
  'completeness_check',
  'pending_approval',
  'unpaid',
  'email',
  5,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE reference_number = 'ASCL-AP-CNT-2610-00021');

INSERT INTO invoices (
  id, reference_number, invoice_number, vendor_id, company_id,
  invoice_date, due_date, category, subtotal, tax_amount, total_amount,
  amount_paid, amount_due, currency, status, approval_status, payment_status,
  source, doa_level, age_in_days, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  'ASCL-AP-LCO-2610-00026',
  'LC/17743/2610',
  (SELECT id FROM vendors WHERE code = 'LC17743' LIMIT 1),
  (SELECT id FROM "Company" LIMIT 1),
  '2026-10-26'::date,
  '2026-11-25'::date,
  'Commissions',
  185593,
  33407,
  219000,
  0,
  219000,
  'INR',
  'completeness_check',
  'pending_approval',
  'unpaid',
  'email',
  2,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE reference_number = 'ASCL-AP-LCO-2610-00026');
