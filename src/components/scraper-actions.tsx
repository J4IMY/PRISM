import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ScraperActionsProps {
  itemId: string;
  status: string;
  layout?: "inline" | "stacked";
  onUpdated?: () => void;
}

async function patchScraper(
  id: string,
  body: { status?: string; publish?: boolean },
): Promise<{ error?: string }> {
  const res = await fetch(`/api/scraper/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: (data as { error?: string }).error ?? "Action failed" };
  return {};
}

export function ScraperActions({
  itemId,
  status,
  layout = "inline",
  onUpdated,
}: ScraperActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const run = async (action: string, body: { status?: string; publish?: boolean }) => {
    setLoading(action);
    const result = await patchScraper(itemId, body);
    setLoading(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      action === "publish"
        ? "Published to catalog"
        : action === "approve"
          ? "Item approved"
          : "Item rejected",
    );
    onUpdated?.();
    await router.invalidate();
  };

  const btnClass = layout === "stacked" ? "w-full sm:w-auto" : "";

  return (
    <div className={layout === "stacked" ? "flex flex-wrap gap-2 justify-end" : "space-x-1"}>
      {status !== "rejected" && (
        <Button
          size="sm"
          variant="outline"
          className={btnClass}
          disabled={!!loading}
          onClick={() => run("reject", { status: "rejected" })}
        >
          {loading === "reject" ? "…" : "Reject"}
        </Button>
      )}
      {status !== "approved" && status !== "published" && (
        <Button
          size="sm"
          variant="secondary"
          className={btnClass}
          disabled={!!loading}
          onClick={() => run("approve", { status: "approved" })}
        >
          {loading === "approve" ? "…" : "Approve"}
        </Button>
      )}
      {status !== "published" && (
        <Button
          size="sm"
          className={btnClass}
          disabled={!!loading}
          onClick={() => run("publish", { status: "approved", publish: true })}
        >
          {loading === "publish" ? "…" : "Publish"}
        </Button>
      )}
    </div>
  );
}
