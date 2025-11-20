"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TransactionEditDialog } from "@/components/forms/TransactionEditDialog";
import { TransactionFilters, FilterValues } from "@/components/common/TransactionFilters";
import { UserSelector } from "@/components/common/UserSelector";
import { useViewingUser } from "@/components/providers/ViewingUserProvider";
import { PageLoading } from "@/components/common/Loading";
import { api } from "@/lib/api/client";
import { useToast } from "@/components/ui/use-toast";
import { format, subYears } from "date-fns";
import { ja } from "date-fns/locale";

// Default date filter values
const getDefaultFilters = (): FilterValues => ({
  startDate: format(subYears(new Date(), 1), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
});
import { Plus, TrendingUp, Calendar, Building, FileText, Edit, Trash2, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortField = "date" | "amount" | "category";
type SortDirection = "asc" | "desc";

export default function IncomePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: session } = useSession();
  const { viewUserId, isViewingOther } = useViewingUser();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>(getDefaultFilters());
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [sortField2, setSortField2] = useState<SortField | "none">("amount");
  const [sortDirection2, setSortDirection2] = useState<SortDirection>("desc");
  const [sortField3, setSortField3] = useState<SortField | "none">("category");
  const [sortDirection3, setSortDirection3] = useState<SortDirection>("asc");

  const currentUserId = session?.user?.id;
  const targetUserId = viewUserId || currentUserId;

  const { data, isLoading, error } = useQuery({
    queryKey: ["transactions", "INCOME", targetUserId],
    queryFn: () => api.getTransactions({ type: "INCOME", viewUserId: targetUserId }),
    enabled: !!targetUserId,
  });

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories", "INCOME", targetUserId],
    queryFn: () => api.getCategories({ type: "INCOME", viewUserId: targetUserId }),
    enabled: !!targetUserId,
  });

  const { data: vendorsData } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => api.getVendors(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({
        title: "削除完了",
        description: "収入を削除しました",
        className: "bg-green-50 border-green-200",
      });
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: `削除に失敗しました: ${error.message || "エラーが発生しました"}`,
        className: "bg-red-50 border-red-200",
      });
    },
  });

  const allTransactions = data?.data || [];
  const categories = categoriesData?.data || [];
  const vendors = vendorsData?.data || [];

  // Apply filters and sorting
  const filteredTransactions = useMemo(() => {
    const filtered = allTransactions.filter((transaction: any) => {
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
        const vendor = (transaction.vendor || "").toLowerCase();
        const categoryName = (transaction.category?.name || "").toLowerCase();

        if (
          !description.includes(keyword) &&
          !vendor.includes(keyword) &&
          !categoryName.includes(keyword)
        ) {
          return false;
        }
      }

      return true;
    });

    // Helper function for comparison
    const compareByField = (a: any, b: any, field: SortField, direction: SortDirection) => {
      let comparison = 0;

      switch (field) {
        case "date":
          comparison = new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
          break;
        case "amount":
          comparison = Number(a.amount) - Number(b.amount);
          break;
        case "category":
          const categoryA = a.category?.name || "";
          const categoryB = b.category?.name || "";
          comparison = categoryA.localeCompare(categoryB, "ja");
          break;
      }

      return direction === "asc" ? comparison : -comparison;
    };

    // Apply sorting with primary, secondary, and tertiary sort
    return filtered.sort((a: any, b: any) => {
      const primaryComparison = compareByField(a, b, sortField, sortDirection);

      // If primary sort is equal and secondary sort is set, use secondary
      if (primaryComparison === 0 && sortField2 && sortField2 !== "none") {
        const secondaryComparison = compareByField(a, b, sortField2 as SortField, sortDirection2);

        // If secondary sort is also equal and tertiary sort is set, use tertiary
        if (secondaryComparison === 0 && sortField3 && sortField3 !== "none") {
          return compareByField(a, b, sortField3 as SortField, sortDirection3);
        }

        return secondaryComparison;
      }

      return primaryComparison;
    });
  }, [allTransactions, filters, sortField, sortDirection, sortField2, sortDirection2, sortField3, sortDirection3]);

  const totalIncome = filteredTransactions.reduce(
    (sum: number, t: any) => sum + Number(t.amount),
    0
  );

  const handleClearFilters = () => {
    setFilters(getDefaultFilters());
  };

  if (isLoading || isLoadingCategories) {
    return <PageLoading message="収入データを読み込んでいます..." />;
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">収入管理</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            収入の記録と管理
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <UserSelector />
          {!isViewingOther && (
            <Link href="/income/new" className="w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-1 h-3 w-3" />
                新規登録
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="space-y-4">
        <TransactionFilters
          categories={categories}
          vendors={vendors}
          filters={filters}
          onFilterChange={setFilters}
          onClear={handleClearFilters}
        />

        {/* Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">並び替え:</span>
          </div>
          <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">日付</SelectItem>
              <SelectItem value="amount">金額</SelectItem>
              <SelectItem value="category">カテゴリー</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortDirection} onValueChange={(value) => setSortDirection(value as SortDirection)}>
            <SelectTrigger className="w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">降順</SelectItem>
              <SelectItem value="asc">昇順</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">→</span>
          <Select value={sortField2} onValueChange={(value) => setSortField2(value as SortField | "none")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="なし" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">なし</SelectItem>
              <SelectItem value="date">日付</SelectItem>
              <SelectItem value="amount">金額</SelectItem>
              <SelectItem value="category">カテゴリー</SelectItem>
            </SelectContent>
          </Select>
          {sortField2 && sortField2 !== "none" && (
            <>
              <Select value={sortDirection2} onValueChange={(value) => setSortDirection2(value as SortDirection)}>
                <SelectTrigger className="w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">降順</SelectItem>
                  <SelectItem value="asc">昇順</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">→</span>
              <Select value={sortField3} onValueChange={(value) => setSortField3(value as SortField | "none")}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="なし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">なし</SelectItem>
                  <SelectItem value="date">日付</SelectItem>
                  <SelectItem value="amount">金額</SelectItem>
                  <SelectItem value="category">カテゴリー</SelectItem>
                </SelectContent>
              </Select>
              {sortField3 && sortField3 !== "none" && (
                <Select value={sortDirection3} onValueChange={(value) => setSortDirection3(value as SortDirection)}>
                  <SelectTrigger className="w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">降順</SelectItem>
                    <SelectItem value="asc">昇順</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </>
          )}
        </div>
      </div>

      {/* Total Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-700 font-medium mb-0.5">
                {Object.keys(filters).some(key => filters[key as keyof FilterValues])
                  ? "絞り込み後の収入額"
                  : "総収入額"}
              </p>
              <p className="text-2xl font-bold text-blue-900">
                ¥{totalIncome.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {filteredTransactions.length}件
                {allTransactions.length !== filteredTransactions.length && (
                  <span className="text-gray-500">
                    （全{allTransactions.length}件中）
                  </span>
                )}
              </p>
            </div>
            <div className="p-2 bg-blue-200 rounded-full">
              <TrendingUp className="h-5 w-5 text-blue-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="p-3 bg-blue-50 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-base font-medium text-muted-foreground mb-1">
                収入の記録がありません
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {isViewingOther ? "このユーザーの収入記録はありません" : "最初の収入を登録して、家計管理を始めましょう"}
              </p>
              {!isViewingOther && (
                <Link href="/income/new">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-1 h-3 w-3" />
                    最初の収入を登録する
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-transparent py-3 px-4">
            <CardTitle className="text-base">収入一覧</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredTransactions.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="p-3 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {transaction.category?.name || "未分類"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(
                              new Date(transaction.transactionDate),
                              "yyyy/M/d（E）",
                              { locale: ja }
                            )}
                          </span>
                        </div>
                        {transaction.vendor && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Building className="h-3 w-3" />
                            <span>{transaction.vendor}</span>
                          </div>
                        )}
                        {transaction.description && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span className="truncate">{transaction.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">
                          ¥{Number(transaction.amount).toLocaleString()}
                        </p>
                      </div>
                      {!isViewingOther && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(transaction.id)}
                            className="hover:bg-blue-50 h-7 w-7 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingId(transaction.id)}
                            className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingId && (
        <TransactionEditDialog
          transactionId={editingId}
          open={!!editingId}
          onOpenChange={(open) => !open && setEditingId(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>収入を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。本当にこの収入を削除してもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-red-600 hover:bg-red-700"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
