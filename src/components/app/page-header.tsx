import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function PageHeader({ title, description, action, icon }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-hermes shadow-[var(--shadow-elegant)]">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{title}</h1>
            {description && (
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>
      {action}
    </div>
  );
}
