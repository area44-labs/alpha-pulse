import { createFileRoute } from "@tanstack/react-router";

import { Methodology } from "@/pages/Methodology";

export const Route = createFileRoute("/methodology")({
  component: MethodologyRouteComponent,
});

function MethodologyRouteComponent() {
  return <Methodology />;
}
