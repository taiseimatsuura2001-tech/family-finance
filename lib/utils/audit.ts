import { prisma } from "@/lib/db/prisma";

interface AuditLogParams {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function auditLog(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeData: params.beforeData || undefined,
        afterData: params.afterData || undefined,
        ipAddress: params.ipAddress || undefined,
        userAgent: params.userAgent || undefined,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
