import { ChevronDown } from "lucide-react";
import * as React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, children, ...props }, ref) => {
    return (
      <div className="relative inline-block w-full">
        {label && (
          <label className="mb-1.5 block font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`dark:text-gray-150 flex h-8 w-full cursor-pointer appearance-none rounded-lg border border-input bg-white px-2.5 py-1 pr-10 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50 ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";
