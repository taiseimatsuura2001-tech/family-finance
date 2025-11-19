"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useMemo } from "react";

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

interface DayDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  summary: DaySummary | null;
  isViewingOther?: boolean;
}

export function DayDetailDialog({
  isOpen,
  onClose,
  date,
  summary,
  isViewingOther = false,
}: DayDetailDialogProps) {
  // 日付をクエリパラメータ用にフォーマット
  const dateParam = useMemo(() => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  }, [date]);

  if (!date || !summary) return null;

  const balance = summary.income - summary.expense;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl">
              {format(date, "yyyy年M月d日 (E)", { locale: ja })}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <TrendingUp className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-blue-600 mb-1">収入</p>
            <p className="text-sm font-bold text-blue-700">
              ¥{summary.income.toLocaleString()}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <TrendingDown className="h-4 w-4 text-red-600 mx-auto mb-1" />
            <p className="text-xs text-red-600 mb-1">支出</p>
            <p className="text-sm font-bold text-red-700">
              ¥{summary.expense.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-lg p-3 text-center ${
            balance >= 0 ? "bg-green-50" : "bg-orange-50"
          }`}>
            <ArrowRightLeft className={`h-4 w-4 mx-auto mb-1 ${
              balance >= 0 ? "text-green-600" : "text-orange-600"
            }`} />
            <p className={`text-xs mb-1 ${
              balance >= 0 ? "text-green-600" : "text-orange-600"
            }`}>
              差額
            </p>
            <p className={`text-sm font-bold ${
              balance >= 0 ? "text-green-700" : "text-orange-700"
            }`}>
              {balance >= 0 ? "+" : ""}¥{balance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 取引リスト */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm">
            取引一覧 ({summary.transactions.length}件)
          </h3>

          {summary.transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">この日の取引はありません</p>
              {!isViewingOther && (
                <div className="flex justify-center gap-2">
                  <Link href={`/income/new?date=${dateParam}`}>
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                      収入を登録
                    </Button>
                  </Link>
                  <Link href={`/expense/new?date=${dateParam}`}>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                      支出を登録
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {summary.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`p-3 rounded-lg border ${
                    transaction.type === "INCOME"
                      ? "bg-blue-50/50 border-blue-200"
                      : "bg-red-50/50 border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      transaction.type === "INCOME"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {transaction.type === "INCOME" ? "収入" : "支出"}
                    </span>
                    <span className={`font-bold ${
                      transaction.type === "INCOME"
                        ? "text-blue-700"
                        : "text-red-700"
                    }`}>
                      {transaction.type === "INCOME" ? "+" : "-"}
                      ¥{Number(transaction.amount).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {transaction.category && (
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: transaction.category.color || "#6B7280" }}
                        />
                        <span className="text-sm text-gray-600">
                          {transaction.category.name}
                        </span>
                      </div>
                    )}

                    {transaction.vendor && (
                      <p className="text-sm text-gray-600">
                        {transaction.type === "INCOME" ? "支払元: " : "支払先: "}
                        {transaction.vendor.name}
                      </p>
                    )}

                    {transaction.description && (
                      <p className="text-sm text-gray-500 truncate">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* アクションボタン */}
        {summary.transactions.length > 0 && !isViewingOther && (
          <div className="flex justify-center gap-2 mt-4 pt-4 border-t">
            <Link href={`/income/new?date=${dateParam}`}>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                収入を登録
              </Button>
            </Link>
            <Link href={`/expense/new?date=${dateParam}`}>
              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                支出を登録
              </Button>
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
