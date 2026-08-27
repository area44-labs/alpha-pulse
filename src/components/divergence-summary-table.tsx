import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface Stock {
  symbol: string;
  companyName: string;
  sector: string;
  rationale: string;
}

interface DivergenceSummaryTableProps {
  stocks: Stock[];
  onSelectStock?: (stock: Stock) => void;
}

export function DivergenceSummaryTable({ stocks, onSelectStock }: DivergenceSummaryTableProps) {
  const getDivergenceState = (rationale: string) => {
    const has1hBull = rationale.includes("phân kỳ dương khung giờ (1H)");
    const has1dBull = rationale.includes("phân kỳ dương khung ngày (1D)");
    const has1wBull = rationale.includes("phân kỳ dương khung tuần (1W)");

    const has1hBear = rationale.includes("phân kỳ âm khung giờ (1H)");
    const has1dBear = rationale.includes("phân kỳ âm khung ngày (1D)");
    const has1wBear = rationale.includes("phân kỳ âm khung tuần (1W)");

    let state1h = "Không phân kỳ";
    if (has1hBull) state1h = "Phân kỳ Dương (RSI)";
    else if (has1hBear) state1h = "Phân kỳ Âm (RSI/MACD)";

    let state1d = "Không phân kỳ";
    if (has1dBull) state1d = "Phân kỳ Dương (RSI)";
    else if (has1dBear) state1d = "Phân kỳ Âm (RSI/MACD)";

    let state1w = "Không phân kỳ";
    if (has1wBull) state1w = "Phân kỳ Dương (RSI/MACD)";
    else if (has1wBear) state1w = "Phân kỳ Âm (MACD)";

    let summary = "Đồng thuận đà tăng";
    if (has1dBear || has1wBear || has1hBear) {
      const parts = [];
      if (has1hBear) parts.push("1H");
      if (has1dBear) parts.push("1D");
      if (has1wBear) parts.push("1W");
      summary = `Phân kỳ Âm ${parts.join(" & ")}`;
    } else if (has1dBull || has1wBull || has1hBull) {
      const parts = [];
      if (has1hBull) parts.push("1H");
      if (has1dBull) parts.push("1D");
      if (has1wBull) parts.push("1W");
      summary = `Phân kỳ Dương ${parts.join(" & ")}`;
    }

    return { state1h, state1d, state1w, summary };
  };

  const renderBadge = (text: string) => {
    if (text.includes("Dương")) {
      return (
        <span className="inline-flex items-center rounded border border-trend-up-border bg-trend-up-bg px-2 py-0.5 font-mono text-[10px] font-bold text-trend-up-text">
          📈 {text}
        </span>
      );
    }
    if (text.includes("Âm")) {
      return (
        <span className="inline-flex items-center rounded border border-trend-down-border bg-trend-down-bg px-2 py-0.5 font-mono text-[10px] font-bold text-trend-down-text">
          📉 {text}
        </span>
      );
    }
    return <span className="text-[11px] text-muted-foreground">Không phân kỳ</span>;
  };

  return (
    <div className="overflow-x-auto rounded-sm border border-border bg-background transition-colors">
      <Table className="w-full border-collapse text-left">
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/50 font-mono text-[10px] tracking-wider text-muted-foreground uppercase hover:bg-transparent">
            <TableHead className="h-auto px-4 py-3 font-bold text-muted-foreground">
              Mã CP & Ngành
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-center font-bold text-muted-foreground">
              Khung 1H (Giờ)
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-center font-bold text-muted-foreground">
              Khung 1D (Ngày)
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-center font-bold text-muted-foreground">
              Khung 1W (Tuần)
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-center font-bold text-muted-foreground">
              Trạng Thái Tổng Hợp
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border text-xs text-foreground/85">
          {stocks.map((stock) => {
            const { state1h, state1d, state1w, summary } = getDivergenceState(stock.rationale);

            return (
              <TableRow
                key={stock.symbol}
                className="border-b border-border transition-colors duration-150 hover:bg-muted/30"
              >
                <TableCell className="px-4 py-3">
                  <button
                    onClick={() => onSelectStock?.(stock)}
                    className="group flex w-full cursor-pointer flex-col text-left select-none focus:outline-none"
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-foreground group-hover:underline">
                        {stock.symbol}
                      </span>
                      <Badge variant="secondary" className="font-mono text-[9px]">
                        {stock.sector}
                      </Badge>
                    </span>
                    <span className="mt-0.5 max-w-[180px] truncate text-[11px] text-muted-foreground sm:max-w-[240px]">
                      {stock.companyName}
                    </span>
                  </button>
                </TableCell>

                <TableCell className="px-4 py-3 text-center">{renderBadge(state1h)}</TableCell>
                <TableCell className="px-4 py-3 text-center">{renderBadge(state1d)}</TableCell>
                <TableCell className="px-4 py-3 text-center">{renderBadge(state1w)}</TableCell>
                <TableCell className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                      summary.includes("Dương")
                        ? "border border-trend-up-border/60 bg-trend-up-bg/40 text-trend-up-text"
                        : summary.includes("Âm")
                          ? "border border-trend-down-border/60 bg-trend-down-bg/40 text-trend-down-text"
                          : "border border-border bg-muted/40 text-foreground"
                    }`}
                  >
                    {summary}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
