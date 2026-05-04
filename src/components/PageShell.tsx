import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { GlobalFilters } from "./GlobalFilters";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Loader2, AlertTriangle, RefreshCw, Wifi } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PageShell({ title, subtitle, children }: Props) {
  const { data, isLoading, isFetching, error } = useSheetsData();
  const qc = useQueryClient();

  const isRateLimit = (error as Error)?.message?.includes("non-2xx");
  const isNetwork   = (error as Error)?.message?.includes("Failed to fetch");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[image:var(--gradient-subtle)]">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-card/80 backdrop-blur sticky top-0 z-10 flex items-center px-4 gap-3">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
            {(isLoading || isFetching) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="hidden md:inline">Syncing…</span>
              </div>
            )}
          </header>
          <div className="px-4 md:px-6 py-4 border-b bg-card/40">
            <GlobalFilters fetchedAt={data?.fetchedAt} />
          </div>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            {error && !data ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="panel p-8 max-w-md w-full text-center space-y-4">
                  <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                    {isNetwork
                      ? <Wifi className="h-7 w-7 text-red-500" />
                      : <AlertTriangle className="h-7 w-7 text-red-500" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {isRateLimit ? "Supabase Edge Function Error" : isNetwork ? "Network Error" : "Failed to Load Data"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {isRateLimit
                        ? "The Edge Function returned an error. This can happen if the Google Sheets API key has expired or the function isn't deployed."
                        : isNetwork
                        ? "Could not reach Supabase. Check your internet connection."
                        : (error as Error).message}
                    </p>
                  </div>
                  <button
                    onClick={() => qc.invalidateQueries({ queryKey: ["sheets-data"] })}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                  >
                    <RefreshCw className="h-4 w-4" /> Retry Now
                  </button>
                  <p className="text-xs text-gray-400">Will auto-retry every 30 seconds</p>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
