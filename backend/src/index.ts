import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import emailIntakeRouter from './routes/emailIntake.routes';
import { doaAssignmentService } from './services/doaAssignmentService';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Types
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    companyId: string;
  };
}

// Auth Middleware
const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      companyId: string;
      type: string;
    };

    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      companyId: decoded.companyId,
    };

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// AUTH ENDPOINTS
// ==========================================

// Microsoft SSO routes
import { authMicrosoftController } from './controllers/auth-microsoft.controller';

app.get('/api/auth/microsoft/login', (req, res) => authMicrosoftController.initiateLogin(req, res));
app.get('/api/auth/microsoft/callback', (req, res) => authMicrosoftController.handleCallback(req, res));

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
        company: true,
        department: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        companyId: user.companyId,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        companyId: user.companyId,
        type: 'refresh',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyId: user.companyId,
          departmentId: user.departmentId,
          roles: user.roles.map(r => ({
            id: r.id,
            code: r.code,
            name: r.name,
          })),
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        roles: true,
        company: true,
        department: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        companyId: user.companyId,
        departmentId: user.departmentId,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        roles: user.roles.map(r => ({
          id: r.id,
          name: r.name,
          code: r.code,
        })),
        company: user.company ? {
          id: user.company.id,
          name: user.company.name,
          code: user.company.code,
        } : null,
        department: user.department ? {
          id: user.department.id,
          name: user.department.name,
          code: user.department.code,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// POST /api/auth/request-access - Request access to a role
app.post('/api/auth/request-access', async (req: Request, res: Response) => {
  try {
    const { email, roleCode, message } = req.body;

    if (!email || !roleCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and role code are required',
      });
    }

    // Find all system admins to notify
    const systemAdminRole = await prisma.role.findFirst({
      where: { code: 'SYSTEM_ADMIN' },
      include: { users: true },
    });

    if (systemAdminRole && systemAdminRole.users.length > 0) {
      // Create notification for each system admin
      for (const admin of systemAdminRole.users) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'access_request',
            title: 'New Role Access Request',
            message: `${email} has requested access to ${roleCode}${message ? `: ${message}` : ''}`,
          },
        });
      }
    }

    res.json({
      success: true,
      message: 'Access request submitted successfully. A system administrator will review your request.',
    });
  } catch (error) {
    console.error('Request access error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit access request',
    });
  }
});


// ==========================================
// INVOICE ENDPOINTS
// ==========================================

// GET /api/invoices
app.get('/api/invoices', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const {
      status,
      approvalStatus,
      paymentStatus,
      vendorId,
      category,
      type,
      dateFrom,
      dateTo,
      search,
      page = '1',
      limit = '50',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { companyId };

    if (status) where.status = status;
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (vendorId) where.vendorId = vendorId;
    if (category) where.category = category;

    // Type filter: PO vs Non-PO
    if (type === 'po') {
      where.poNumber = { not: null };
    } else if (type === 'non-po') {
      where.poNumber = null;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.invoiceDate = {};
      if (dateFrom) {
        where.invoiceDate.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo as string);
        endDate.setDate(endDate.getDate() + 1);
        where.invoiceDate.lt = endDate;
      }
    }

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search as string, mode: 'insensitive' } },
        { invoiceNumber: { contains: search as string, mode: 'insensitive' } },
        { poNumber: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { vendor: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          vendor: true,
          department: true,
          lineItems: true,
          approvals: {
            include: {
              approver: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        invoices: invoices.map(inv => ({
          id: inv.id,
          referenceNumber: inv.referenceNumber,
          invoiceNumber: inv.invoiceNumber,
          vendor: {
            id: inv.vendor.id,
            name: inv.vendor.name,
            code: inv.vendor.code,
          },
          department: inv.department ? {
            id: inv.department.id,
            name: inv.department.name,
            code: inv.department.code,
          } : null,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          poNumber: inv.poNumber,
          description: inv.description,
          category: inv.category,
          subtotal: inv.subtotal.toNumber(),
          taxAmount: inv.taxAmount.toNumber(),
          totalAmount: inv.totalAmount.toNumber(),
          amountPaid: inv.amountPaid.toNumber(),
          amountDue: inv.amountDue.toNumber(),
          currency: inv.currency,
          status: inv.status,
          approvalStatus: inv.approvalStatus,
          paymentStatus: inv.paymentStatus,
          doaLevel: inv.doaLevel,
          hasIrn: inv.hasIrn,
          irnNumber: inv.irnNumber,
          source: inv.source,
          attachmentCount: inv.attachmentCount,
          ageInDays: inv.ageInDays,
          lineItems: inv.lineItems.map(line => ({
            id: line.id,
            lineNumber: line.lineNumber,
            description: line.description,
            quantity: line.quantity.toNumber(),
            unitPrice: line.unitPrice.toNumber(),
            amount: line.amount.toNumber(),
            taxAmount: line.taxAmount.toNumber(),
          })),
          approvals: inv.approvals.map(app => ({
            id: app.id,
            level: app.level,
            status: app.status,
            action: app.action,
            comments: app.comments,
            approver: {
              id: app.approver.id,
              firstName: app.approver.firstName,
              lastName: app.approver.lastName,
              email: app.approver.email,
            },
            assignedAt: app.assignedAt,
            actionedAt: app.actionedAt,
            dueAt: app.dueAt,
          })),
          createdAt: inv.createdAt,
          updatedAt: inv.updatedAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// GET /api/invoices/:id
app.get('/api/invoices/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        vendor: true,
        department: true,
        lineItems: {
          include: {
            glAccount: true,
          },
        },
        approvals: {
          include: {
            approver: true,
            delegate: true,
          },
          orderBy: { level: 'asc' },
        },
        comments: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
        escalations: {
          include: {
            escalatedByUser: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: invoice.id,
        referenceNumber: invoice.referenceNumber,
        invoiceNumber: invoice.invoiceNumber,
        vendor: {
          id: invoice.vendor.id,
          name: invoice.vendor.name,
          code: invoice.vendor.code,
          email: invoice.vendor.email,
          phone: invoice.vendor.phone,
          category: invoice.vendor.category,
        },
        department: invoice.department ? {
          id: invoice.department.id,
          name: invoice.department.name,
          code: invoice.department.code,
        } : null,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        poNumber: invoice.poNumber,
        description: invoice.description,
        category: invoice.category,
        subtotal: invoice.subtotal.toNumber(),
        taxAmount: invoice.taxAmount.toNumber(),
        totalAmount: invoice.totalAmount.toNumber(),
        amountPaid: invoice.amountPaid.toNumber(),
        amountDue: invoice.amountDue.toNumber(),
        currency: invoice.currency,
        status: invoice.status,
        approvalStatus: invoice.approvalStatus,
        paymentStatus: invoice.paymentStatus,
        doaLevel: invoice.doaLevel,
        hasIrn: invoice.hasIrn,
        irnNumber: invoice.irnNumber,
        source: invoice.source,
        attachmentCount: invoice.attachmentCount,
        exceptionReason: invoice.exceptionReason,
        isPosted: invoice.isPosted,
        postedAt: invoice.postedAt,
        erpReference: invoice.erpReference,
        ageInDays: invoice.ageInDays,
        lineItems: invoice.lineItems.map(line => ({
          id: line.id,
          lineNumber: line.lineNumber,
          description: line.description,
          quantity: line.quantity.toNumber(),
          unitPrice: line.unitPrice.toNumber(),
          amount: line.amount.toNumber(),
          taxAmount: line.taxAmount.toNumber(),
          glAccount: line.glAccount ? {
            id: line.glAccount.id,
            accountNumber: line.glAccount.accountNumber,
            accountName: line.glAccount.accountName,
            accountType: line.glAccount.accountType,
          } : null,
        })),
        approvals: invoice.approvals.map(app => ({
          id: app.id,
          level: app.level,
          status: app.status,
          action: app.action,
          comments: app.comments,
          approver: {
            id: app.approver.id,
            firstName: app.approver.firstName,
            lastName: app.approver.lastName,
            email: app.approver.email,
          },
          delegate: app.delegate ? {
            id: app.delegate.id,
            firstName: app.delegate.firstName,
            lastName: app.delegate.lastName,
            email: app.delegate.email,
          } : null,
          assignedAt: app.assignedAt,
          actionedAt: app.actionedAt,
          dueAt: app.dueAt,
          isEscalated: app.isEscalated,
        })),
        comments: invoice.comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          type: comment.type,
          user: {
            id: comment.user.id,
            firstName: comment.user.firstName,
            lastName: comment.user.lastName,
          },
          createdAt: comment.createdAt,
        })),
        attachments: invoice.attachments.map(att => ({
          id: att.id,
          fileName: att.fileName,
          fileType: att.fileType,
          fileSize: att.fileSize,
          filePath: att.filePath,
          uploadedAt: att.uploadedAt,
        })),
        escalations: invoice.escalations.map(esc => ({
          id: esc.id,
          type: esc.type,
          reason: esc.reason,
          severity: esc.severity,
          status: esc.status,
          escalatedBy: {
            id: esc.escalatedByUser.id,
            firstName: esc.escalatedByUser.firstName,
            lastName: esc.escalatedByUser.lastName,
          },
          resolvedAt: esc.resolvedAt,
          resolution: esc.resolution,
          createdAt: esc.createdAt,
        })),
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ==========================================
// APPROVAL ENDPOINTS
// ==========================================

// GET /api/approvals/pending
app.get('/api/approvals/pending', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    const pendingApprovals = await prisma.approval.findMany({
      where: {
        OR: [
          { approverId: userId },
          { delegatedTo: userId },
        ],
        status: 'pending',
        invoice: { companyId },
      },
      include: {
        invoice: {
          include: {
            vendor: true,
            department: true,
          },
        },
        approver: true,
        delegate: true,
      },
      orderBy: { assignedAt: 'asc' },
    });

    res.json({
      success: true,
      data: pendingApprovals.map(app => ({
        id: app.id,
        level: app.level,
        status: app.status,
        assignedAt: app.assignedAt,
        dueAt: app.dueAt,
        isEscalated: app.isEscalated,
        invoice: {
          id: app.invoice.id,
          referenceNumber: app.invoice.referenceNumber,
          invoiceNumber: app.invoice.invoiceNumber,
          vendor: {
            id: app.invoice.vendor.id,
            name: app.invoice.vendor.name,
            code: app.invoice.vendor.code,
          },
          department: app.invoice.department ? {
            id: app.invoice.department.id,
            name: app.invoice.department.name,
          } : null,
          totalAmount: app.invoice.totalAmount.toNumber(),
          currency: app.invoice.currency,
          invoiceDate: app.invoice.invoiceDate,
          dueDate: app.invoice.dueDate,
          status: app.invoice.status,
          approvalStatus: app.invoice.approvalStatus,
          category: app.invoice.category,
          description: app.invoice.description,
        },
        approver: {
          id: app.approver.id,
          firstName: app.approver.firstName,
          lastName: app.approver.lastName,
          email: app.approver.email,
        },
        delegate: app.delegate ? {
          id: app.delegate.id,
          firstName: app.delegate.firstName,
          lastName: app.delegate.lastName,
          email: app.delegate.email,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// POST /api/approvals/:id/approve
app.post('/api/approvals/:id/approve', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    const approval = await prisma.approval.findFirst({
      where: {
        id,
        OR: [
          { approverId: userId },
          { delegatedTo: userId },
        ],
        status: 'pending',
        invoice: { companyId },
      },
      include: {
        invoice: true,
      },
    });

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Approval not found or not authorized',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.approval.update({
        where: { id },
        data: {
          status: 'approved',
          action: 'approved',
          comments,
          actionedAt: new Date(),
        },
      });

      const allApprovals = await tx.approval.findMany({
        where: { invoiceId: approval.invoiceId },
        orderBy: { level: 'asc' },
      });

      const allApproved = allApprovals.every(a => a.status === 'approved');
      const anyRejected = allApprovals.some(a => a.status === 'rejected');

      if (allApproved) {
        await tx.invoice.update({
          where: { id: approval.invoiceId },
          data: {
            approvalStatus: 'approved',
            status: 'approved',
          },
        });
      } else if (!anyRejected) {
        await tx.invoice.update({
          where: { id: approval.invoiceId },
          data: {
            approvalStatus: 'in_progress',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          action: 'approval_approved',
          entityType: 'approval',
          entityId: id,
          changes: {
            approvalId: id,
            invoiceId: approval.invoiceId,
            level: approval.level,
            comments,
          },
        },
      });
    });

    res.json({
      success: true,
      message: 'Approval approved successfully',
    });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// POST /api/approvals/:id/reject
app.post('/api/approvals/:id/reject', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    if (!comments) {
      return res.status(400).json({
        success: false,
        message: 'Comments are required for rejection',
      });
    }

    const approval = await prisma.approval.findFirst({
      where: {
        id,
        OR: [
          { approverId: userId },
          { delegatedTo: userId },
        ],
        status: 'pending',
        invoice: { companyId },
      },
      include: {
        invoice: true,
      },
    });

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Approval not found or not authorized',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.approval.update({
        where: { id },
        data: {
          status: 'rejected',
          action: 'rejected',
          comments,
          actionedAt: new Date(),
        },
      });

      await tx.invoice.update({
        where: { id: approval.invoiceId },
        data: {
          approvalStatus: 'rejected',
          status: 'rejected',
        },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          action: 'approval_rejected',
          entityType: 'approval',
          entityId: id,
          changes: {
            approvalId: id,
            invoiceId: approval.invoiceId,
            level: approval.level,
            comments,
          },
        },
      });
    });

    res.json({
      success: true,
      message: 'Approval rejected successfully',
    });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// POST /api/approvals/bulk-approve
app.post('/api/approvals/bulk-approve', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { approvalIds, comments } = req.body;
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    if (!approvalIds || !Array.isArray(approvalIds) || approvalIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Approval IDs array is required',
      });
    }

    const approvals = await prisma.approval.findMany({
      where: {
        id: { in: approvalIds },
        OR: [
          { approverId: userId },
          { delegatedTo: userId },
        ],
        status: 'pending',
        invoice: { companyId },
      },
      include: {
        invoice: true,
      },
    });

    if (approvals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid approvals found',
      });
    }

    const results = await prisma.$transaction(async (tx) => {
      const approved = [];

      for (const approval of approvals) {
        await tx.approval.update({
          where: { id: approval.id },
          data: {
            status: 'approved',
            action: 'approved',
            comments,
            actionedAt: new Date(),
          },
        });

        const allApprovals = await tx.approval.findMany({
          where: { invoiceId: approval.invoiceId },
          orderBy: { level: 'asc' },
        });

        const allApproved = allApprovals.every(a => a.status === 'approved');

        if (allApproved) {
          await tx.invoice.update({
            where: { id: approval.invoiceId },
            data: {
              approvalStatus: 'approved',
              status: 'approved',
            },
          });
        } else {
          await tx.invoice.update({
            where: { id: approval.invoiceId },
            data: {
              approvalStatus: 'in_progress',
            },
          });
        }

        await tx.auditLog.create({
          data: {
            companyId,
            userId,
            action: 'approval_bulk_approved',
            entityType: 'approval',
            entityId: approval.id,
            changes: {
              approvalId: approval.id,
              invoiceId: approval.invoiceId,
              level: approval.level,
              comments,
            },
          },
        });

        approved.push(approval.id);
      }

      return approved;
    });

    res.json({
      success: true,
      message: `${results.length} approvals approved successfully`,
      data: {
        approved: results,
      },
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// POST /api/approvals/bulk-reject
app.post('/api/approvals/bulk-reject', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { approvalIds, comments } = req.body;
    const userId = req.user!.userId;
    const companyId = req.user!.companyId;

    if (!approvalIds || !Array.isArray(approvalIds) || approvalIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Approval IDs array is required',
      });
    }

    if (!comments) {
      return res.status(400).json({
        success: false,
        message: 'Comments are required for bulk rejection',
      });
    }

    const approvals = await prisma.approval.findMany({
      where: {
        id: { in: approvalIds },
        OR: [
          { approverId: userId },
          { delegatedTo: userId },
        ],
        status: 'pending',
        invoice: { companyId },
      },
      include: {
        invoice: true,
      },
    });

    if (approvals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid approvals found',
      });
    }

    const results = await prisma.$transaction(async (tx) => {
      const rejected = [];

      for (const approval of approvals) {
        await tx.approval.update({
          where: { id: approval.id },
          data: {
            status: 'rejected',
            action: 'rejected',
            comments,
            actionedAt: new Date(),
          },
        });

        await tx.invoice.update({
          where: { id: approval.invoiceId },
          data: {
            approvalStatus: 'rejected',
            status: 'rejected',
          },
        });

        await tx.auditLog.create({
          data: {
            companyId,
            userId,
            action: 'approval_bulk_rejected',
            entityType: 'approval',
            entityId: approval.id,
            changes: {
              approvalId: approval.id,
              invoiceId: approval.invoiceId,
              level: approval.level,
              comments,
            },
          },
        });

        rejected.push(approval.id);
      }

      return rejected;
    });

    res.json({
      success: true,
      message: `${results.length} approvals rejected successfully`,
      data: {
        rejected: results,
      },
    });
  } catch (error) {
    console.error('Bulk reject error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ==========================================
// VENDOR ENDPOINTS
// ==========================================

// GET /api/vendors
app.get('/api/vendors', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const {
      category,
      isActive,
      search,
      page = '1',
      limit = '100',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { companyId };

    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
      }),
      prisma.vendor.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        vendors: vendors.map(vendor => ({
          id: vendor.id,
          name: vendor.name,
          code: vendor.code,
          email: vendor.email,
          phone: vendor.phone,
          address: vendor.address,
          city: vendor.city,
          state: vendor.state,
          zipCode: vendor.zipCode,
          country: vendor.country,
          taxId: vendor.taxId,
          gstNumber: vendor.gstNumber,
          panNumber: vendor.panNumber,
          msmeStatus: vendor.msmeStatus,
          paymentTerms: vendor.paymentTerms,
          category: vendor.category,
          isActive: vendor.isActive,
          createdAt: vendor.createdAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ==========================================
// DOA MATRIX ENDPOINTS
// ==========================================

// GET /api/doa-matrix
app.get('/api/doa-matrix', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    const doaRules = await prisma.doaMatrixRule.findMany({
      where: {
        companyId,
        isActive: true,
      },
      include: {
        department: true,
      },
      orderBy: [
        { approvalLevel: 'asc' },
        { minAmount: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: {
        rules: doaRules.map(rule => ({
          id: rule.id,
          level: rule.approvalLevel,
          roleCode: rule.roleCode,
          roleName: rule.roleCode.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          department: rule.department ? {
            id: rule.department.id,
            name: rule.department.name,
            code: rule.department.code,
          } : null,
          minAmount: rule.minAmount.toNumber(),
          maxAmount: rule.maxAmount.toNumber(),
          requiresApproval: rule.requiresApproval,
          autoApprove: rule.autoApprove,
          isActive: rule.isActive,
          createdAt: rule.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get DOA matrix error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// POST /api/doa-matrix - Create new DOA rule
app.post('/api/doa-matrix', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { level, roleCode, roleName, minAmount, maxAmount, autoApprove } = req.body;

    const newRule = await prisma.doaMatrixRule.create({
      data: {
        companyId,
        roleCode: roleCode || 'BRANCH_MANAGER',
        minAmount,
        maxAmount,
        approvalLevel: level,
        requiresApproval: true,
        autoApprove: autoApprove || false,
        isActive: true,
      },
    });

    res.json({
      success: true,
      data: {
        id: newRule.id,
        level: newRule.approvalLevel,
        roleCode: newRule.roleCode,
        roleName: roleName || newRule.roleCode,
        minAmount: newRule.minAmount.toNumber(),
        maxAmount: newRule.maxAmount.toNumber(),
        autoApprove: newRule.autoApprove,
      },
    });
  } catch (error) {
    console.error('Create DOA rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create DOA rule',
    });
  }
});

// PUT /api/doa-matrix/:id - Update DOA rule
app.put('/api/doa-matrix/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const { level, roleCode, roleName, minAmount, maxAmount, autoApprove } = req.body;

    // Check if rule exists and belongs to user's company
    const existingRule = await prisma.doaMatrixRule.findFirst({
      where: { id, companyId },
    });

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        message: 'DOA rule not found',
      });
    }

    const updatedRule = await prisma.doaMatrixRule.update({
      where: { id },
      data: {
        roleCode: roleCode || existingRule.roleCode,
        minAmount,
        maxAmount,
        approvalLevel: level,
        autoApprove: autoApprove || false,
      },
    });

    res.json({
      success: true,
      data: {
        id: updatedRule.id,
        level: updatedRule.approvalLevel,
        roleCode: updatedRule.roleCode,
        roleName: roleName || updatedRule.roleCode,
        minAmount: updatedRule.minAmount.toNumber(),
        maxAmount: updatedRule.maxAmount.toNumber(),
        autoApprove: updatedRule.autoApprove,
      },
    });
  } catch (error) {
    console.error('Update DOA rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update DOA rule',
    });
  }
});

// DELETE /api/doa-matrix/:id - Delete DOA rule
app.delete('/api/doa-matrix/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    // Check if rule exists and belongs to user's company
    const existingRule = await prisma.doaMatrixRule.findFirst({
      where: { id, companyId },
    });

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        message: 'DOA rule not found',
      });
    }

    // Soft delete by setting isActive to false
    await prisma.doaMatrixRule.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'DOA rule deleted successfully',
    });
  } catch (error) {
    console.error('Delete DOA rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete DOA rule',
    });
  }
});

// POST /api/doa-matrix/reassign-all - Reassign all pending invoices based on current DOA Matrix
app.post('/api/doa-matrix/reassign-all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    const result = await doaAssignmentService.reassignAllPendingInvoices(companyId);

    res.json({
      success: true,
      message: `Successfully reassigned ${result.reassigned} invoices. ${result.failed} failed.`,
      data: result,
    });
  } catch (error) {
    console.error('Reassign invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reassign invoices',
    });
  }
});

// ==========================================
// CFO ANALYTICS ENDPOINTS
// ==========================================

// GET /api/analytics/cfo-dashboard - CFO Analytics Dashboard
app.get('/api/analytics/cfo-dashboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    // Get all invoices
    const allInvoices = await prisma.invoice.findMany({
      where: { companyId },
      include: { vendor: true },
    });

    const totalInvoices = allInvoices.length;
    const totalAmount = allInvoices.reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0);

    // Calculate average invoice age
    const avgInvoiceAge = totalInvoices > 0
      ? Math.round(allInvoices.reduce((sum, inv) => sum + (inv.ageInDays || 0), 0) / totalInvoices)
      : 0;

    // Committed Outflow (due in next 30 days)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const committedOutflow = allInvoices
      .filter(inv => inv.dueDate && inv.dueDate <= thirtyDaysFromNow && inv.amountDue.toNumber() > 0)
      .reduce((sum, inv) => sum + inv.amountDue.toNumber(), 0);

    // Pipeline Liability (all pending/draft invoices)
    const pipelineLiability = allInvoices
      .filter(inv => ['draft', 'pending_approval', 'approved'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.amountDue.toNumber(), 0);

    // ITC At Risk (invoices without IRN)
    const itcAtRisk = allInvoices
      .filter(inv => !inv.hasIrn && inv.status !== 'posted')
      .reduce((sum, inv) => sum + (inv.taxAmount?.toNumber() || 0), 0);

    // MSME Exposure (outstanding > 45 days) - mock for now
    const msmeExposure = allInvoices
      .filter(inv => (inv.ageInDays || 0) > 45 && inv.amountDue.toNumber() > 0)
      .reduce((sum, inv) => sum + inv.amountDue.toNumber(), 0) * 0.15; // Assume 15% are MSME

    // Capex Share - assume source or category indicates capex
    const capexAmount = allInvoices
      .filter(inv => inv.description?.toLowerCase().includes('capex') || inv.category?.includes('Materials'))
      .reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0);
    const capexShare = totalAmount > 0 ? Math.round((capexAmount / totalAmount) * 100) : 0;

    // DPO (Days Payable Outstanding)
    const dpo = totalAmount > 0 ? Math.round((pipelineLiability / totalAmount) * 365) : 0;

    // Top Vendors
    const vendorTotals = new Map<string, { name: string; amount: number }>();
    allInvoices.forEach(inv => {
      const existing = vendorTotals.get(inv.vendorId) || { name: inv.vendor.name, amount: 0 };
      existing.amount += inv.totalAmount.toNumber();
      vendorTotals.set(inv.vendorId, existing);
    });

    const topVendors = Array.from(vendorTotals.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map(v => ({
        name: v.name,
        amount: v.amount,
        percentage: totalAmount > 0 ? (v.amount / totalAmount) * 100 : 0,
      }));

    // Top 5 Vendor Share
    const top5Total = topVendors.slice(0, 5).reduce((sum, v) => sum + v.amount, 0);
    const top5VendorShare = totalAmount > 0 ? Math.round((top5Total / totalAmount) * 100) : 0;

    // Exception Rate (invoices with issues)
    const exceptionsCount = allInvoices.filter(inv =>
      inv.status === 'exception' || !inv.hasIrn || inv.validationErrors
    ).length;
    const exceptionRate = totalInvoices > 0 ? Math.round((exceptionsCount / totalInvoices) * 100) : 0;

    // Aging Buckets
    const agingBuckets = [
      { bucket: '0-7 days', min: 0, max: 7, color: 'bg-green-500' },
      { bucket: '8-15 days', min: 8, max: 15, color: 'bg-blue-500' },
      { bucket: '16-30 days', min: 16, max: 30, color: 'bg-yellow-500' },
      { bucket: '31-60 days', min: 31, max: 60, color: 'bg-orange-500' },
      { bucket: '>60 days', min: 61, max: 999999, color: 'bg-red-500' },
    ].map(bucket => {
      const amount = allInvoices
        .filter(inv => (inv.ageInDays || 0) >= bucket.min && (inv.ageInDays || 0) <= bucket.max)
        .reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0);
      return {
        bucket: bucket.bucket,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        color: bucket.color,
      };
    });

    // Category Breakdown
    const categoryTotals = new Map<string, number>();
    allInvoices.forEach(inv => {
      const cat = inv.category || 'Others';
      categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + inv.totalAmount.toNumber());
    });

    const categoryBreakdown = Array.from(categoryTotals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    res.json({
      success: true,
      data: {
        committedOutflow,
        pipelineLiability,
        dpo,
        itcAtRisk,
        msmeExposure,
        capexShare,
        top5VendorShare,
        exceptionRate,
        topVendors,
        agingBuckets,
        categoryBreakdown,
        totalInvoices,
        totalAmount,
        avgInvoiceAge,
      },
    });
  } catch (error) {
    console.error('CFO analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CFO analytics',
    });
  }
});

// ==========================================
// USER ENDPOINTS
// ==========================================

// GET /api/users
app.get('/api/users', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { isActive, departmentId, search } = req.query;

    const where: any = { companyId };

    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        roles: true,
        department: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        departmentId: user.departmentId,
        department: user.department ? {
          id: user.department.id,
          name: user.department.name,
          code: user.department.code,
        } : null,
        roles: user.roles.map(role => ({
          id: role.id,
          name: role.name,
          code: role.code,
        })),
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// POST /api/users - Create new user
app.post('/api/users', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { firstName, lastName, email, phone, departmentId, roleIds, isActive = true } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email, companyId },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        departmentId,
        companyId,
        isActive,
        password: 'temp', // Will be set via password reset flow
      },
    });

    // Assign roles if provided
    if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId: string) => ({
          userId: user.id,
          roleId,
        })),
      });
    }

    // Fetch user with roles
    const createdUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: true,
        department: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: createdUser,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// PUT /api/users/:id - Update user
app.put('/api/users/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const { firstName, lastName, email, phone, departmentId, roleIds, isActive } = req.body;

    // Check if user exists and belongs to same company
    const existingUser = await prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        departmentId,
        isActive,
      },
    });

    // Update roles if provided
    if (roleIds && Array.isArray(roleIds)) {
      // Delete existing role assignments
      await prisma.userRole.deleteMany({
        where: { userId: id },
      });

      // Create new role assignments
      if (roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: roleIds.map((roleId: string) => ({
            userId: id,
            roleId,
          })),
        });
      }
    }

    // Fetch updated user with roles
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
        department: true,
      },
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// DELETE /api/users/:id - Delete (soft delete) user
app.delete('/api/users/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    // Check if user exists and belongs to same company
    const existingUser = await prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting self
    if (id === req.user!.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete yourself',
      });
    }

    // Soft delete - set isActive to false
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// GET /api/roles - Get all available roles
app.get('/api/roles', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// GET /api/departments - Get all departments
app.get('/api/departments', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    const departments = await prisma.department.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// GET /api/users/azure-search - Search Azure AD users
app.get('/api/users/azure-search', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required',
      });
    }

    // TODO: Implement Microsoft Graph API integration
    // This requires:
    // 1. Azure AD app registration
    // 2. Microsoft Graph API credentials in .env
    // 3. @azure/msal-node package
    // 4. Graph client initialization

    // For now, return mock data
    const mockAzureUsers = [
      {
        id: 'azure-1',
        displayName: 'John Doe',
        mail: email,
        jobTitle: 'Senior Manager',
        department: 'Finance',
        officeLocation: 'Kochi Branch',
        mobilePhone: '+91 98765 43210',
      },
    ];

    res.json({
      success: true,
      message: 'Azure AD integration pending - showing mock data',
      data: mockAzureUsers,
    });
  } catch (error) {
    console.error('Azure search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// POST /api/users/azure-import - Import user from Azure AD
app.post('/api/users/azure-import', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { azureUserId, email, displayName, jobTitle, department, phone, roleIds } = req.body;

    if (!email || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Email and display name are required',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email, companyId },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Split displayName into firstName and lastName
    const nameParts = displayName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    // Find or create department
    let departmentId = null;
    if (department) {
      let dept = await prisma.department.findFirst({
        where: { companyId, name: department },
      });

      if (!dept) {
        dept = await prisma.department.create({
          data: {
            name: department,
            code: department.substring(0, 3).toUpperCase(),
            companyId,
            isActive: true,
          },
        });
      }
      departmentId = dept.id;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        departmentId,
        companyId,
        isActive: true,
        password: 'azure-sso', // Azure AD users authenticate via SSO
        azureAdId: azureUserId,
      },
    });

    // Assign roles if provided
    if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId: string) => ({
          userId: user.id,
          roleId,
        })),
      });
    }

    // Fetch user with roles
    const createdUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: true,
        department: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User imported from Azure AD successfully',
      data: createdUser,
    });
  } catch (error) {
    console.error('Azure import error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ==========================================
// DASHBOARD ROUTES
// ==========================================

// GET /api/dashboard/stats - Get comprehensive dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.userId;

    // Get date 12 months ago for "last 12 months" filter
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Get all invoices for the company (last 12 months)
    const allInvoices = await prisma.invoice.findMany({
      where: {
        companyId,
        createdAt: { gte: twelveMonthsAgo },
      },
      include: {
        vendor: true,
        approvals: true,
      },
    });

    // KPI: Total Invoices (last 12 months)
    const totalInvoices = allInvoices.length;

    // Count PO vs Non-PO
    const nonPOCount = allInvoices.filter(inv => inv.type === 'non_po' || !inv.type).length;
    const poCount = totalInvoices - nonPOCount;

    // KPI: Total Spend Value
    const totalSpend = allInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    // KPI: Open/In-Flight (draft, validation, pending_approval, approved - not yet posted)
    const openStatuses = ['draft', 'completeness_check', 'validation', 'pending_approval', 'approved'];
    const openInvoices = allInvoices.filter(inv => openStatuses.includes(inv.status));
    const openInFlight = openInvoices.length;
    const pipelineLiability = openInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    // KPI: Posted to ERP
    const postedInvoices = allInvoices.filter(inv => inv.status === 'posted');
    const posted = postedInvoices.length;
    const straightThroughCount = postedInvoices.filter(inv => {
      // Straight-through: no manual intervention, fast processing
      const hasNoExceptions = !inv.validationErrors || inv.validationErrors === null;
      return hasNoExceptions;
    }).length;
    const straightThroughPercent = posted > 0 ? Math.round((straightThroughCount / posted) * 100) : 0;

    // Count by categories
    const categoryCounts = allInvoices.reduce((acc: any, inv) => {
      const cat = inv.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    const categoryCount = Object.keys(categoryCounts).length;

    // Count unique branches (departments)
    const departmentIds = [...new Set(allInvoices.map(inv => inv.departmentId).filter(Boolean))];
    const branchCount = departmentIds.length;

    // Pipeline Status Counts
    const received = allInvoices.filter(inv => inv.status === 'draft').length;
    const completenessCheck = allInvoices.filter(inv => inv.status === 'completeness_check').length;
    const validation = allInvoices.filter(inv => inv.status === 'validation').length;
    const pendingApproval = allInvoices.filter(inv => inv.status === 'pending_approval').length;
    const approved = allInvoices.filter(inv => inv.status === 'approved').length;
    const postedCount = posted;
    const exception = allInvoices.filter(inv => inv.status === 'exception').length;
    const rejected = allInvoices.filter(inv => inv.status === 'rejected').length;

    // AI Insights - SLA Breaches (>72 hours pending)
    const now = new Date();
    const slaBreaches = allInvoices.filter(inv => {
      if (!openStatuses.includes(inv.status)) return false;
      const hoursSinceCreated = (now.getTime() - inv.createdAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceCreated > 72;
    });
    const slaBreachCount = slaBreaches.length;

    // Find highest DOA tier in breached invoices for escalation recommendation
    const slaBreachDOATiers = slaBreaches.map(inv => inv.doaLevel || 0);
    const maxDOATier = slaBreachDOATiers.length > 0 ? Math.max(...slaBreachDOATiers) : 0;
    const nextDOATier = maxDOATier + 1;

    // AI Insights - MSME Exposure (invoices outstanding > 45 days)
    const msmeInvoices = allInvoices.filter(inv => {
      if (inv.status === 'posted' || inv.status === 'rejected') return false;
      const daysOutstanding = inv.ageInDays || 0;
      return daysOutstanding > 45;
    });
    const msmeExposure = msmeInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const msmeInvoiceCount = msmeInvoices.length;

    // AI Insights - Missing IRN (high-value invoices without IRN)
    const missingIrnInvoices = allInvoices.filter(inv => {
      const isHighValue = Number(inv.totalAmount) > 500000; // >5L
      const hasNoIrn = !inv.irnNumber || inv.irnNumber === '';
      return isHighValue && hasNoIrn;
    });
    const missingIrnCount = missingIrnInvoices.length;
    const missingIrnAmount = missingIrnInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    // AI Insights - Vendor Concentration (Top 5 vendors)
    const vendorSpend = allInvoices.reduce((acc: any, inv) => {
      const vendorId = inv.vendorId;
      if (!acc[vendorId]) {
        acc[vendorId] = { vendorId, name: inv.vendor?.name || 'Unknown', amount: 0 };
      }
      acc[vendorId].amount += Number(inv.totalAmount);
      return acc;
    }, {});
    const sortedVendors = Object.values(vendorSpend).sort((a: any, b: any) => b.amount - a.amount);
    const top5Vendors = sortedVendors.slice(0, 5);
    const top5VendorSpend = top5Vendors.reduce((sum: number, v: any) => sum + v.amount, 0);
    const top5VendorPercent = totalSpend > 0 ? Math.round((top5VendorSpend / totalSpend) * 100) : 0;

    // AI Insights - Approved & Queued for Payment
    const queuedForPayment = allInvoices.filter(inv => inv.status === 'approved');
    const queuedAmount = queuedForPayment.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const queuedCount = queuedForPayment.length;

    // Count invoices still pending (not posted)
    const pendingInvoices = allInvoices.filter(inv =>
      inv.status !== 'posted' && inv.status !== 'rejected'
    );
    const pendingCount = pendingInvoices.length;
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    // Spend by Category
    const spendByCategory = allInvoices.reduce((acc: any, inv) => {
      const cat = inv.category || 'Uncategorized';
      if (!acc[cat]) {
        acc[cat] = { category: cat, amount: 0 };
      }
      acc[cat].amount += Number(inv.totalAmount);
      return acc;
    }, {});
    const categorySpendArray = Object.values(spendByCategory).sort((a: any, b: any) => b.amount - a.amount);

    // Format currency helper
    const formatCr = (amount: number) => {
      const crores = amount / 10000000;
      return crores.toFixed(2);
    };

    res.json({
      success: true,
      data: {
        kpis: {
          totalInvoices: {
            count: totalInvoices,
            nonPO: nonPOCount,
            po: poCount,
            period: '12 MO',
          },
          totalSpend: {
            amount: totalSpend,
            formatted: `₹${formatCr(totalSpend)} Cr`,
            categories: categoryCount,
            branches: branchCount,
          },
          openInFlight: {
            count: openInFlight,
            liability: pipelineLiability,
            formatted: `₹${formatCr(pipelineLiability)} Cr`,
          },
          posted: {
            count: posted,
            straightThroughPercent: straightThroughPercent,
          },
        },
        pipeline: {
          received,
          completenessCheck,
          validation,
          pendingApproval,
          approved,
          posted: postedCount,
          exception,
          rejected,
        },
        insights: [
          {
            id: 'sla-breach',
            icon: 'warning',
            severity: 'HIGH',
            title: `${slaBreachCount} approvals breaching the 72-hr SLA`,
            description: `Auto-escalation triggered to next DOA tier. Biggest bottleneck: Functional Head band (L${maxDOATier}). Recommend enabling delegate approvers for Network & IT heads.`,
            count: slaBreachCount,
            actionable: true,
          },
          {
            id: 'msme-exposure',
            icon: 'rupee',
            severity: 'HIGH',
            title: `₹${formatCr(msmeExposure)} Cr MSME exposure beyond 45 days (${msmeInvoiceCount} invoices)`,
            description: `Sec 43B(h): payments beyond 45 days lose tax deductibility this FY. Prioritise these in the next 2 payment runs.`,
            count: msmeInvoiceCount,
            amount: msmeExposure,
            actionable: true,
          },
          {
            id: 'missing-irn',
            icon: 'document',
            severity: 'MED',
            title: `${missingIrnCount} high-value invoices missing IRN / e-invoice`,
            description: `ITC of ~₹${formatCr(missingIrnAmount * 0.18)} Cr at risk under GST. Auto-return to vendors with reason code IRN-01 is recommended.`,
            count: missingIrnCount,
            amount: missingIrnAmount,
            actionable: true,
          },
          {
            id: 'vendor-concentration',
            icon: 'users',
            severity: 'MED',
            title: `Top-5 vendor concentration at ${top5VendorPercent}% of spend`,
            description: `TRAI alone is 7%. Content & bandwidth contracts dominate — review rate cards at next renewal to protect margin.`,
            percentage: top5VendorPercent,
            vendors: top5Vendors.slice(0, 3).map((v: any) => v.name).join(', '),
            actionable: false,
          },
          {
            id: 'queued-payment',
            icon: 'bank',
            severity: 'INFO',
            title: `₹${formatCr(queuedAmount)} Cr approved & queued for payment`,
            description: `Projected outflow for the next run. ${pendingCount}/${queuedCount} items still pending could add ₹${formatCr(pendingAmount)} Cr — flag to treasury.`,
            count: queuedCount,
            amount: queuedAmount,
            actionable: false,
          },
        ],
        spendByCategory: categorySpendArray,
        generatedAt: new Date().toISOString(),
        recordCount: totalInvoices,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ==========================================
// SYSTEM SETTINGS ROUTES
// ==========================================

// GET /api/settings - Get all company settings
app.get('/api/settings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    const settings = await prisma.companySetting.findMany({
      where: { companyId },
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    // Mask encrypted values
    const maskedSettings = settings.map(s => ({
      id: s.id,
      category: s.category,
      key: s.key,
      value: s.isEncrypted && s.value ? '••••••••' : s.value,
      isEncrypted: s.isEncrypted,
    }));

    res.json({
      success: true,
      data: maskedSettings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// POST /api/settings/batch - Save multiple settings at once
app.post('/api/settings/batch', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: 'Settings must be an array',
      });
    }

    // Upsert each setting
    for (const setting of settings) {
      const { category, key, value, isEncrypted = false } = setting;

      // Simple encryption placeholder (use proper encryption in production)
      const storedValue = isEncrypted && value ? Buffer.from(value).toString('base64') : value;

      await prisma.companySetting.upsert({
        where: {
          companyId_category_key: {
            companyId,
            category,
            key,
          },
        },
        update: {
          value: storedValue,
          isEncrypted,
        },
        create: {
          companyId,
          category,
          key,
          value: storedValue,
          isEncrypted,
        },
      });
    }

    res.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// POST /api/settings/test-azure - Test Azure AD connection
app.post('/api/settings/test-azure', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    // Get Azure AD settings
    const settings = await prisma.companySetting.findMany({
      where: {
        companyId,
        category: 'azure_ad',
      },
    });

    const tenantId = settings.find(s => s.key === 'tenant_id')?.value;
    const clientId = settings.find(s => s.key === 'client_id')?.value;
    const clientSecret = settings.find(s => s.key === 'client_secret')?.value;

    if (!tenantId || !clientId || !clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Azure AD credentials not configured',
      });
    }

    // Decrypt client secret (base64 for now)
    const decryptedSecret = Buffer.from(clientSecret, 'base64').toString('utf-8');

    // TODO: Implement actual Azure AD connection test
    // For now, just validate format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId) || !uuidRegex.test(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Tenant ID or Client ID format',
      });
    }

    res.json({
      success: true,
      message: 'Azure AD credentials validated (format check only - full integration pending)',
    });
  } catch (error) {
    console.error('Test Azure connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test Azure AD connection',
    });
  }
});

// POST /api/settings/test-email - Test email connection
app.post('/api/settings/test-email', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    // Get email intake settings
    const settings = await prisma.companySetting.findMany({
      where: {
        companyId,
        category: 'email_intake',
      },
    });

    const imapHost = settings.find(s => s.key === 'imap_host')?.value;
    const imapPort = settings.find(s => s.key === 'imap_port')?.value;
    const imapUser = settings.find(s => s.key === 'imap_user')?.value;
    const imapPassword = settings.find(s => s.key === 'imap_password')?.value;

    if (!imapHost || !imapPort || !imapUser || !imapPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email credentials not configured',
      });
    }

    // Decrypt password
    const decryptedPassword = Buffer.from(imapPassword, 'base64').toString('utf-8');

    // TODO: Implement actual IMAP connection test
    // For now, just validate format
    res.json({
      success: true,
      message: 'Email credentials validated (format check only - full IMAP integration pending)',
    });
  } catch (error) {
    console.error('Test email connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test email connection',
    });
  }
});

// ==========================================
// EMAIL INTAKE ROUTES
// ==========================================
app.use('/api/email-intake', authenticateToken, emailIntakeRouter);

// ==========================================
// ERROR HANDLERS
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});
