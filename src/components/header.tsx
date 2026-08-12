import { Sun, Moon } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";

interface HeaderProps {
  lastUpdated: string;
}

export function Header({ lastUpdated }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md transition-colors dark:border-gray-900 dark:bg-black/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Report Identity */}
        <div className="flex items-center space-x-3.5">
          <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Alpha Pulse
          </span>
        </div>

        {/* Right navigation items */}
        <div className="flex items-center space-x-4">
          {/* Last updated metadata */}
          <div className="hidden items-center font-mono text-[11px] tracking-tight text-gray-500 md:flex dark:text-gray-400">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Cập nhật:{" "}
            <span className="ml-1 font-semibold text-gray-900 dark:text-white">{lastUpdated}</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Minimalist Theme toggle button */}
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-900 focus:outline-none dark:border-gray-800 dark:bg-black dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white"
              title={theme === "light" ? "Chuyển sang chế độ tối" : "Chuyển sang chế độ sáng"}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
