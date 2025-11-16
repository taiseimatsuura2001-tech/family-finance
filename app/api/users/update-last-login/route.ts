// /api/user/update-last-login/route.ts
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  const { userId } = await req.json();
  await prisma.user.update({
    where: { id: userId },
    data: { lastLogin: new Date() },
  });
}