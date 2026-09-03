# Alpha Pulse - Guidelines for AI Agents

Chào mừng bạn đến với repository **Alpha Pulse** của **AREA44**. Đây là hướng dẫn dành cho các AI Agent (Cursor, Claude Code, GitHub Copilot, Windsurf...) nhằm nắm bắt cấu trúc dự án, chạy kiểm tra lint/format và tuân thủ các quy tắc lập trình để phát triển nhanh chóng và chính xác.

---

## 1. Cấu Trúc Dự Án (Project Architecture)

Dự án Alpha Pulse kết hợp **Frontend React 19 (TypeScript, Vite, Tailwind CSS v4, TanStack Router)** và **Backend Định Lượng Python 3.10+ (Vnstock, Pandas, NumPy, JS Schema v2.0)**.

```
alpha-pulse/
├── .github/
│   ├── workflows/
│   │   ├── lint-format.yml          # GitHub Actions lint & format CI
│   │   ├── pages.yml                # GitHub Pages deployment workflow
│   │   └── update-stocks.yml        # Daily EOD automated stock update workflow
├── schemas/
│   └── recommendations.schema.json  # JSON Schema Draft 2020-12 v2.0 cho báo cáo khuyến nghị
├── scripts/                         # Backend Python - Pipeline định lượng & báo cáo
│   ├── lib/                         # Thư viện mô-đun hóa lõi
│   │   ├── features.py              # Tính toán chỉ báo kỹ thuật (RSI, MACD, MA) & phân kỳ đa khung thời gian
│   │   ├── recommendation.py        # Thuật toán chấm điểm định lượng (Quant Score) & lập kế hoạch giao dịch
│   │   ├── regime.py                # Động cơ nhận diện trạng thái thị trường (STRONG_BULL, BULL, DEFENSIVE, BEAR, PANIC)
│   │   ├── risk.py                  # Mô hình rủi ro T+2.5 (Historical VaR 95%, Expected Shortfall, Floor Hit, Liquidity)
│   │   └── vietnam_market.py        # Chuẩn hóa mã cổ phiếu (HOSE, HNX, UPCoM), lấy dữ liệu EOD qua vnstock
│   ├── tests/                       # Bộ kiểm thử tự động Python
│   │   ├── run_tests.py             # Runner kích hoạt toàn bộ unit tests
│   │   ├── test_backtest.py         # Kiểm thử động cơ backtest T+2.5
│   │   ├── test_recommendation.py   # Kiểm thử logic phân loại hành động (BUY, WATCH, HOLD, SELL, AVOID)
│   │   ├── test_regime.py           # Kiểm thử nhận diện trạng thái thị trường
│   │   ├── test_risk.py             # Kiểm thử thông số rủi ro
│   │   └── test_schema.py           # Kiểm thử tính hợp lệ của dữ liệu với JSON Schema v2.0
│   ├── audit_trail_schema.sql       # Schema SQL PostgreSQL/Supabase lưu vết giao dịch & trượt giá (Slippage)
│   ├── backtest.py                  # Động cơ Backtest danh mục T+2.5 (VietnamPortfolioBacktester)
│   ├── generate_report.py           # Script tạo báo cáo JSON chuẩn schema v2.0 dưới generated/
│   └── update_stocks.py             # Script cập nhật giá EOD hằng ngày & xuất src/data/stocks.json
├── src/                             # Frontend React + TypeScript
│   ├── components/                  # Các component giao diện
│   │   ├── ui/                      # Base UI / shadcn headless components
│   │   ├── header.tsx               # Thanh điều hướng chính & toggle theme
│   │   ├── market-summary.tsx       # Bảng tổng quan chỉ số thị trường (VN-Index, VN30, HNX, UPCoM)
│   │   ├── securities-table.tsx     # Bảng đồng thuận khuyến nghị từ các công ty chứng khoán
│   │   ├── stock-detail-modal.tsx   # Modal xem chi tiết phân tích mã cổ phiếu
│   │   └── stock-table.tsx          # Bảng danh sách khuyến nghị giao dịch hằng ngày
│   ├── data/                        # Dữ liệu JSON tĩnh ban đầu
│   │   ├── agent_signals.json       # Tín hiệu đầu ra cho AI Agents
│   │   ├── securities-recommendations.json # Khuyến nghị từ các công ty chứng khoán
│   │   └── stocks.json              # Dữ liệu phân tích 12 cổ phiếu tiêu biểu
│   ├── hooks/                       # Custom React hooks
│   ├── lib/                         # Utilities (utils.ts)
│   ├── pages/                       # Các trang chính (Dashboard.tsx, History.tsx, StockDetail.tsx)
│   ├── routes/                      # Route file-based cho TanStack Router (__root.tsx, index.tsx)
│   ├── App.tsx                      # Component chính tích hợp state & dữ liệu
│   ├── index.css                    # Tailwind CSS v4 entrypoint & hệ thống biến màu OKLCH
│   ├── main.tsx                     # Entrypoint React 19
│   └── router.tsx                   # Cấu hình TanStack Router
├── pyproject.toml                   # Cấu hình linter Ruff cho Python
├── package.json                     # Quản lý dependencies Frontend & npm scripts
└── requirements.txt                 # Dependencies Python (vnstock, pandas, numpy, jsonschema, ruff)
```

---

## 2. Hướng Dẫn Run Format Code & Lint Trước Khi Commit

Để đảm bảo mã nguồn tuân thủ tiêu chuẩn và không làm hỏng CI/CD workflows, Agent **bắt buộc** thực hiện các câu lệnh kiểm tra dưới đây trước khi commit code.

### A. Frontend (JavaScript / TypeScript / React)

Sử dụng `pnpm` để quản lý packages và công cụ `oxlint` + `oxfmt` cho tốc độ kiểm tra cực nhanh:

```bash
# 1. Cài đặt dependencies (nếu chưa cài)
pnpm install

# 2. Kiểm tra đồng thời Linting và Formatting
pnpm check

# 3. Tự động sửa định dạng code (Format JS/TS/JSX/TSX)
pnpm fmt

# 4. Kiểm tra Linting
pnpm lint

# 5. Kiểm tra build dự án
pnpm build
```

### B. Backend (Python)

Sử dụng `ruff` cho linting & formatting, và `unittest` cho bộ kiểm thử:

```bash
# 1. Cài đặt Python dependencies
pip install -r requirements.txt

# 2. Chạy toàn bộ Unit Tests kiểm tra logic định lượng & schema
python scripts/tests/run_tests.py

# 3. Kiểm tra Linting mã Python
ruff check scripts

# 4. Kiểm tra định dạng code Python (Formatting check)
ruff format --check scripts

# 5. Tự động định dạng lại mã Python
ruff format scripts
```

### C. Pre-Commit Checklist Nhanh (Dành cho Agent)

Trước khi gửi commit hoặc yêu cầu submit:

1. Sửa lỗi/tính năng theo yêu cầu.
2. Chạy `pnpm check` (đảm bảo 0 lỗi JS/TS).
3. Chạy `ruff check scripts && ruff format --check scripts` (đảm bảo 0 lỗi Python).
4. Chạy `python scripts/tests/run_tests.py` (đảm bảo 13/13 unit tests PASS).
