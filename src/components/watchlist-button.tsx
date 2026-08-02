import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  systemId: string;
  user: AuthUser | null;
  variant?: "icon" | "button";
  className?: string;
}

export function WatchlistButton({
  systemId,
  user,
  variant = "icon",
  className,
}: WatchlistButtonProps) {
  const [inList, setInList] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setInList(false);
      return;
    }
    fetch("/api/watchlist", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) {
          setInList(false);
          return null;
        }
        if (!r.ok) return { items: [] };
        return r.json();
      })
      .then((data: { items?: { id: string }[] } | null) => {
        if (!data) return;
        const ids = new Set((data.items ?? []).map((i) => i.id));
        setInList(ids.has(systemId));
      })
      .catch(() => setInList(false));
  }, [user, systemId]);

  const toggle = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (inList) {
        const res = await fetch(`/api/watchlist/${systemId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) setInList(false);
      } else {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ system_id: systemId }),
        });
        if (res.ok) setInList(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    if (variant === "button") {
      return (
        <Button variant="outline" className={cn("gap-2", className)} asChild>
          <Link to="/auth/login">
            <Heart className="h-4 w-4" />
            Watchlist
          </Link>
        </Button>
      );
    }
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sign in to save"
        className={className}
        asChild
      >
        <Link to="/auth/login">
          <Heart className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  if (variant === "button") {
    return (
      <Button
        variant="outline"
        className={cn("gap-2", className)}
        onClick={toggle}
        disabled={loading}
      >
        <Heart className={cn("h-4 w-4", inList && "fill-current text-red-500")} />
        {inList ? "Saved" : "Watchlist"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={inList ? "Remove from watchlist" : "Add to watchlist"}
      className={className}
      onClick={toggle}
      disabled={loading}
    >
      <Heart className={cn("h-4 w-4", inList && "fill-current text-red-500")} />
    </Button>
  );
}
