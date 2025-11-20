"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useViewingUser } from "@/components/providers/ViewingUserProvider";
import { Menu, X, Home, TrendingUp, TrendingDown, BarChart3, Calendar, Settings, LogOut } from "lucide-react";

export function DashboardNav() {
  const { isViewingOther } = useViewingUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { href: "/", label: "ダッシュボード", icon: Home, hoverClass: "hover:bg-blue-50 hover:text-blue-700" },
    { href: "/income", label: "収入", icon: TrendingUp, hoverClass: "hover:bg-blue-50 hover:text-blue-700" },
    { href: "/expense", label: "支出", icon: TrendingDown, hoverClass: "hover:bg-red-50 hover:text-red-700" },
    { href: "/analysis", label: "分析", icon: BarChart3, hoverClass: "hover:bg-purple-50 hover:text-purple-700" },
    { href: "/calendar", label: "カレンダー", icon: Calendar, hoverClass: "hover:bg-green-50 hover:text-green-700" },
  ];

  return (
    <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 md:px-6 container mx-auto">
        <Link href="/" className="font-bold text-xl md:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          FamilyFinance
        </Link>

        {/* Desktop Navigation */}
        <div className="ml-auto hidden md:flex items-center space-x-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" className={item.hoverClass}>
                {item.label}
              </Button>
            </Link>
          ))}
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

        {/* Mobile Menu Button */}
        <button
          className="ml-auto md:hidden p-2 hover:bg-gray-100 rounded-md"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="メニューを開く"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className={`w-full justify-start ${item.hoverClass}`}>
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            {!isViewingOther && (
              <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start hover:bg-gray-50">
                  <Settings className="h-4 w-4 mr-2" />
                  設定
                </Button>
              </Link>
            )}
            <form action="/api/auth/signout" method="POST">
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
