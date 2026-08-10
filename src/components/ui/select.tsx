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
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pr-10 pl-3 text-sm transition-colors duration-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";
