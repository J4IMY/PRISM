import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/moderators")({
  component: () => {
    const mods = [
      { name: "Sara Chen", email: "sara@prism.io", throughput: 142, status: "Active" },
      { name: "Diego Ruiz", email: "diego@prism.io", throughput: 98, status: "Active" },
      { name: "Mira Singh", email: "mira@prism.io", throughput: 0, status: "Suspended" },
    ];
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Moderators</h1>
        <Card><CardContent className="pt-6 flex gap-2">
          <Input placeholder="invite@prism.io" className="max-w-sm" />
          <Button>Invite moderator</Button>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-2">Name</th><th>Email</th><th>Throughput (30d)</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {mods.map((m) => (
                <tr key={m.email} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{m.name}</td>
                  <td className="text-muted-foreground">{m.email}</td>
                  <td>{m.throughput}</td>
                  <td><Badge variant={m.status === "Active" ? "secondary" : "destructive"}>{m.status}</Badge></td>
                  <td><Button size="sm" variant="ghost">Manage</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      </div>
    );
  },
});
