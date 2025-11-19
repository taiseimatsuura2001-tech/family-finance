"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useViewingUser } from "@/components/providers/ViewingUserProvider";

export function DashboardNav() {
  const { isViewingOther } = useViewingUser();

  return (
    <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="flex h-16 items-center px-6 container mx-auto">
        <Link href="/" className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          FamilyFinance
        </Link>
        <div className="ml-auto flex items-center space-x-2">
          <Link href="/">
            <Button variant="ghost" className="hover:bg-blue-50 hover:text-blue-700">
              ダッシュボード
            </Button>
          </Link>
          <Link href="/income">
            <Button variant="ghost" className="hover:bg-blue-50 hover:text-blue-700">
              収入
            </Button>
          </Link>
          <Link href="/expense">
            <Button variant="ghost" className="hover:bg-red-50 hover:text-red-700">
              支出
            </Button>
          </Link>
          <Link href="/analysis">
            <Button variant="ghost" className="hover:bg-purple-50 hover:text-purple-700">
              分析
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="ghost" className="hover:bg-green-50 hover:text-green-700">
              カレンダー
            </Button>
          </Link>
          {!isViewingOther && (
            <Link href="/settings">
              <Button variant="ghost" className="hover:bg-gray-50">
                設定
              </Button>
            </Link>
          )}
          <form action="/api/auth/signout" method="POST">
            <Button type="submit" variant="outline" className="ml-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300">
              ログアウト
            </Button>
          </form>
        </div>
      </div>
    </nav>
  );
}
