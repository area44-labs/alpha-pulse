import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-mono tracking-wider uppercase transition-colors focus:outline-none focus:ring-1 focus:ring-gray-950 dark:focus:ring-gray-300";

  const variants = {
    default: "border-transparent bg-gray-950 text-gray-50 dark:bg-gray-50 dark:text-gray-950",
    secondary: "border-transparent bg-gray-100 text-gray-850 dark:bg-gray-900 dark:text-gray-200",
    destructive:
      "border-transparent bg-red-50 text-red-600 border border-red-200/50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30",
    success:
      "border-transparent bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30",
    warning:
      "border-transparent bg-amber-50 text-amber-600 border border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30",
    info: "border-transparent bg-blue-50 text-blue-600 border border-blue-200/50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30",
    outline: "text-gray-950 border border-gray-200 dark:text-gray-50 dark:border-gray-800",
  };

  const variantStyle = variants[variant] || variants.default;

  return <span className={`${baseStyles} ${variantStyle} ${className}`} {...props} />;
}
