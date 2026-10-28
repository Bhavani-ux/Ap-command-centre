import { PrismaClient } from '@prisma/client';
import { DOAMatrixRuleDto } from '../dto/approval.dto';

const prisma = new PrismaClient();

export class DOAMatrixService {
  async getApplicableRules(
    companyId: string,
    amount: number,
    departmentId?: string,
    userId?: string
  ): Promise<DOAMatrixRuleDto[]> {
    const user = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          include: { roles: true },
        })
      : null;

    const whereClause: any = {
      companyId,
      minAmount: { lte: amount },
      maxAmount: { gte: amount },
      isActive: true,
    };

    if (departmentId) {
      whereClause.OR = [{ departmentId }, { departmentId: null }];
    }

    const rules = await prisma.doaMatrixRule.findMany({
      where: whereClause,
      orderBy: [{ approvalLevel: 'asc' }, { minAmount: 'asc' }],
    });

    const userRoles = user?.roles.map((r) => r.name) || [];

    return rules
      .filter((rule) => {
        if (!user) return true;
        return userRoles.includes(rule.role);
      })
      .map((rule) => ({
        id: rule.id,
        role: rule.role,
        departmentId: rule.departmentId || undefined,
        minAmount: Number(rule.minAmount),
        maxAmount: Number(rule.maxAmount),
        requiresApproval: rule.requiresApproval,
        approvalLevel: rule.approvalLevel,
        autoApprove: rule.autoApprove,
      }));
  }

  async determineApprovalLevels(
    companyId: string,
    amount: number,
    departmentId?: string
  ): Promise<number[]> {
    const rules = await this.getApplicableRules(companyId, amount, departmentId);

    const levels = [...new Set(rules.map((r) => r.approvalLevel))].sort((a, b) => a - b);

    return levels;
  }

  async canAutoApprove(
    companyId: string,
    amount: number,
    departmentId?: string,
    userId?: string
  ): Promise<boolean> {
    const rules = await this.getApplicableRules(companyId, amount, departmentId, userId);

    return rules.some((rule) => rule.autoApprove);
  }

  async getApproversForLevel(
    companyId: string,
    level: number,
    amount: number,
    departmentId?: string
  ): Promise<Array<{ id: string; name: string; email: string }>> {
    const rules = await this.getApplicableRules(companyId, amount, departmentId);

    const levelRules = rules.filter((r) => r.approvalLevel === level);

    if (levelRules.length === 0) {
      return [];
    }

    const roleNames = [...new Set(levelRules.map((r) => r.role))];

    const users = await prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        roles: {
          some: {
            name: { in: roleNames },
          },
        },
      },
      include: {
        roles: true,
      },
    });

    const filteredUsers = departmentId
      ? users.filter((user) => !user.departmentId || user.departmentId === departmentId)
      : users;

    return filteredUsers.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    }));
  }

  async createRule(companyId: string, rule: Omit<DOAMatrixRuleDto, 'id'>): Promise<DOAMatrixRuleDto> {
    const created = await prisma.doaMatrixRule.create({
      data: {
        companyId,
        role: rule.role,
        departmentId: rule.departmentId,
        minAmount: rule.minAmount,
        maxAmount: rule.maxAmount,
        requiresApproval: rule.requiresApproval,
        approvalLevel: rule.approvalLevel,
        autoApprove: rule.autoApprove,
        isActive: true,
      },
    });

    return {
      id: created.id,
      role: created.role,
      departmentId: created.departmentId || undefined,
      minAmount: Number(created.minAmount),
      maxAmount: Number(created.maxAmount),
      requiresApproval: created.requiresApproval,
      approvalLevel: created.approvalLevel,
      autoApprove: created.autoApprove,
    };
  }

  async updateRule(ruleId: string, updates: Partial<DOAMatrixRuleDto>): Promise<DOAMatrixRuleDto> {
    const updated = await prisma.doaMatrixRule.update({
      where: { id: ruleId },
      data: {
        role: updates.role,
        departmentId: updates.departmentId,
        minAmount: updates.minAmount,
        maxAmount: updates.maxAmount,
        requiresApproval: updates.requiresApproval,
        approvalLevel: updates.approvalLevel,
        autoApprove: updates.autoApprove,
      },
    });

    return {
      id: updated.id,
      role: updated.role,
      departmentId: updated.departmentId || undefined,
      minAmount: Number(updated.minAmount),
      maxAmount: Number(updated.maxAmount),
      requiresApproval: updated.requiresApproval,
      approvalLevel: updated.approvalLevel,
      autoApprove: updated.autoApprove,
    };
  }

  async deleteRule(ruleId: string): Promise<void> {
    await prisma.doaMatrixRule.update({
      where: { id: ruleId },
      data: { isActive: false },
    });
  }

  async getAllRules(companyId: string): Promise<DOAMatrixRuleDto[]> {
    const rules = await prisma.doaMatrixRule.findMany({
      where: { companyId, isActive: true },
      orderBy: [{ approvalLevel: 'asc' }, { minAmount: 'asc' }],
    });

    return rules.map((rule) => ({
      id: rule.id,
      role: rule.role,
      departmentId: rule.departmentId || undefined,
      minAmount: Number(rule.minAmount),
      maxAmount: Number(rule.maxAmount),
      requiresApproval: rule.requiresApproval,
      approvalLevel: rule.approvalLevel,
      autoApprove: rule.autoApprove,
    }));
  }
}
