"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, ChevronRight, Building } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">設定</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          アプリケーションの設定を管理
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Category Management */}
        <Link href="/settings/categories">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Tag className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">カテゴリー管理</CardTitle>
                    <CardDescription className="mt-0.5 text-xs">
                      収入・支出のカテゴリーを管理
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <p className="text-xs text-muted-foreground">
                カテゴリーの追加、編集、削除ができます
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Vendor Management */}
        <Link href="/settings/vendors">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Building className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">支払先管理</CardTitle>
                    <CardDescription className="mt-0.5 text-xs">
                      支払先・支払元を管理
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <p className="text-xs text-muted-foreground">
                支払先の追加、編集、削除ができます
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
