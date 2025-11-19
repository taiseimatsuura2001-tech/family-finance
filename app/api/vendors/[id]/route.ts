import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

// Validation schema
const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["GENERAL", "STORE", "RESTAURANT", "UTILITY", "MEDICAL", "ENTERTAINMENT", "OTHER"]).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// PUT /api/vendors/:id - Update vendor
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateVendorSchema.parse(body);

    // Check if vendor belongs to user
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/vendors/:id - Delete vendor
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if vendor belongs to user
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.vendor.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Vendor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
