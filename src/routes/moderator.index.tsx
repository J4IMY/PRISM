import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/moderator/")({
  component: () => (
    <div>
      <h1 className="text-2xl font-semibold">Moderator</h1>
      <p className="text-muted-foreground mt-2">
        Open your <Link to="/moderator/queue" className="underline">queue</Link> to review scraped items.
      </p>
    </div>
  ),
});
