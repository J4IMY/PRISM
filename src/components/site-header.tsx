import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Search,
  Heart,
  User,
  LayoutDashboard,
  ShieldCheck,
  GavelIcon,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/lib/auth-client";
import type { AuthUser } from "@/lib/auth";

export function SiteHeader({ user }: { user?: AuthUser | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.invalidate();
    router.navigate({ to: "/" });
  };

  const showVendor = user && ["vendor", "admin"].includes(user.role);
  const showAdmin = user?.role === "admin";
  const showModerator = user && ["moderator", "admin"].includes(user.role);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <img src="/prism_logo.png" alt="PRISM" className="h-6 w-6 rounded object-contain" />
          <span>PRISM</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground overflow-x-auto">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground font-medium" }}
            className="hover:text-foreground inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors"
          >
            <Search className="h-4 w-4" /> Discover
          </Link>
          <Link
            to="/chats"
            activeProps={{ className: "text-foreground font-medium" }}
            className="hover:text-foreground inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors"
          >
            <MessageSquare className="h-4 w-4" /> Messages
          </Link>
          {user && (
            <Link
              to="/watchlist"
              activeProps={{ className: "text-foreground font-medium" }}
              className="hover:text-foreground inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors"
            >
              <Heart className="h-4 w-4" /> Watchlist
            </Link>
          )}
          {showVendor && (
            <Link
              to="/vendor"
              activeProps={{ className: "text-foreground font-medium" }}
              className="hover:text-foreground inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" /> Vendor
            </Link>
          )}
          {showAdmin && (
            <Link
              to="/admin"
              activeProps={{ className: "text-foreground font-medium" }}
              className="hover:text-foreground inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors"
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          {showModerator && (
            <Link
              to="/moderator"
              activeProps={{ className: "text-foreground font-medium" }}
              className="hover:text-foreground inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors"
            >
              <GavelIcon className="h-4 w-4" /> Moderator
            </Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {user.username ? `@${user.username}` : (user.name ?? user.email)}
              </span>
              <Button asChild variant="outline" size="icon" className="h-9 w-9">
                <Link to="/profile" aria-label="Profile">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sign out" className="h-9 w-9">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
