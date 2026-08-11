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
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-xs -translate-x-1/2 scale-95 rounded-sm border border-gray-800 bg-gray-950 px-2.5 py-1 text-[10px] leading-relaxed font-medium text-gray-50 opacity-0 shadow-md transition-all duration-150 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 dark:border-gray-200 dark:bg-gray-50 dark:text-gray-950">
        {content}
        {/* Triangle arrow */}
        <div className="absolute top-full left-1/2 -mt-1 h-1.5 w-1.5 -translate-x-1/2 rotate-45 border-r border-b border-gray-800 bg-gray-950 dark:border-gray-200 dark:bg-gray-50" />
      </div>
    </div>
  );
}
