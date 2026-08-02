import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/admin/moderators")({
  component: AdminModeratorsPage,
});

type Moderator = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  suspended: boolean;
  throughput: number;
  created_at: string;
};

export default function AdminModeratorsPage() {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/moderators", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load moderators");
        return;
      }
      setModerators(data.moderators ?? []);
    } catch {
      setError("Failed to load moderators");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/moderators", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to invite");
        return;
      }
      setInviteEmail("");
      setInviteName("");
      await load();
    } catch {
      setError("Failed to invite");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (m: Moderator) => {
    if (!confirm(`Remove moderator ${m.email}?`)) return;
    try {
      const res = await fetch(`/api/admin/moderators/${m.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to remove");
        return;
      }
      await load();
    } catch {
      setError("Failed to remove");
    }
  };

  const handleSuspend = async (m: Moderator) => {
    const action = m.suspended ? "Unsuspend" : "Suspend";
    if (!confirm(`${action} ${m.email}?`)) return;
    try {
      const res = await fetch(`/api/admin/moderators/${m.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended: !m.suspended }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update status");
        return;
      }
      await load();
    } catch {
      setError("Failed to update status");
    }
  };

  const handleGrantAdmin = async (m: Moderator) => {
    if (!confirm(`Grant admin privileges to ${m.email}?`)) return;
    try {
      const res = await fetch(`/api/admin/moderators/${m.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to grant admin");
        return;
      }
      await load();
    } catch {
      setError("Failed to grant admin");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Moderators</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="invite_email">Email</Label>
            <Input
              id="invite_email"
              type="email"
              placeholder="moderator@prism.io"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite_name">Name</Label>
            <Input
              id="invite_name"
              placeholder="Optional"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />
          </div>
          <Button onClick={handleInvite} disabled={inviteLoading || !inviteEmail}>
            {inviteLoading ? "Creating…" : "Add moderator"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : moderators.length === 0 ? (
            <p className="text-sm text-muted-foreground">No moderators yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 font-medium">Name</th>
                    <th className="font-medium">Email</th>
                    <th className="font-medium">Published</th>
                    <th className="font-medium">Status</th>
                    <th className="font-medium">Role</th>
                    <th className="font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {moderators.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">{m.name || "—"}</td>
                      <td className="text-muted-foreground">{m.email}</td>
                      <td className="text-muted-foreground">{m.throughput}</td>
                      <td>
                        <Badge variant={m.suspended ? "destructive" : "success"}>
                          {m.suspended ? "Suspended" : "Active"}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant="secondary">{m.role}</Badge>
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">Manage</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSuspend(m)}>
                              {m.suspended ? "Unsuspend" : "Suspend"}
                            </DropdownMenuItem>
                            {m.role !== "admin" && (
                              <DropdownMenuItem onClick={() => handleGrantAdmin(m)}>
                                Grant admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemove(m)}
                              className="text-red-600"
                            >
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
