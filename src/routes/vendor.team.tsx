import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/vendor/team")({
  component: VendorTeamPage,
});

const members = [
  { name: "Alex Kim", email: "alex@nimbus.example", role: "Owner", perms: ["All access"] },
  { name: "Priya Patel", email: "priya@nimbus.example", role: "Member", perms: ["Edit systems", "Chat"] },
  { name: "Marcus Lee", email: "marcus@nimbus.example", role: "Member", perms: ["Chat"] },
];

function VendorTeamPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Team</h1>
      <Card><CardContent className="pt-6 flex gap-2">
        <Input placeholder="invite@company.com" className="max-w-sm" />
        <Button>Send invite</Button>
      </CardContent></Card>
      <Card><CardContent className="pt-6">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="py-2">Member</th><th>Role</th><th>Permissions</th><th></th>
          </tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.email} className="border-b border-border last:border-0">
                <td className="py-3 flex items-center gap-2">
                  <Avatar className="h-7 w-7"><AvatarFallback>{m.name.split(" ").map(s=>s[0]).join("")}</AvatarFallback></Avatar>
                  <div><div className="font-medium">{m.name}</div><div className="text-xs text-muted-foreground">{m.email}</div></div>
                </td>
                <td><Badge variant={m.role === "Owner" ? "default" : "secondary"}>{m.role}</Badge></td>
                <td className="space-x-1">{m.perms.map(p=><Badge key={p} variant="outline">{p}</Badge>)}</td>
                <td><Button size="sm" variant="ghost">Manage</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
