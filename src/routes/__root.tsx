import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import "@/index.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VN VN Invest - Khuyến Nghị Giao Dịch Chứng Khoán" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <Outlet />
      <Scripts />
    </>
  );
}
