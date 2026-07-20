export const TEAM_ROLES = ["dev", "sales", "support"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  dev: "Dev",
  sales: "Sales",
  support: "Support",
};

export const OWNER_ROLE: TeamRole = "dev";

export function isOwnerRole(role: string): boolean {
  return role === OWNER_ROLE;
}

export type TeamPermissions = {
  can_manage_systems: boolean;
  can_manage_team: boolean;
  can_respond_messages: boolean;
};

export function permissionsForRole(role: string): TeamPermissions {
  switch (role) {
    case "dev":
      return { can_manage_systems: true, can_manage_team: true, can_respond_messages: true };
    case "sales":
      return { can_manage_systems: true, can_manage_team: false, can_respond_messages: false };
    case "support":
      return { can_manage_systems: false, can_manage_team: false, can_respond_messages: true };
    default:
      return { can_manage_systems: false, can_manage_team: false, can_respond_messages: false };
  }
}
