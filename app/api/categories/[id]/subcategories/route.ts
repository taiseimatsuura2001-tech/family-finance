import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db/prisma";

// GET /api/categories/:id/subcategories - Get subcategories for a category
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify category belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const subcategories = await prisma.subCategory.findMany({
      where: {
        categoryId: params.id,
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: subcategories,
    });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
