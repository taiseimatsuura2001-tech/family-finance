"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api/client";
import { useToast } from "@/components/ui/use-toast";
import {
  DollarSign,
  Calendar,
  Building,
  FileText,
  Tag,
} from "lucide-react";

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive("金額は正の数である必要があります"),
  categoryId: z.string().min(1, "カテゴリーを選択してください"),
  transactionDate: z.string(),
  description: z.string().optional(),
  vendorId: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionEditDialogProps {
  transactionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionEditDialog({
  transactionId,
  open,
  onOpenChange,
}: TransactionEditDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch transaction data
  const { data: transactionData, isLoading: isLoadingTransaction } = useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: () => api.getTransaction(transactionId),
    enabled: open && !!transactionId,
  });

  const transaction = transactionData?.data;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
  });

  const type = watch("type");

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", type],
    queryFn: () => api.getCategories({ type }),
    enabled: !!type,
  });

  // Fetch vendors
  const { data: vendorsData } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => api.getVendors(),
  });

  const vendors = vendorsData?.data || [];

  // Update form when transaction data is loaded
  useEffect(() => {
    if (transaction) {
      const formData = {
        type: transaction.type,
        amount: Number(transaction.amount),
        categoryId: transaction.categoryId,
        transactionDate: format(new Date(transaction.transactionDate), "yyyy-MM-dd"),
        description: transaction.description || "",
        vendorId: transaction.vendorId || "",
      };
      reset(formData);
    }
  }, [transaction, reset]);

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: (data: TransactionFormData) => {
      const formattedData = {
        ...data,
        transactionDate: new Date(data.transactionDate).toISOString(),
      };
      return api.updateTransaction(transactionId, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", transactionId] });
      toast({
        title: "更新完了",
        description: "取引情報を更新しました",
        className: "bg-green-50 border-green-200",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: `更新に失敗しました: ${error.message || "エラーが発生しました"}`,
        className: "bg-red-50 border-red-200",
      });
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    updateMutation.mutate(data);
  };

  const categories = categoriesData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">取引を編集</DialogTitle>
        </DialogHeader>

        {isLoadingTransaction ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Type Selection */}
            <div>
              <Label className="text-base font-semibold mb-2 block">種別</Label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    type === "INCOME"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <input
                    type="radio"
                    value="INCOME"
                    {...register("type")}
                    className="sr-only"
                  />
                  <span className="font-medium">収入</span>
                </label>
                <label
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    type === "EXPENSE"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white hover:border-red-300"
                  }`}
                >
                  <input
                    type="radio"
                    value="EXPENSE"
                    {...register("type")}
                    className="sr-only"
                  />
                  <span className="font-medium">支出</span>
                </label>
              </div>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount" className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4" />
                金額
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ¥
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  className="pl-8"
                  {...register("amount", { valueAsNumber: true })}
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="categoryId" className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4" />
                カテゴリー
              </Label>
              <select
                id="categoryId"
                {...register("categoryId")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <Label htmlFor="transactionDate" className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                日付
              </Label>
              <Input
                id="transactionDate"
                type="date"
                {...register("transactionDate")}
              />
            </div>

            {/* Vendor */}
            <div>
              <Label htmlFor="vendorId" className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4" />
                {type === "INCOME" ? "支払元" : "支払先"}
              </Label>
              <select
                id="vendorId"
                {...register("vendorId")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {vendors.map((vendor: any) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                メモ
              </Label>
              <textarea
                id="description"
                {...register("description")}
                rows={3}
                placeholder="詳細な説明や補足情報を入力"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Footer Buttons */}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className={
                  type === "INCOME"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {updateMutation.isPending ? "更新中..." : "更新する"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
