"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Plus, TrendingUp, Calendar, Building, FileText } from "lucide-react";

export default function IncomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["transactions", "INCOME"],
    queryFn: () => api.getTransactions({ type: "INCOME" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 font-medium">データの取得に失敗しました</p>
          <p className="text-sm text-red-500 mt-2">しばらくしてから再度お試しください</p>
        </div>
      </div>
    );
  }

  const transactions = data?.data || [];
  const totalIncome = transactions.reduce(
    (sum: number, t: any) => sum + Number(t.amount),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">収入管理</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            収入の記録と管理
          </p>
        </div>
        <Link href="/income/new">
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-shadow">
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Button>
        </Link>
      </div>

      {/* Total Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">総収入額</p>
              <p className="text-4xl font-bold text-blue-900">
                ¥{totalIncome.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {transactions.length}件の記録
              </p>
            </div>
            <div className="p-4 bg-blue-200 rounded-full">
              <TrendingUp className="h-8 w-8 text-blue-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="p-4 bg-blue-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-xl font-medium text-muted-foreground mb-2">
                収入の記録がありません
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                最初の収入を登録して、家計管理を始めましょう
              </p>
              <Link href="/income/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  最初の収入を登録する
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-transparent">
            <CardTitle className="text-2xl">収入一覧</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {transactions.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="p-6 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {transaction.category?.name || "未分類"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(
                              new Date(transaction.transactionDate),
                              "yyyy年M月d日（E）",
                              { locale: ja }
                            )}
                          </span>
                        </div>
                        {transaction.vendor && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building className="h-4 w-4" />
                            <span>{transaction.vendor}</span>
                          </div>
                        )}
                        {transaction.description && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span className="truncate">{transaction.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-6 text-right">
                      <p className="text-3xl font-bold text-blue-600">
                        ¥{Number(transaction.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
