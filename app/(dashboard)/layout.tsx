import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth.config";
import { redirect } from "next/navigation";
import { ViewingUserProvider } from "@/components/providers/ViewingUserProvider";
import { DashboardNav } from "./DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <ViewingUserProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <DashboardNav />
        <main className="container mx-auto py-4 md:py-8 px-4 md:px-6">
          {children}
        </main>
      </div>
    </ViewingUserProvider>
  );
}
