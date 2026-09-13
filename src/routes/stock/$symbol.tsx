import { createFileRoute } from "@tanstack/react-router";

import { StockDetail } from "@/pages/StockDetail";

export const Route = createFileRoute("/stock/$symbol")({
  component: StockDetailRouteComponent,
});

function StockDetailRouteComponent() {
  const { symbol } = Route.useParams();
  return <StockDetail symbol={symbol} />;
}
