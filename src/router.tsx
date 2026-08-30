import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export function createApplicationRouter() {
  const router = createRouter({
    routeTree,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createApplicationRouter>;
  }
}
