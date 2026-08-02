import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/moderator/")({
  component: ModeratorIndexPage,
});

function ModeratorIndexPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Moderator</h1>
      <p className="text-muted-foreground">Choose a queue to get started.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/moderator/scraper"
          className="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-secondary transition-colors"
        >
          <Database className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Scraper queue</p>
            <p className="text-xs text-muted-foreground">Review and bid on scraped systems</p>
          </div>
        </Link>
        <Link
          to="/moderator/cleaning-queue"
          className="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-secondary transition-colors"
        >
          <ClipboardList className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Cleaning queue</p>
            <p className="text-xs text-muted-foreground">Clean and publish assigned systems</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
