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
          <label className="mb-1.5 block font-mono text-[10px] tracking-wider text-gray-500 uppercase dark:text-gray-400">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full cursor-pointer appearance-none rounded-sm border border-gray-200 bg-white py-2 pr-10 pl-3 text-xs transition-colors duration-200 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-100 dark:focus:ring-gray-100 ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500">
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";
