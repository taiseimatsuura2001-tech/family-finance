"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionFilters, FilterValues } from "@/components/common/TransactionFilters";
import { UserSelector } from "@/components/common/UserSelector";
import { useViewingUser } from "@/components/providers/ViewingUserProvider";
import { PageLoading } from "@/components/common/Loading";
import { api } from "@/lib/api/client";
import { format, startOfMonth, endOfMonth, subMonths, subYears, eachMonthOfInterval, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

// Default date filter values
const getDefaultFilters = (): FilterValues => ({
  startDate: format(subYears(new Date(), 1), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
});

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
  const { data: session } = useSession();
  const { viewUserId } = useViewingUser();
  const [filters, setFilters] = useState<FilterValues>(getDefaultFilters());

  const currentUserId = session?.user?.id;
  const targetUserId = viewUserId || currentUserId;

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

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories", "EXPENSE", targetUserId],
    queryFn: () => api.getCategories({ type: "EXPENSE", viewUserId: targetUserId }),
    enabled: !!targetUserId,
  });

  const { data: vendorsData } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => api.getVendors(),
  });

  const isLoading = isLoadingIncome || isLoadingExpense || isLoadingCategories;

  const allIncome = incomeData?.data || [];
  const allExpenses = expenseData?.data || [];
  const categories = categoriesData?.data || [];
  const vendors = vendorsData?.data || [];

  // Apply filters
  const applyFilters = (transactions: any[]) => {
    return transactions.filter((transaction: any) => {
      // Date range filter
      if (filters.startDate) {
        const transactionDate = new Date(transaction.transactionDate);
        const startDate = new Date(filters.startDate);
        if (transactionDate < startDate) return false;
      }
      if (filters.endDate) {
        const transactionDate = new Date(transaction.transactionDate);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (transactionDate > endDate) return false;
      }

      // Amount range filter
      if (filters.minAmount !== undefined && Number(transaction.amount) < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && Number(transaction.amount) > filters.maxAmount) {
        return false;
      }

      // Category filter
      if (filters.categoryId && transaction.categoryId !== filters.categoryId) {
        return false;
      }

      // Vendor filter
      if (filters.vendorId && transaction.vendorId !== filters.vendorId) {
        return false;
      }

      // Keyword filter
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const description = (transaction.description || "").toLowerCase();
        const vendorName = (transaction.vendor?.name || "").toLowerCase();
        const categoryName = (transaction.category?.name || "").toLowerCase();

        if (
          !description.includes(keyword) &&
          !vendorName.includes(keyword) &&
          !categoryName.includes(keyword)
        ) {
          return false;
        }
      }

      return true;
    });
  };

  const income = useMemo(() => applyFilters(allIncome), [allIncome, filters]);
  const expenses = useMemo(() => applyFilters(allExpenses), [allExpenses, filters]);

  // Calculate monthly data dynamically based on filtered transactions
  // Must be before early return to maintain hooks order
  const monthlyData = useMemo(() => {
    // Determine the date range for monthly data based on filters or filtered transactions
    let months: Date[];

    // Get date range from filtered transactions for fallback values
    const allFilteredTransactions = [...income, ...expenses];
    let fallbackMinDate = subMonths(new Date(), 5);
    let fallbackMaxDate = new Date();

    if (allFilteredTransactions.length > 0) {
      const dates = allFilteredTransactions.map((t: any) => new Date(t.transactionDate));
      fallbackMinDate = new Date(Math.min(...dates.map(d => d.getTime())));
      fallbackMaxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    }

    // Determine start and end dates based on filter values
    const rangeStart = filters.startDate
      ? parseISO(filters.startDate)
      : startOfMonth(fallbackMinDate);
    const rangeEnd = filters.endDate
      ? parseISO(filters.endDate)
      : endOfMonth(fallbackMaxDate);

    // Generate months array
    if (rangeStart <= rangeEnd) {
      months = eachMonthOfInterval({
        start: rangeStart,
        end: rangeEnd,
      });
    } else {
      // If dates are invalid (start > end), default to last 6 months
      months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
    }

    return months.map(monthDate => {
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

      return {
        month: format(monthDate, "M月", { locale: ja }),
        収入: monthIncome,
        支出: monthExpense,
        差額: monthIncome - monthExpense,
      };
    });
  }, [income, expenses, filters.startDate, filters.endDate]);

  if (isLoading) {
    return <PageLoading message="分析データを読み込んでいます..." />;
  }

  const handleClearFilters = () => {
    setFilters(getDefaultFilters());
  };

  // Calculate category breakdown for expenses
  const categoryMap = new Map<string, number>();
  expenses.forEach((t: any) => {
    const categoryName = t.category?.name || "未分類";
    categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + Number(t.amount));
  });

  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Calculate totals from filtered data
  const totalIncome = income.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const totalExpense = expenses.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  // Check if filters are active
  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== ""
  );

  // Summary card labels based on filter state
  const getSummaryLabel = () => {
    if (hasActiveFilters) {
      if (filters.startDate && filters.endDate) {
        return `${filters.startDate} 〜 ${filters.endDate}`;
      }
      if (filters.startDate) {
        return `${filters.startDate} 〜`;
      }
      if (filters.endDate) {
        return `〜 ${filters.endDate}`;
      }
      return "絞り込み後";
    }
    return "今月";
  };

  // Calculate summary data (filtered period or current month)
  const summaryIncome = hasActiveFilters
    ? totalIncome
    : income
        .filter((t: any) => {
          const date = new Date(t.transactionDate);
          const currentMonthStart = startOfMonth(new Date());
          const currentMonthEnd = endOfMonth(new Date());
          return date >= currentMonthStart && date <= currentMonthEnd;
        })
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const summaryExpense = hasActiveFilters
    ? totalExpense
    : expenses
        .filter((t: any) => {
          const date = new Date(t.transactionDate);
          const currentMonthStart = startOfMonth(new Date());
          const currentMonthEnd = endOfMonth(new Date());
          return date >= currentMonthStart && date <= currentMonthEnd;
        })
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">分析</h1>
          <p className="text-muted-foreground mt-1">収支の傾向と分析</p>
        </div>
        <UserSelector />
      </div>

      {/* Filters */}
      <TransactionFilters
        categories={categories}
        vendors={vendors}
        filters={filters}
        onFilterChange={setFilters}
        onClear={handleClearFilters}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              {getSummaryLabel()}の収入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              ¥{summaryIncome.toLocaleString()}
            </div>
            {hasActiveFilters && (
              <p className="text-xs text-blue-600 mt-1">
                {income.length}件
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-900">
              {getSummaryLabel()}の支出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              ¥{summaryExpense.toLocaleString()}
            </div>
            {hasActiveFilters && (
              <p className="text-xs text-red-600 mt-1">
                {expenses.length}件
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          summaryIncome - summaryExpense >= 0
            ? "from-green-50 to-green-100 border-green-200"
            : "from-orange-50 to-orange-100 border-orange-200"
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${
              summaryIncome - summaryExpense >= 0
                ? "text-green-900"
                : "text-orange-900"
            }`}>
              {getSummaryLabel()}の収支
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              summaryIncome - summaryExpense >= 0
                ? "text-green-700"
                : "text-orange-700"
            }`}>
              ¥{(summaryIncome - summaryExpense).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>
            月次推移
            {filters.startDate && filters.endDate
              ? `（${filters.startDate} 〜 ${filters.endDate}）`
              : filters.startDate
              ? `（${filters.startDate} 〜）`
              : filters.endDate
              ? `（〜 ${filters.endDate}）`
              : hasActiveFilters
              ? "（絞り込み後）"
              : "（データ全期間）"}
          </CardTitle>
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
          <CardTitle>
            {hasActiveFilters ? "絞り込み結果サマリー" : "全期間サマリー"}
          </CardTitle>
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
