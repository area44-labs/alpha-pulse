import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  const variants = {
    default:
      "border-transparent bg-gray-900 text-gray-50 hover:bg-gray-900/80 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/80",
    secondary:
      "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80",
    destructive:
      "border-transparent bg-red-100 text-red-700 hover:bg-red-100/80 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40",
    success:
      "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/40",
    warning:
      "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100/80 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/40",
    info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/40",
    outline: "text-gray-950 border border-gray-200 dark:text-gray-50 dark:border-gray-800",
  };

  const variantStyle = variants[variant] || variants.default;

  return <span className={`${baseStyles} ${variantStyle} ${className}`} {...props} />;
}
