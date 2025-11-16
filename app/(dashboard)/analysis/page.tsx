"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
];

export default function AnalysisPage() {
  const { data: incomeData } = useQuery({
    queryKey: ["transactions", "INCOME"],
    queryFn: () => api.getTransactions({ type: "INCOME" }),
  });

  const { data: expenseData } = useQuery({
    queryKey: ["transactions", "EXPENSE"],
    queryFn: () => api.getTransactions({ type: "EXPENSE" }),
  });

  const income = incomeData?.data || [];
  const expenses = expenseData?.data || [];

  // Calculate monthly data for the last 6 months
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const monthIncome = income
      .filter((t: any) => {
        const date = new Date(t.transactionDate);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const monthExpense = expenses
      .filter((t: any) => {
        const date = new Date(t.transactionDate);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    monthlyData.push({
      month: format(monthDate, "M月", { locale: ja }),
      収入: monthIncome,
      支出: monthExpense,
      差額: monthIncome - monthExpense,
    });
  }

  // Calculate category breakdown for expenses
  const categoryMap = new Map<string, number>();
  expenses.forEach((t: any) => {
    const categoryName = t.category?.name || "未分類";
    categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + Number(t.amount));
  });

  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Calculate totals
  const totalIncome = income.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const totalExpense = expenses.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">分析</h1>
        <p className="text-muted-foreground mt-1">収支の傾向と分析</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              今月の収入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              ¥{currentMonthIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-900">
              今月の支出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              ¥{currentMonthExpense.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          currentMonthIncome - currentMonthExpense >= 0
            ? "from-green-50 to-green-100 border-green-200"
            : "from-orange-50 to-orange-100 border-orange-200"
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${
              currentMonthIncome - currentMonthExpense >= 0
                ? "text-green-900"
                : "text-orange-900"
            }`}>
              今月の収支
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              currentMonthIncome - currentMonthExpense >= 0
                ? "text-green-700"
                : "text-orange-700"
            }`}>
              ¥{(currentMonthIncome - currentMonthExpense).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>月次推移（過去6ヶ月）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `¥${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="収入" fill="#3b82f6" />
              <Bar dataKey="支出" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Balance Trend */}
      <Card>
        <CardHeader>
          <CardTitle>収支差額の推移</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `¥${value.toLocaleString()}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="差額"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>支出カテゴリー内訳</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${((entry.value / totalExpense) * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `¥${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>カテゴリー別支出額</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((category, index) => (
                  <div key={category.name} className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-sm font-semibold">
                          ¥{category.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(category.value / totalExpense) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle>全期間サマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">総収入</p>
              <p className="text-2xl font-bold text-blue-600">
                ¥{totalIncome.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">総支出</p>
              <p className="text-2xl font-bold text-red-600">
                ¥{totalExpense.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">収支</p>
              <p className={`text-2xl font-bold ${
                balance >= 0 ? "text-green-600" : "text-orange-600"
              }`}>
                ¥{balance.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
