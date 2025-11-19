"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api/client";
import {
  DollarSign,
  Calendar,
  Building,
  FileText,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft
} from "lucide-react";

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().int("金額は整数で入力してください").positive("金額は正の数である必要があります"),
  categoryId: z.string().min(1, "カテゴリーを選択してください"),
  transactionDate: z.string(),
  description: z.string().optional(),
  vendorId: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  defaultValues?: Partial<TransactionFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({
  defaultValues,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "EXPENSE",
      transactionDate: format(new Date(), "yyyy-MM-dd"),
      ...defaultValues,
    },
  });

  const type = watch("type");

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", type],
    queryFn: () => api.getCategories({ type }),
  });

  // Fetch vendors
  const { data: vendorsData } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => api.getVendors(),
  });

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: (data: TransactionFormData) => {
      const formattedData = {
        ...data,
        transactionDate: new Date(data.transactionDate).toISOString(),
      };
      return api.createTransaction(formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      alert(type === "INCOME" ? "収入を登録しました" : "支出を登録しました");
      onSuccess?.();
    },
    onError: (error: any) => {
      alert(`登録に失敗しました: ${error.message || "エラーが発生しました"}`);
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    createMutation.mutate(data);
  };

  const categories = categoriesData?.data || [];
  const vendors = vendorsData?.data || [];

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={onCancel}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold">
            {type === "INCOME" ? "新規収入登録" : "新規支出登録"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {type === "INCOME" ? "収入情報を入力してください" : "支出情報を入力してください"}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="shadow-lg">
        <CardHeader className={`border-b ${
          type === "INCOME"
            ? "bg-gradient-to-r from-blue-50 to-blue-100"
            : "bg-gradient-to-r from-red-50 to-red-100"
        }`}>
          <CardTitle className="text-2xl flex items-center gap-2">
            {type === "INCOME" ? (
              <>
                <ArrowUpRight className="h-6 w-6 text-blue-600" />
                <span className="text-blue-900">収入登録</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="h-6 w-6 text-red-600" />
                <span className="text-red-900">支出登録</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Type Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">種別</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  type === "INCOME"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}>
                  <input
                    type="radio"
                    value="INCOME"
                    {...register("type")}
                    className="sr-only"
                  />
                  <ArrowUpRight className="h-5 w-5" />
                  <span className="font-medium">収入</span>
                </label>
                <label className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  type === "EXPENSE"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white hover:border-red-300"
                }`}>
                  <input
                    type="radio"
                    value="EXPENSE"
                    {...register("type")}
                    className="sr-only"
                  />
                  <ArrowDownRight className="h-5 w-5" />
                  <span className="font-medium">支出</span>
                </label>
              </div>
              {errors.type && (
                <p className="text-red-500 text-sm mt-2">{errors.type.message}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount" className="text-base font-semibold flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4" />
                金額
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  placeholder=""
                  className="pl-8 text-lg h-12"
                  {...register("amount", { valueAsNumber: true })}
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm mt-2">{errors.amount.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="categoryId" className="text-base font-semibold flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4" />
                カテゴリー
              </Label>
              <select
                id="categoryId"
                {...register("categoryId")}
                className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <Label htmlFor="transactionDate" className="text-base font-semibold flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                日付
              </Label>
              <Input
                id="transactionDate"
                type="date"
                className="h-12 text-base"
                {...register("transactionDate")}
              />
            </div>

            {/* Vendor */}
            <div>
              <Label htmlFor="vendorId" className="text-base font-semibold flex items-center gap-2 mb-2">
                <Building className="h-4 w-4" />
                {type === "INCOME" ? "支払元" : "支払先"}
              </Label>
              <select
                id="vendorId"
                {...register("vendorId")}
                className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {vendors.map((vendor: any) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                支払先を追加する場合は<Link href="/settings/vendors" className="text-blue-600 hover:underline">設定画面</Link>から登録してください
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-base font-semibold flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                メモ
              </Label>
              <textarea
                id="description"
                {...register("description")}
                rows={3}
                placeholder="詳細な説明や補足情報を入力"
                className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="px-6 h-11"
                >
                  キャンセル
                </Button>
              )}
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className={`px-8 h-11 ${
                  type === "INCOME"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {createMutation.isPending ? "登録中..." : "登録する"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
