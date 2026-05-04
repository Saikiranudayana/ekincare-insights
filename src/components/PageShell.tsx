import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { GlobalFilters } from "./GlobalFilters";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Loader2 } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PageShell({ title, subtitle, children }: Props) {
  const { data, isLoading, error } = useSheetsData();

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
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </header>
          <div className="px-4 md:px-6 py-4 border-b bg-card/40">
            <GlobalFilters fetchedAt={data?.fetchedAt} />
          </div>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            {error ? (
              <div className="panel p-6 text-sm text-destructive">
                Failed to load data: {(error as Error).message}
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
