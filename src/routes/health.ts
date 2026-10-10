import { createFileRoute } from "@tanstack/react-router";
import { handle, json } from "@/lib/http.server";

// Liveness: process is up. No dependencies checked.
export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: handle(async ({ request }) =>
        json(request, { status: "ok", service: "nevon-pay", time: new Date().toISOString() }),
      ),
    },
  },
});
