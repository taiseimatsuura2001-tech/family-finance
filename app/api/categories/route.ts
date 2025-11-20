import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { validateUserAccess } from "@/lib/utils/permissions";

// Validation schema
const createCategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().default("#000000"),
  sortOrder: z.number().int().default(0),
  isDefault: z.boolean().default(false),
});

// GET /api/categories - Get categories list
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type");
    const viewUserId = searchParams.get("viewUserId");

    // Validate user access with permission check
    let targetUserId: string;
    try {
      targetUserId = validateUserAccess(
        session.user.role,
        session.user.id,
        viewUserId
      );
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Access denied" },
        { status: 403 }
      );
    }

    const where: any = {
      userId: targetUserId,
      isActive: true,
    };

    if (type) {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create category
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createCategorySchema.parse(body);

    const category = await prisma.category.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
