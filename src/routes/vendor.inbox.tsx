import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockThreads } from "@/lib/mock-data";

export const Route = createFileRoute("/vendor/inbox")({
  component: VendorInboxPage,
});

function VendorInboxPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Inbox</h1>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card><CardContent className="pt-6 p-0 divide-y divide-border">
          {mockThreads.map((t, i) => (
            <button key={t.id} className={`w-full text-left p-4 hover:bg-secondary ${i===0 ? "bg-secondary" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{t.with}</span>
                {t.unread > 0 && <Badge>{t.unread}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.subject}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.lastMessage}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{t.updated} ago</p>
            </button>
          ))}
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex flex-col h-[500px]">
          <div className="border-b border-border pb-3 mb-3">
            <p className="font-semibold">Acme Corp</p>
            <p className="text-xs text-muted-foreground">Pricing for 250 seats</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto">
            <Msg from="them" text="Hi, can you share an annual quote for 250 seats?" />
            <Msg from="us" text="Sure — let me put together a proposal and send it over by EOD." />
            <Msg from="them" text="Thanks!" />
          </div>
          <div className="mt-3 flex gap-2">
            <Input placeholder="Type a reply…" /><Button>Send</Button>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}

function Msg({ from, text }: { from: "us" | "them"; text: string }) {
  return (
    <div className={`flex ${from === "us" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${from === "us" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{text}</div>
    </div>
  );
}
