"use client";

import { useRouter } from "next/navigation";
import { TransactionForm } from "@/components/forms/TransactionForm";

export default function NewExpensePage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <TransactionForm
        defaultValues={{ type: "EXPENSE" }}
        onSuccess={() => router.push("/expense")}
        onCancel={() => router.back()}
      />
    </div>
  );
}
