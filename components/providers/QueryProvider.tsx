"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Always fetch fresh data
            gcTime: 0, // Don't cache data (garbage collection time)
            refetchOnWindowFocus: true, // Refetch when window gains focus
            refetchOnMount: true, // Always refetch on mount
            refetchOnReconnect: true, // Refetch on network reconnect
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
