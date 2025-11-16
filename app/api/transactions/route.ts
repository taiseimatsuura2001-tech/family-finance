import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/utils/audit";

// Validation schema
const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive(),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  paymentMethodId: z.string().uuid().optional(),
  transactionDate: z.string().datetime(),
  description: z.string().optional(),
  vendor: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.string().optional(),
});

// GET /api/transactions - Get transactions list
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {
      userId: session.user.id,
      deletedAt: null,
    };

    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (type) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          subcategory: true,
          paymentMethod: true,
          receipts: true,
        },
        orderBy: { transactionDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create transaction
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createTransactionSchema.parse(body);

    const transaction = await prisma.transaction.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        transactionDate: new Date(validatedData.transactionDate),
      },
      include: {
        category: true,
        subcategory: true,
        paymentMethod: true,
      },
    });

    // Audit log
    await auditLog({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Transaction",
      entityId: transaction.id,
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
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
