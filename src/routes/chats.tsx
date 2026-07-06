import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { query, queryOne } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

type ThreadRow = {
  id: string;
  subject: string;
  last_message: string | null;
  unread_count: number;
  vendor_unread_count: number;
  updated_at: string;
  system_name: string | null;
  vendor_name: string | null;
  user_name: string | null;
  user_email: string | null;
  messaging_blocked: boolean;
};

type MessageRow = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name: string | null;
  sender_email: string | null;
};

const getChats = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const user = await getAuthUser(request);
  if (!user) return { threads: [] as ThreadRow[], asVendor: false, userId: null as string | null };

  const member = await queryOne<{ vendor_id: string }>(
    "SELECT vendor_id FROM vendor_members WHERE user_id = $1 LIMIT 1",
    [user.id],
  );

  if (member && (user.role === "vendor" || user.role === "admin")) {
    const threads = await query<ThreadRow>(
      `SELECT vt.id, vt.subject, vt.last_message, vt.unread_count, vt.vendor_unread_count,
              vt.updated_at, vt.messaging_blocked,
              s.name AS system_name, u.name AS user_name, u.email AS user_email,
              NULL::text AS vendor_name
       FROM vendor_threads vt
       LEFT JOIN systems s ON s.id = vt.system_id
       JOIN users u ON u.id = vt.user_id
       WHERE vt.vendor_id = $1
       ORDER BY vt.updated_at DESC`,
      [member.vendor_id],
    );
    return { threads, asVendor: true, userId: user.id };
  }

  const threads = await query<ThreadRow>(
    `SELECT vt.id, vt.subject, vt.last_message, vt.unread_count, vt.vendor_unread_count,
            vt.updated_at, vt.messaging_blocked,
            s.name AS system_name, v.company_name AS vendor_name,
            NULL::text AS user_name, NULL::text AS user_email
     FROM vendor_threads vt
     LEFT JOIN systems s ON s.id = vt.system_id
     JOIN vendors v ON v.id = vt.vendor_id
     WHERE vt.user_id = $1
     ORDER BY vt.updated_at DESC`,
    [user.id],
  );
  return { threads, asVendor: false, userId: user.id };
});

export const Route = createFileRoute("/chats")({
  validateSearch: (search: Record<string, unknown>) => ({
    thread: typeof search.thread === "string" ? search.thread : undefined,
  }),
  loader: async () => getChats(),
  component: ChatsPage,
});

function ChatsPage() {
  const { threads, asVendor, userId } = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const { thread: threadFromSearch } = Route.useSearch();
  const initialThreadId =
    (threadFromSearch && threads.some((t) => t.id === threadFromSearch)
      ? threadFromSearch
      : null) ??
    threads[0]?.id ??
    null;
  const [selectedId, setSelectedId] = useState<string | null>(initialThreadId);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [threadMeta, setThreadMeta] = useState<ThreadRow | null>(threads[0] ?? null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  const selected = threads.find((t) => t.id === selectedId) ?? threadMeta;

  const loadMessages = useCallback(async (threadId: string) => {
    setLoadingMessages(true);
    setError("");
    try {
      const res = await fetch(`/api/threads/${threadId}`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load messages");
      }
      const data = (await res.json()) as { messages: MessageRow[] };
      setMessages(data.messages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !selectedId) return;
    loadMessages(selectedId);
  }, [user, selectedId, loadMessages]);

  const handleSelect = (thread: ThreadRow) => {
    setSelectedId(thread.id);
    setThreadMeta(thread);
  };

  const handleSend = async () => {
    if (!selectedId || !reply.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/threads/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: reply.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send message");
      }
      setReply("");
      await loadMessages(selectedId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

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

  const unreadFor = (t: ThreadRow) => (asVendor ? t.vendor_unread_count : t.unread_count);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">Messages</h1>
          {asVendor && <Badge variant="secondary">Vendor inbox</Badge>}
        </div>

        {!user ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Sign in to view and send messages with vendors.
              </p>
              <div className="flex justify-center gap-2">
                <Button asChild>
                  <Link to="/auth/login">Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/auth/signup">Create account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : threads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <p className="font-medium">No conversations yet</p>
              <p className="text-sm text-muted-foreground">
                {asVendor
                  ? "When users contact you about a system, conversations will appear here."
                  : "Contact a vendor from any system page to start a conversation."}
              </p>
              {!asVendor && (
                <Button asChild variant="outline" className="mt-2">
                  <Link to="/">Browse systems</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <Card>
              <CardContent className="pt-6 p-0 divide-y divide-border">
                {threads.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelect(t)}
                    className={`w-full text-left p-4 hover:bg-secondary transition-colors ${
                      selectedId === t.id ? "bg-secondary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">
                        {asVendor
                          ? (t.user_name ?? t.user_email ?? t.subject)
                          : (t.vendor_name ?? t.subject)}
                      </span>
                      {unreadFor(t) > 0 && <Badge>{unreadFor(t)}</Badge>}
                    </div>
                    <p className="text-xs font-medium text-foreground/80 mt-0.5 truncate">
                      {t.subject}
                    </p>
                    {t.system_name && (
                      <p className="text-[11px] text-muted-foreground truncate">{t.system_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {t.last_message ?? "No messages yet"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatTime(t.updated_at)} ago
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 flex flex-col min-h-[500px]">
                {selected ? (
                  <>
                    <div className="border-b border-border pb-3 mb-3">
                      <p className="font-semibold">{selected.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {asVendor
                          ? `${selected.user_name ?? selected.user_email ?? "User"}${selected.system_name ? ` · ${selected.system_name}` : ""}`
                          : `${selected.vendor_name ?? "Vendor"}${selected.system_name ? ` · ${selected.system_name}` : ""}`}
                      </p>
                      {selected.messaging_blocked && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          Messaging is blocked until this system is claimed by a vendor.
                        </p>
                      )}
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto">
                      {loadingMessages ? (
                        <p className="text-sm text-muted-foreground">Loading messages…</p>
                      ) : messages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No messages in this thread yet.
                        </p>
                      ) : (
                        messages.map((m) => (
                          <Msg
                            key={m.id}
                            from={m.sender_id === userId ? "us" : "them"}
                            text={m.body}
                            sender={m.sender_name ?? m.sender_email ?? undefined}
                          />
                        ))
                      )}
                    </div>
                    {error && <p className="text-sm text-destructive mt-2">{error}</p>}
                    <div className="mt-3 flex gap-2">
                      <Input
                        placeholder="Type a message…"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                        disabled={selected.messaging_blocked || sending}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!reply.trim() || selected.messaging_blocked || sending}
                      >
                        Send
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a conversation</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function Msg({ from, text, sender }: { from: "us" | "them"; text: string; sender?: string }) {
  return (
    <div className={`flex flex-col ${from === "us" ? "items-end" : "items-start"}`}>
      {sender && from === "them" && (
        <span className="text-[10px] text-muted-foreground mb-0.5 px-1">{sender}</span>
      )}
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
          from === "us" ? "bg-primary text-primary-foreground" : "bg-secondary"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
