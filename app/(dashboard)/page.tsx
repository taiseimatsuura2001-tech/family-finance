"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserSelector } from "@/components/common/UserSelector";
import { useViewingUser } from "@/components/providers/ViewingUserProvider";
import { api } from "@/lib/api/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ja } from "date-fns/locale";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";
import { PageLoading } from "@/components/common/Loading";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { viewUserId, isViewingOther } = useViewingUser();

  const currentUserId = session?.user?.id;
  const targetUserId = viewUserId || currentUserId;

  // Fetch users (must be at top level, before any conditional returns)
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers(),
  });

  const { data: incomeData, isLoading: isLoadingIncome } = useQuery({
    queryKey: ["transactions", "INCOME", targetUserId],
    queryFn: () => api.getTransactions({ type: "INCOME", viewUserId: targetUserId }),
    enabled: !!targetUserId,
  });

  const { data: expenseData, isLoading: isLoadingExpense } = useQuery({
    queryKey: ["transactions", "EXPENSE", targetUserId],
    queryFn: () => api.getTransactions({ type: "EXPENSE", viewUserId: targetUserId }),
    enabled: !!targetUserId,
  });

  const isLoading = isLoadingIncome || isLoadingExpense || isLoadingUsers;

  // Get the name of the user being viewed
  const users = usersData?.data || [];
  const viewedUser = users.find((u: any) => u.id === targetUserId);
  const viewedUserName = viewedUser?.name || viewedUser?.email?.split('@')[0] || session?.user?.name || session?.user?.email?.split('@')[0] || "ユーザー";

  if (isLoading) {
    return <PageLoading message="ダッシュボードを読み込んでいます..." />;
  }

  const income = incomeData?.data || [];
  const expenses = expenseData?.data || [];
  const allTransactions = [...income, ...expenses].sort(
    (a: any, b: any) =>
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  );

  // Calculate current month data
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  const currentMonthIncome = income
    .filter((t: any) => {
      const date = new Date(t.transactionDate);
      return date >= currentMonthStart && date <= currentMonthEnd;
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const currentMonthExpense = expenses
    .filter((t: any) => {
      const date = new Date(t.transactionDate);
      return date >= currentMonthStart && date <= currentMonthEnd;
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const currentMonthBalance = currentMonthIncome - currentMonthExpense;
  const currentMonthTransactions = allTransactions.filter((t: any) => {
    const date = new Date(t.transactionDate);
    return date >= currentMonthStart && date <= currentMonthEnd;
  }).length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {isViewingOther ? `${viewedUserName}さんのダッシュボード` : `ようこそ、${viewedUserName}さん`}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {format(new Date(), "yyyy年M月d日（E）", { locale: ja })}の家計状況
          </p>
        </div>
        <UserSelector />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        {!isViewingOther && (
          <>
            <Link href="/income/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-sm md:text-base">
                <Plus className="mr-2 h-4 w-4" />
                収入を登録
              </Button>
            </Link>
            <Link href="/expense/new">
              <Button className="bg-red-600 hover:bg-red-700 text-sm md:text-base">
                <Plus className="mr-2 h-4 w-4" />
                支出を登録
              </Button>
            </Link>
          </>
        )}
        <Link href="/analysis">
          <Button variant="outline" className="text-sm md:text-base">
            分析を見る
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              今月の収入
            </CardTitle>
            <div className="p-2 bg-blue-200 rounded-full">
              <ArrowUpRight className="h-4 w-4 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              ¥{currentMonthIncome.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              収入合計
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">
              今月の支出
            </CardTitle>
            <div className="p-2 bg-red-200 rounded-full">
              <ArrowDownRight className="h-4 w-4 text-red-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              ¥{currentMonthExpense.toLocaleString()}
            </div>
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              支出合計
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          currentMonthBalance >= 0
            ? "from-green-50 to-green-100 border-green-200"
            : "from-orange-50 to-orange-100 border-orange-200"
        } hover:shadow-lg transition-shadow`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${
              currentMonthBalance >= 0 ? "text-green-900" : "text-orange-900"
            }`}>
              今月の収支
            </CardTitle>
            <div className={`p-2 rounded-full ${
              currentMonthBalance >= 0 ? "bg-green-200" : "bg-orange-200"
            }`}>
              <Wallet className={`h-4 w-4 ${
                currentMonthBalance >= 0 ? "text-green-700" : "text-orange-700"
              }`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              currentMonthBalance >= 0 ? "text-green-700" : "text-orange-700"
            }`}>
              ¥{currentMonthBalance.toLocaleString()}
            </div>
            <p className={`text-xs mt-1 ${
              currentMonthBalance >= 0 ? "text-green-600" : "text-orange-600"
            }`}>
              {currentMonthBalance >= 0 ? "黒字です" : "赤字です"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">
              登録件数
            </CardTitle>
            <div className="p-2 bg-purple-200 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-purple-700"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {currentMonthTransactions}件
            </div>
            <p className="text-xs text-purple-600 mt-1">
              今月の取引件数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl">最近の取引</CardTitle>
          <CardDescription className="mt-1">
            最新の収支履歴（最大10件）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {isViewingOther ? "このユーザーの取引はありません" : "まだ取引がありません"}
              </p>
              {!isViewingOther && (
                <div className="flex gap-2 justify-center">
                  <Link href="/income/new">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      収入を登録
                    </Button>
                  </Link>
                  <Link href="/expense/new">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      支出を登録
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {allTransactions.slice(0, 10).map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${
                      transaction.type === "INCOME"
                        ? "bg-blue-100"
                        : "bg-red-100"
                    }`}>
                      {transaction.type === "INCOME" ? (
                        <ArrowUpRight className={`h-4 w-4 text-blue-600`} />
                      ) : (
                        <ArrowDownRight className={`h-4 w-4 text-red-600`} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {transaction.category?.name || "未分類"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {format(
                            new Date(transaction.transactionDate),
                            "M月d日（E）",
                            { locale: ja }
                          )}
                        </span>
                        {transaction.vendor && (
                          <>
                            <span>•</span>
                            <span>{transaction.vendor}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`text-base font-semibold ${
                    transaction.type === "INCOME"
                      ? "text-blue-600"
                      : "text-red-600"
                  }`}>
                    {transaction.type === "INCOME" ? "+" : "-"}
                    ¥{Number(transaction.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
