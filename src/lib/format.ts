/**
 * Shared formatting utilities for VN Invest UI.
 * Standard price unit is VNĐ/share across Python backend and frontend contracts.
 */

/**
 * Formats a monetary value in VNĐ.
 */
export function formatVnd(val: number | null | undefined): string {
  if (val == null || Number.isNaN(val)) return "—";
  return `${Math.round(val).toLocaleString("vi-VN")} VNĐ`;
}

/**
 * Formats a percentage value (e.g. 0.052 -> +5.2% or 5.2% depending on sign).
 */
export function formatPercent(val: number | null | undefined, includeSign = true): string {
  if (val == null || Number.isNaN(val)) return "—";
  const sign = includeSign && val > 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}

/**
 * Formats a score value (0-100).
 */
export function formatScore(val: number | null | undefined): string {
  if (val == null || Number.isNaN(val)) return "—";
  return val.toFixed(1);
}

/**
 * Formats an ISO date string or YYYY-MM-DD into display format.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  if (dateStr.includes("T")) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  return dateStr;
}

/**
 * Returns human readable risk label.
 */
export function formatRisk(risk: "LOW" | "MEDIUM" | "HIGH" | null | undefined): string {
  switch (risk) {
    case "LOW":
      return "Rủi ro Thấp";
    case "MEDIUM":
      return "Rủi ro Trung bình";
    case "HIGH":
      return "Rủi ro Cao";
    default:
      return "Chưa xác định";
  }
}
