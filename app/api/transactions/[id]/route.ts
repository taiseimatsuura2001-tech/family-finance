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

// GET /api/transactions/:id - Get single transaction
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
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

// PUT /api/transactions/:id - Update transaction
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateTransactionSchema.parse(body);

    // Get existing transaction for audit log
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
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
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        subcategory: true,
        paymentMethod: true,
      },
    });

    // Audit log
    await auditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Transaction",
      entityId: transaction.id,
      beforeData: existingTransaction,
      afterData: transaction,
      ipAddress: req.ip,
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

// DELETE /api/transactions/:id - Delete transaction (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
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

    // Soft delete
    const transaction = await prisma.transaction.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    await auditLog({
      userId: session.user.id,
      action: "DELETE",
      entityType: "Transaction",
      entityId: transaction.id,
      beforeData: existingTransaction,
      ipAddress: req.ip,
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
