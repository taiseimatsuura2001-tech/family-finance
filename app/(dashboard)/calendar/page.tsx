"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserSelector } from "@/components/common/UserSelector";
import { useViewingUser } from "@/components/providers/ViewingUserProvider";
import { api } from "@/lib/api/client";
import { DayDetailDialog } from "@/components/calendar/DayDetailDialog";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  transactionDate: string;
  description?: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  vendor?: {
    id: string;
    name: string;
  };
}

interface DaySummary {
  date: Date;
  income: number;
  expense: number;
  transactions: Transaction[];
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const { viewUserId, isViewingOther } = useViewingUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const currentUserId = session?.user?.id;
  const targetUserId = viewUserId || currentUserId;

  // 月の最初と最後の日を取得
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // 取引データを取得
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ["transactions", "calendar", format(monthStart, "yyyy-MM"), targetUserId],
    queryFn: async () => {
      const response = await api.getTransactions({
        startDate: format(monthStart, "yyyy-MM-dd"),
        endDate: format(monthEnd, "yyyy-MM-dd"),
        limit: 1000,
        viewUserId: targetUserId,
      });
      return response;
    },
    enabled: !!targetUserId,
  });

  // 日別のサマリーを計算
  const daySummaries = useMemo(() => {
    const summaries = new Map<string, DaySummary>();

    if (transactionsData?.data) {
      transactionsData.data.forEach((transaction: Transaction) => {
        const dateKey = format(new Date(transaction.transactionDate), "yyyy-MM-dd");

        if (!summaries.has(dateKey)) {
          summaries.set(dateKey, {
            date: new Date(transaction.transactionDate),
            income: 0,
            expense: 0,
            transactions: [],
          });
        }

        const summary = summaries.get(dateKey)!;
        const amount = Number(transaction.amount);

        if (transaction.type === "INCOME") {
          summary.income += amount;
        } else {
          summary.expense += amount;
        }

        summary.transactions.push(transaction);
      });
    }

    return summaries;
  }, [transactionsData]);

  // カレンダーの日付配列を生成（週の開始から終了まで）
  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { locale: ja });
    const end = endOfWeek(monthEnd, { locale: ja });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  // 月のサマリーを計算
  const monthSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    daySummaries.forEach((summary) => {
      totalIncome += summary.income;
      totalExpense += summary.expense;
    });

    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [daySummaries]);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const getSelectedDaySummary = (): DaySummary | null => {
    if (!selectedDate) return null;
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return daySummaries.get(dateKey) || {
      date: selectedDate,
      income: 0,
      expense: 0,
      transactions: [],
    };
  };

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            カレンダー
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">日別の収支を確認できます</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <UserSelector />
          <div className="flex items-center gap-2 justify-between sm:justify-start">
            <Button variant="outline" size="sm" onClick={handleToday} className="flex-shrink-0">
              今日
            </Button>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth} className="h-9 w-9">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-base md:text-lg font-semibold min-w-[120px] md:min-w-[140px] text-center">
                {format(currentMonth, "yyyy年 M月", { locale: ja })}
              </span>
              <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 月間サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-sm text-blue-600 font-medium">月間収入</p>
          <p className="text-2xl font-bold text-blue-700">
            ¥{monthSummary.totalIncome.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <p className="text-sm text-red-600 font-medium">月間支出</p>
          <p className="text-2xl font-bold text-red-700">
            ¥{monthSummary.totalExpense.toLocaleString()}
          </p>
        </Card>
        <Card className={`p-4 ${
          monthSummary.balance >= 0
            ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
            : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
        }`}>
          <p className={`text-sm font-medium ${
            monthSummary.balance >= 0 ? "text-green-600" : "text-orange-600"
          }`}>
            収支差額
          </p>
          <p className={`text-2xl font-bold ${
            monthSummary.balance >= 0 ? "text-green-700" : "text-orange-700"
          }`}>
            {monthSummary.balance >= 0 ? "+" : ""}¥{monthSummary.balance.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* カレンダー */}
      <Card className="p-2 md:p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="w-full">
            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-1 md:mb-2">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={`text-center py-1 md:py-2 text-xs md:text-sm font-semibold ${
                    index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-gray-600"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 日付グリッド */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
              {calendarDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const summary = daySummaries.get(dateKey);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isDayToday = isToday(day);
                const dayOfWeek = day.getDay();

                return (
                  <button
                    key={dateKey}
                    onClick={() => handleDayClick(day)}
                    className={`
                      min-h-[60px] md:min-h-[100px] p-1 md:p-2 rounded border md:rounded-lg text-left transition-all
                      hover:bg-gray-50 hover:border-green-300 hover:shadow-sm
                      ${!isCurrentMonth ? "bg-gray-50 opacity-50" : "bg-white"}
                      ${isDayToday ? "border-green-500 border-2 bg-green-50" : "border-gray-200"}
                    `}
                  >
                    <div className={`text-xs md:text-sm font-medium mb-0.5 md:mb-1 ${
                      !isCurrentMonth
                        ? "text-gray-400"
                        : dayOfWeek === 0
                          ? "text-red-500"
                          : dayOfWeek === 6
                            ? "text-blue-500"
                            : "text-gray-700"
                    }`}>
                      {format(day, "d")}
                    </div>

                    {summary && isCurrentMonth && (
                      <div className="space-y-0.5 md:space-y-1">
                        {summary.income > 0 && (
                          <div className="text-[10px] md:text-xs text-blue-600 font-medium truncate">
                            +¥{summary.income.toLocaleString()}
                          </div>
                        )}
                        {summary.expense > 0 && (
                          <div className="text-[10px] md:text-xs text-red-600 font-medium truncate">
                            -¥{summary.expense.toLocaleString()}
                          </div>
                        )}
                        {summary.transactions.length > 0 && (
                          <div className="text-[10px] md:text-xs text-gray-400 hidden sm:block">
                            {summary.transactions.length}件
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* 日付詳細ダイアログ */}
      <DayDetailDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        date={selectedDate}
        summary={getSelectedDaySummary()}
        isViewingOther={isViewingOther}
      />
    </div>
  );
}
