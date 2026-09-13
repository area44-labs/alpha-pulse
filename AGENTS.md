# VN Invest - Guidelines for AI Agents

Chào mừng bạn đến với repository **VN Invest** của **AREA44**. Hướng dẫn này mô tả cấu trúc dự án, data contract, quy trình linting/formatting và testing dành cho AI Agents.

---

## 1. Kiến Trúc Dự Án (Architecture)

Dự án tuân theo mô hình phân tách hoàn toàn giữa tính toán định lượng và hiển thị:

```
Python Quant Pipeline -> JSON Schema Contract -> Generated Static JSON -> React / TanStack Router -> SSG / GitHub Pages
```

```
vn-invest/
├── .github/
│   ├── workflows/
│   │   ├── lint-format.yml          # GitHub Actions lint & format CI
│   │   ├── pages.yml                # GitHub Pages deployment workflow
│   │   └── update-stocks.yml        # Automated daily EOD update workflow
├── schemas/
│   └── recommendations.schema.json  # Canonical JSON Schema Draft 2020-12 v2.0
├── scripts/                         # Backend Python - Pipeline định lượng & báo cáo
│   ├── lib/                         # Core modules (features, regime, recommendation, risk, vietnam_market)
│   ├── tests/                       # Automated unit test suite
│   │   ├── run_tests.py             # Test runner
│   │   ├── test_recommendation.py   # Unit tests for recommendation & anti-lookahead
│   │   ├── test_regime.py           # Unit tests for market regime
│   │   ├── test_risk.py             # Unit tests for T+2.5 risk model
│   │   └── test_schema.py           # Schema validation tests
│   └── generate_report.py           # Report generator script (atomic output write)
├── generated/                       # Static canonical JSON artifacts
│   ├── recommendations.json
│   ├── market.json
│   └── history/
│       ├── index.json
│       └── YYYY-MM-DD.json
├── src/                             # Frontend React + TypeScript
│   ├── components/                  # UI components (market-summary, stock-table, ui/...)
│   ├── data/                        # Static data loader abstraction (loader.ts)
│   ├── hooks/                       # Custom React hooks (use-theme.ts)
│   ├── lib/                         # Formatting utilities (format.ts)
│   ├── pages/                       # Page views (Dashboard.tsx, History.tsx, StockDetail.tsx)
│   ├── routes/                      # TanStack Router file routes (__root.tsx, index.tsx, history.tsx, stock/$symbol.tsx)
│   └── types/                       # TypeScript interfaces mirroring JSON schema (recommendation.ts)
├── pyproject.toml                   # Ruff configuration for Python
├── package.json                     # Frontend dependencies & pnpm scripts
└── requirements.txt                 # Python dependencies (vnstock, pandas, numpy, jsonschema, ruff)
```

---

## 2. Quy Trình Kiểm Tra Code Trước Khi Commit

Agent **bắt buộc** thực hiện các bước kiểm tra sau trước khi hoàn tất commit:

### A. Frontend Verification

```bash
pnpm install
pnpm check
pnpm build
```

### B. Python Quantitative Engine Verification

```bash
python scripts/tests/run_tests.py
ruff check scripts
ruff format --check scripts
python scripts/generate_report.py
```
