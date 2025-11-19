import { NextRequest, NextResponse } from "next/server";

// Handle NextAuth error redirects
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const error = searchParams.get("error");

  // Redirect to login page with error parameter
  const loginUrl = new URL("/login", req.url);
  if (error) {
    loginUrl.searchParams.set("error", error);
  }

  return NextResponse.redirect(loginUrl);
}
