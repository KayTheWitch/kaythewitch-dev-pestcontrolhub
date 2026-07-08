import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  return <Navigate to="/_authenticated" />;
}
