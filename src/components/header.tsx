import { Sun, Moon, TrendingUp, ShieldAlert, BookOpen, User } from "lucide-react";

import { useTheme } from "../hooks/use-theme";
import { DropdownMenu, DropdownMenuItem } from "./ui/dropdown-menu";

interface HeaderProps {
  lastUpdated: string;
}

export function Header({ lastUpdated }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-white/80 backdrop-blur-md transition-all duration-300 dark:border-gray-800/80 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:bg-indigo-500 dark:shadow-none">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-950 dark:text-gray-50">
              Alpha Pulse
            </h1>
            <p className="hidden text-xs font-medium text-gray-500 sm:block dark:text-gray-400">
              Khuyến nghị giao dịch cổ phiếu hàng ngày
            </p>
          </div>
        </div>

        {/* Right navigation items */}
        <div className="flex items-center space-x-4">
          {/* Last updated badge */}
          <div className="hidden items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 md:flex dark:bg-gray-800 dark:text-gray-300">
            <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Cập nhật lần cuối:{" "}
            <strong className="ml-1 text-gray-950 dark:text-white">{lastUpdated}</strong>
          </div>

          <div className="flex items-center space-x-2">
            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-xs transition-colors hover:bg-gray-50 hover:text-gray-900 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              title={theme === "light" ? "Chuyển sang chế độ Tối" : "Chuyển sang chế độ Sáng"}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-4.5 w-4.5" />
              ) : (
                <Sun className="h-4.5 w-4.5" />
              )}
            </button>

            {/* Profile Avatar and Menu using our DropdownMenu component */}
            <DropdownMenu
              trigger={
                <button
                  type="button"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 transition-all hover:ring-2 hover:ring-indigo-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                  aria-label="User menu"
                >
                  <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                    AP
                  </div>
                </button>
              }
              align="right"
            >
              <div className="mb-1 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-950 dark:text-gray-100">
                  Alpha Investor
                </p>
                <p className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                  investor@alphapulse.vn
                </p>
              </div>
              <DropdownMenuItem onClick={() => alert("Chức năng đang phát triển!")}>
                <User className="mr-2 h-4 w-4 text-gray-400" />
                <span>Tài khoản cá nhân</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => alert("Hướng dẫn sử dụng hệ thống lọc & khuyến nghị Alpha Pulse.")}
              >
                <BookOpen className="mr-2 h-4 w-4 text-gray-400" />
                <span>Hướng dẫn sử dụng</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "light" ? (
                  <Moon className="mr-2 h-4 w-4 text-gray-400" />
                ) : (
                  <Sun className="mr-2 h-4 w-4 text-gray-400" />
                )}
                <span>Giao diện {theme === "light" ? "Tối" : "Sáng"}</span>
              </DropdownMenuItem>
              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
              <DropdownMenuItem
                onClick={() => alert("Sản phẩm thuộc cộng đồng Alpha Pulse Vietnam.")}
              >
                <ShieldAlert className="mr-2 h-4 w-4 text-red-500" />
                <span className="text-red-500">Miễn trừ trách nhiệm</span>
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
