"use client";

import { useRouter } from "next/navigation";
import { TransactionForm } from "@/components/forms/TransactionForm";

export default function NewIncomePage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <TransactionForm
        defaultValues={{ type: "INCOME" }}
        onSuccess={() => router.push("/income")}
        onCancel={() => router.back()}
      />
    </div>
  );
}
