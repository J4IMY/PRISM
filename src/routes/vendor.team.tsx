import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Pencil, UserPlus, Mail } from "lucide-react";
import { ROLE_LABELS, OWNER_ROLE, TEAM_ROLES } from "@/lib/team-roles";

export const Route = createFileRoute("/vendor/team")({
  component: VendorTeamPage,
});

type Member = {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: string;
  can_manage_systems: boolean;
  can_manage_team: boolean;
  can_respond_messages: boolean;
};

type Invite = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
};

function RoleSelectItems() {
  return (
    <>
      {TEAM_ROLES.map((role) => (
        <SelectItem key={role} value={role}>
          {ROLE_LABELS[role]}
        </SelectItem>
      ))}
    </>
  );
}

function permsFor(m: Member): string[] {
  if (m.role === OWNER_ROLE) return ["All access"];
  const perms: string[] = [];
  if (m.can_manage_systems) perms.push("Manage systems");
  if (m.can_manage_team) perms.push("Manage team");
  if (m.can_respond_messages) perms.push("Respond to messages");
  return perms.length ? perms : ["No access"];
}

function initials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function VendorTeamPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [canManageTeam, setCanManageTeam] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("support");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [manageOpen, setManageOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [editRole, setEditRole] = useState("member");
  const [editSystems, setEditSystems] = useState(false);
  const [editTeam, setEditTeam] = useState(false);
  const [editMessages, setEditMessages] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [manageError, setManageError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vendors/team", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load team");
        return;
      }
      setMembers(data.members ?? []);
      setInvites(data.invites ?? []);
      setCanManageTeam(!!data.canManageTeam);
    } catch {
      setError("Failed to load team");
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
    setSuccess("");
    try {
      const res = await fetch("/api/vendors/team", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to invite");
        return;
      }
      setInviteEmail("");
      setInviteRole("member");
      setSuccess("Invite sent.");
      await load();
    } catch {
      setError("Failed to invite");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEditRoleChange = (role: string) => {
    setEditRole(role);
    if (role === OWNER_ROLE) {
      setEditSystems(true);
      setEditTeam(true);
      setEditMessages(true);
    }
  };

  const openManage = (m: Member) => {
    setEditing(m);
    setEditRole(m.role);
    setEditSystems(m.can_manage_systems);
    setEditTeam(m.can_manage_team);
    setEditMessages(m.can_respond_messages);
    setManageError("");
    setManageOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaveLoading(true);
    setManageError("");
    try {
      const res = await fetch(`/api/vendors/team/${editing.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole,
          can_manage_systems: editSystems,
          can_manage_team: editTeam,
          can_respond_messages: editMessages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setManageError(data.error ?? "Failed to update member");
        return;
      }
      setManageOpen(false);
      setSuccess("Member updated.");
      await load();
    } catch {
      setManageError("Failed to update member");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRemoveMember = async (m: Member) => {
    if (!confirm(`Remove ${m.name || m.email} from the team?`)) return;
    try {
      const res = await fetch(`/api/vendors/team/${m.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to remove member");
        return;
      }
      setSuccess("Member removed.");
      await load();
    } catch {
      setError("Failed to remove member");
    }
  };

  const handleRevokeInvite = async (invite: Invite) => {
    try {
      const res = await fetch(`/api/vendors/team/invites/${invite.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to revoke invite");
        return;
      }
      setSuccess("Invite revoked.");
      await load();
    } catch {
      setError("Failed to revoke invite");
    }
  };

  const handleUpdateInviteRole = async (invite: Invite, role: string) => {
    try {
      const res = await fetch(`/api/vendors/team/invites/${invite.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update invite");
        return;
      }
      setSuccess("Invite updated.");
      await load();
    } catch {
      setError("Failed to update invite");
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading team…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Team</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <Card>
        <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="invite_email">Invite by email</Label>
            <Input
              id="invite_email"
              type="email"
              placeholder="invite@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={!canManageTeam}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={inviteRole} onValueChange={setInviteRole} disabled={!canManageTeam}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <RoleSelectItems />
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            onClick={handleInvite}
            disabled={!canManageTeam || inviteLoading || !inviteEmail}
            className="gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {inviteLoading ? "Sending…" : "Send invite"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Members</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 font-medium">Member</th>
                    <th className="font-medium">Role</th>
                    <th className="font-medium">Permissions</th>
                    <th className="font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="py-3 flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback>{initials(m.name, m.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{m.name || m.email}</div>
                          <div className="text-xs text-muted-foreground">{m.email}</div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={m.role === OWNER_ROLE ? "default" : "secondary"}>
                          {ROLE_LABELS[m.role] ?? m.role}
                        </Badge>
                      </td>
                      <td className="space-x-1">
                        {permsFor(m).map((p) => (
                          <Badge key={p} variant="outline">
                            {p}
                          </Badge>
                        ))}
                      </td>
                      <td>
                        {canManageTeam ? (
                          <Button size="sm" variant="ghost" onClick={() => openManage(m)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Manage
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Pending invites</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{invite.email}</span>
                {canManageTeam ? (
                  <>
                    <Select
                      value={invite.role}
                      onValueChange={(role) => handleUpdateInviteRole(invite, role)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <RoleSelectItems />
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => handleRevokeInvite(invite)}
                    >
                      Revoke
                    </Button>
                  </>
                ) : (
                  <Badge variant="outline">{ROLE_LABELS[invite.role] ?? invite.role}</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Sheet open={manageOpen} onOpenChange={setManageOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Manage member</SheetTitle>
            <SheetDescription>
              {editing ? `${editing.name || editing.email} · ${editing.email}` : ""}
            </SheetDescription>
          </SheetHeader>
          {manageError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {manageError}
            </div>
          )}
          {editing && (
            <form onSubmit={handleSaveMember} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={handleEditRoleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <RoleSelectItems />
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Manage systems</p>
                    <p className="text-xs text-muted-foreground">
                      Edit products and their details.
                    </p>
                  </div>
                  <Switch
                    checked={editSystems}
                    onCheckedChange={setEditSystems}
                    disabled={editRole === OWNER_ROLE}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Manage team</p>
                    <p className="text-xs text-muted-foreground">Invite and manage members.</p>
                  </div>
                  <Switch
                    checked={editTeam}
                    onCheckedChange={setEditTeam}
                    disabled={editRole === OWNER_ROLE}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Respond to messages</p>
                    <p className="text-xs text-muted-foreground">Reply to buyer conversations.</p>
                  </div>
                  <Switch
                    checked={editMessages}
                    onCheckedChange={setEditMessages}
                    disabled={editRole === OWNER_ROLE}
                  />
                </div>
              </div>

              <SheetFooter className="px-0 flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleRemoveMember(editing)}
                  className="gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
                <Button type="submit" disabled={saveLoading}>
                  {saveLoading ? "Saving…" : "Save changes"}
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
