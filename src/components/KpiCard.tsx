import { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "destructive";
}

export function KpiCard({ label, value, hint, icon, tone = "default" }: Props) {
  const toneClass = {
    default: "text-primary bg-accent",
    success: "text-success bg-[hsl(var(--success)/0.12)]",
    warning: "text-warning bg-[hsl(var(--warning)/0.12)]",
    destructive: "text-destructive bg-[hsl(var(--destructive)/0.12)]",
  }[tone];

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneClass}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
