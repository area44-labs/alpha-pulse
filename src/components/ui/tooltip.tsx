import * as React from "react";

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = "" }: TooltipProps) {
  return (
    <div className={`group relative inline-block ${className}`}>
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-xs -translate-x-1/2 scale-95 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-normal text-gray-50 opacity-0 shadow-md transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 dark:bg-gray-100 dark:text-gray-950">
        {content}
        {/* Triangle arrow */}
        <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-gray-100" />
      </div>
    </div>
  );
}
