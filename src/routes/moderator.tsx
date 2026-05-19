import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { ListChecks } from "lucide-react";

export const Route = createFileRoute("/moderator")({
  component: ModeratorLayout,
});

function ModeratorLayout() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Moderator</p>
          <nav className="space-y-1">
            <Link to="/moderator/queue" activeProps={{ className: "bg-secondary text-foreground" }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
              <ListChecks className="h-4 w-4" />My queue
            </Link>
          </nav>
        </aside>
        <main><Outlet /></main>
      </div>
    </div>
  );
}
