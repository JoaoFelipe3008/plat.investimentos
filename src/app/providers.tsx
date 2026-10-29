"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/interactive";
import { useApp } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
            // Em conexões lentas ou offline, mantém o último dado e não fica tentando sem parar.
            networkMode: "online",
          },
        },
      }),
  );
  const motion = useApp((s) => s.settings.motion);

  return (
    <QueryClientProvider client={client}>
      <MotionConfig reducedMotion={motion === "reduzido" ? "always" : "user"}>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
