import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Search, Heart, User, LayoutDashboard, ShieldCheck, GavelIcon } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-6 w-6 rounded bg-primary" />
          <span>PRISM</span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }} className="hover:text-foreground inline-flex items-center gap-1">
            <Search className="h-4 w-4" /> Discover
          </Link>
          <Link to="/watchlist" activeProps={{ className: "text-foreground" }} className="hover:text-foreground inline-flex items-center gap-1">
            <Heart className="h-4 w-4" /> Watchlist
          </Link>
          <Link to="/vendor" activeProps={{ className: "text-foreground" }} className="hover:text-foreground inline-flex items-center gap-1">
            <LayoutDashboard className="h-4 w-4" /> Vendor
          </Link>
          <Link to="/admin" activeProps={{ className: "text-foreground" }} className="hover:text-foreground inline-flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" /> Admin
          </Link>
          <Link to="/moderator" activeProps={{ className: "text-foreground" }} className="hover:text-foreground inline-flex items-center gap-1">
            <GavelIcon className="h-4 w-4" /> Moderator
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth/signup">Sign up</Link>
          </Button>
          <Button asChild variant="outline" size="icon">
            <Link to="/profile" aria-label="Profile">
              <User className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
