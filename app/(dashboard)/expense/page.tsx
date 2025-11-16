"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Plus, TrendingDown, Calendar, Building, CreditCard, FileText } from "lucide-react";

export default function ExpensePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["transactions", "EXPENSE"],
    queryFn: () => api.getTransactions({ type: "EXPENSE" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
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
  const totalExpense = transactions.reduce(
    (sum: number, t: any) => sum + Number(t.amount),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">支出管理</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            支出の記録と管理
          </p>
        </div>
        <Link href="/expense/new">
          <Button className="bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-shadow">
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Button>
        </Link>
      </div>

      {/* Total Card */}
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium mb-1">総支出額</p>
              <p className="text-4xl font-bold text-red-900">
                ¥{totalExpense.toLocaleString()}
              </p>
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <TrendingDown className="h-4 w-4" />
                {transactions.length}件の記録
              </p>
            </div>
            <div className="p-4 bg-red-200 rounded-full">
              <TrendingDown className="h-8 w-8 text-red-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="p-4 bg-red-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-xl font-medium text-muted-foreground mb-2">
                支出の記録がありません
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                最初の支出を登録して、家計管理を始めましょう
              </p>
              <Link href="/expense/new">
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="mr-2 h-4 w-4" />
                  最初の支出を登録する
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader className="border-b bg-gradient-to-r from-red-50 to-transparent">
            <CardTitle className="text-2xl">支出一覧</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {transactions.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="p-6 hover:bg-red-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          {transaction.category?.name || "未分類"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
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
                        {transaction.paymentMethod?.name && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CreditCard className="h-4 w-4" />
                            <span>{transaction.paymentMethod.name}</span>
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
                      <p className="text-3xl font-bold text-red-600">
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
