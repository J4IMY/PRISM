import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { query } from "@/lib/db";

const getVendorThreads = createServerFn({ method: "GET" }).handler(async () => {
  return query<{
    id: string;
    subject: string;
    last_message: string;
    unread_count: number;
    updated_at: string;
  }>(
    `SELECT id, subject, last_message, unread_count, updated_at
     FROM vendor_threads
     ORDER BY updated_at DESC`,
  );
});

export const Route = createFileRoute("/vendor/inbox")({
  loader: async () => {
    const threads = await getVendorThreads();
    return { threads };
  },
  component: VendorInboxPage,
});

function VendorInboxPage() {
  const { threads } = Route.useLoaderData();

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return "now";
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Inbox</h1>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardContent className="pt-6 p-0 divide-y divide-border">
            {threads.map((t, i) => (
              <button
                key={t.id}
                className={`w-full text-left p-4 hover:bg-secondary ${i === 0 ? "bg-secondary" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{t.subject}</span>
                  {t.unread_count > 0 && <Badge>{t.unread_count}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.last_message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatTime(t.updated_at)} ago
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex flex-col h-[500px]">
            <div className="border-b border-border pb-3 mb-3">
              <p className="font-semibold">{threads[0]?.subject || "No threads"}</p>
              <p className="text-xs text-muted-foreground">{threads[0]?.last_message || "—"}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              <Msg from="them" text="Hi there, I have a question about your system." />
              <Msg from="us" text="Sure, happy to help! What can I assist you with?" />
            </div>
            <div className="mt-3 flex gap-2">
              <Input placeholder="Type a reply…" />
              <Button>Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Msg({ from, text }: { from: "us" | "them"; text: string }) {
  return (
    <div className={`flex ${from === "us" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${from === "us" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
      >
        {text}
      </div>
    </div>
  );
}
