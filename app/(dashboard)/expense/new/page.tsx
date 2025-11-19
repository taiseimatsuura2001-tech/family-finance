"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { useMemo } from "react";
import { format } from "date-fns";

export default function NewExpensePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // クエリパラメータから日付を取得（yyyy-MM-dd形式の文字列）
  const defaultDate = useMemo(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        return format(parsed, "yyyy-MM-dd");
      }
    }
    return format(new Date(), "yyyy-MM-dd");
  }, [searchParams]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <TransactionForm
        defaultValues={{
          type: "EXPENSE",
          transactionDate: defaultDate
        }}
        onSuccess={() => router.push("/expense")}
        onCancel={() => router.back()}
      />
    </div>
  );
}
