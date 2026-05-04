import { useFilters } from "./FiltersProvider";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { CalendarIcon, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";

const PLATFORMS = ["Playstore", "iOS", "Google"];
const RATINGS = [1, 2, 3, 4, 5];

export function GlobalFilters({ fetchedAt }: { fetchedAt?: string }) {
  const { filters, setFilters, reset } = useFilters();
  const qc = useQueryClient();

  const togglePlatform = (p: string) => {
    const has = filters.platforms.includes(p);
    setFilters({
      ...filters,
      platforms: has ? filters.platforms.filter((x) => x !== p) : [...filters.platforms, p],
    });
  };
  const toggleRating = (r: number) => {
    const has = filters.ratings.includes(r);
    setFilters({
      ...filters,
      ratings: has ? filters.ratings.filter((x) => x !== r) : [...filters.ratings, r],
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.from ? format(filters.from, "MMM d") : "From"}
            {" – "}
            {filters.to ? format(filters.to, "MMM d") : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: filters.from ?? undefined, to: filters.to ?? undefined }}
            onSelect={(r) =>
              setFilters({ ...filters, from: r?.from ?? null, to: r?.to ?? null })
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            Platform
            {filters.platforms.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {filters.platforms.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {PLATFORMS.map((p) => (
            <DropdownMenuCheckboxItem
              key={p}
              checked={filters.platforms.includes(p)}
              onCheckedChange={() => togglePlatform(p)}
            >
              {p}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            Rating
            {filters.ratings.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {filters.ratings.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {RATINGS.map((r) => (
            <DropdownMenuCheckboxItem
              key={r}
              checked={filters.ratings.includes(r)}
              onCheckedChange={() => toggleRating(r)}
            >
              {r} {r === 1 ? "star" : "stars"}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {(filters.platforms.length > 0 ||
        filters.ratings.length > 0 ||
        filters.from ||
        filters.to) && (
        <Button variant="ghost" size="sm" onClick={reset} className="h-9">
          <X className="mr-1 h-3.5 w-3.5" /> Clear
        </Button>
      )}

      <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
        {fetchedAt && (
          <span className="hidden md:inline">
            Updated {format(new Date(fetchedAt), "HH:mm:ss")}
          </span>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-9"
          onClick={() => qc.invalidateQueries({ queryKey: ["sheets-data"] })}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>
    </div>
  );
}
