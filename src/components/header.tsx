import { Sun, Moon } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";

interface HeaderProps {
  lastUpdated: string;
}

export function Header({ lastUpdated }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Report Identity */}
        <div className="flex items-center space-x-3.5">
          <span className="text-sm font-bold tracking-tight text-foreground">Alpha Pulse</span>
        </div>

        {/* Right navigation items */}
        <div className="flex items-center space-x-4">
          {/* Last updated metadata */}
          <div className="hidden items-center font-mono text-[11px] tracking-tight text-muted-foreground md:flex">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-trend-up-text" />
            Cập nhật: <span className="ml-1 font-semibold text-foreground">{lastUpdated}</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Minimalist Theme toggle button */}
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm border border-border bg-background text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground focus:outline-none"
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
