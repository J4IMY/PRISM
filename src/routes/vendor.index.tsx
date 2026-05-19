import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/vendor/")({
  component: () => (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Vendor dashboard</h1>
      <p className="text-muted-foreground">Pick a section from the sidebar to manage your company, systems, team, or inbox.</p>
    </div>
  ),
});
