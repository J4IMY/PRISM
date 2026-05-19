import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Database, Trash2, Users, Inbox, FileText } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const nav = [
  { to: "/admin/scraper", label: "Scraper queue", icon: Database },
  { to: "/admin/deletions", label: "Deletion requests", icon: Trash2 },
  { to: "/admin/moderators", label: "Moderators", icon: Users },
  { to: "/admin/vendors", label: "Vendor inbox", icon: Inbox },
  { to: "/admin/audit", label: "Audit log", icon: FileText },
] as const;

function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Admin</p>
          <nav className="space-y-1">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeProps={{ className: "bg-secondary text-foreground" }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main><Outlet /></main>
      </div>
    </div>
  );
}
