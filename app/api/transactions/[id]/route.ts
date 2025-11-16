import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/utils/audit";

// Validation schema
const updateTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  amount: z.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  paymentMethodId: z.string().uuid().optional(),
  transactionDate: z.string().datetime().optional(),
  description: z.string().optional(),
  vendor: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.string().optional(),
});

// Utility: get IP address safely
function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for") || 
    req.headers.get("x-real-ip") || 
    null
  );
}

// ------------------------------
// GET /api/transactions/:id
// ------------------------------
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null,
      },
      include: {
        category: true,
        subcategory: true,
        paymentMethod: true,
        receipts: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ------------------------------
// PUT /api/transactions/:id
// ------------------------------
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateTransactionSchema.parse(body);

    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const updateData: any = { ...validatedData };
    if (validatedData.transactionDate) {
      updateData.transactionDate = new Date(validatedData.transactionDate);
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        subcategory: true,
        paymentMethod: true,
      },
    });

    await auditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Transaction",
      entityId: transaction.id,
      beforeData: existingTransaction,
      afterData: transaction,
      ipAddress: getClientIp(req),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ------------------------------
// DELETE /api/transactions/:id
// ------------------------------
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await auditLog({
      userId: session.user.id,
      action: "DELETE",
      entityType: "Transaction",
      entityId: transaction.id,
      beforeData: existingTransaction,
      ipAddress: getClientIp(req),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
