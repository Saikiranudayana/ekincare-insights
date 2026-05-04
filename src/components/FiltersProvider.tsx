import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { Filters, defaultFilters } from "@/lib/utils-data";

interface Ctx {
  filters: Filters;
  setFilters: (f: Filters) => void;
  reset: () => void;
}
const FiltersContext = createContext<Ctx | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const value = useMemo(
    () => ({ filters, setFilters, reset: () => setFilters(defaultFilters) }),
    [filters]
  );
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const c = useContext(FiltersContext);
  if (!c) throw new Error("useFilters must be inside FiltersProvider");
  return c;
}
