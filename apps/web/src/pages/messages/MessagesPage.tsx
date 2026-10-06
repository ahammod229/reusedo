import { useTr } from "@/features/feed/i18n";
import { MOCK_CHATS, type MockConversation } from "@/features/feed/mock";
import { Initial, Pill } from "@/features/feed/parts";
import { Button, cn } from "@/shared/components/ui";
import {
  ArrowLeft,
  BadgeCheck,
  Image as ImageIcon,
  MessageCircle,
  Send,
  Truck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router";

type Msg = MockConversation["messages"][number];

export function MessagesPage() {
  const { id } = useParams();
  const tr = useTr();
  const active = MOCK_CHATS.find((c) => c.id === id);

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] w-full max-w-5xl overflow-hidden bg-card md:h-[calc(100vh-4rem)] md:border-x">
      <Helmet>
        <title>{tr("মেসেজ", "Messages")} — ReuseDo</title>
      </Helmet>
      <aside className={cn("w-full shrink-0 border-r md:block md:w-80", active && "hidden")}>
        <div className="border-b p-4">
          <h1 className="text-xl font-extrabold">{tr("মেসেজ", "Messages")}</h1>
        </div>
        <ul className="overflow-y-auto">
          {MOCK_CHATS.map((c) => (
            <li key={c.id}>
              <Link
                to={`/messages/${c.id}`}
                aria-current={c.id === id ? "page" : undefined}
                className={cn(
                  "flex gap-3 border-b px-4 py-3 transition-colors hover:bg-accent/60",
                  c.id === id && "bg-primary/5",
                )}
              >
                <Initial name={c.with} className="h-11 w-11" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 truncate font-semibold">
                      {c.with}
                      {c.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{c.when}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{c.postTitle}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm",
                        c.unread ? "font-semibold" : "text-muted-foreground",
                      )}
                    >
                      {c.last}
                    </p>
                    {c.unread > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {active ? (
        <Thread key={active.id} chat={active} />
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground md:flex">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <MessageCircle className="h-8 w-8" />
          </span>
          <p className="font-medium">{tr("একটি কথোপকথন বেছে নিন", "Pick a conversation")}</p>
        </div>
      )}
    </div>
  );
}

function Thread({ chat }: { chat: MockConversation }) {
  const tr = useTr();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>(chat.messages);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to the newest message whenever the count changes
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  const send = (t = text) => {
    const v = t.trim();
    if (!v) return;
    setMsgs((m) => [...m, { from: "me", text: v, time: tr("এখন", "now") }]);
    setText("");
  };

  const quick = [
    tr("এখনও কি আছে?", "Is it still available?"),
    tr("কখন নিতে পারি?", "When can I pick it up?"),
    tr("ধন্যবাদ!", "Thank you!"),
  ];

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b p-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => navigate("/messages")}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">{tr("ফিরে যান", "Back")}</span>
        </Button>
        <Initial name={chat.with} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 font-bold">
            <span className="truncate">{chat.with}</span>
            {chat.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
          </p>
          <Link
            to="/post/1"
            className="block truncate text-xs text-muted-foreground hover:underline"
          >
            {chat.postKind === "offer" ? "🎁" : "🙏"} {chat.postTitle}
          </Link>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/courier">
            <Truck className="mr-1.5 h-4 w-4" />
            {tr("কুরিয়ার", "Courier")}
          </Link>
        </Button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-muted/40 p-4">
        <p className="mx-auto max-w-sm rounded-xl bg-warning-soft px-3 py-2 text-center text-xs text-warning">
          {tr(
            "নিরাপত্তার জন্য ফোন নম্বর বা বাইরের লিংক শেয়ার না করাই ভালো। পাবলিক জায়গায় দেখা করুন।",
            "For safety, avoid sharing phone numbers or outside links. Meet in public places.",
          )}
        </p>
        {msgs.map((m, i) =>
          m.from === "system" ? (
            <p key={`${i}-${m.time}`} className="text-center text-xs text-muted-foreground">
              {m.text}
            </p>
          ) : (
            <div
              key={`${i}-${m.time}`}
              className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm",
                  m.from === "me"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-background",
                )}
              >
                {m.text}
                <span
                  className={cn(
                    "mt-1 block text-right text-[11px]",
                    m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {m.time}
                </span>
              </div>
            </div>
          ),
        )}
        {chat.id === "c1" && (
          <div className="mx-auto max-w-sm rounded-2xl border border-primary/30 bg-card p-4 text-sm">
            <p className="flex items-center gap-2 font-bold">
              <Truck className="h-4 w-4 text-primary" />
              {tr("কুরিয়ারে পাঠানো ঠিক হয়েছে", "Courier delivery agreed")}
            </p>
            <p className="mt-1 text-muted-foreground">
              {tr("এখন অ্যাডমিনের কাছে রিকোয়েস্ট পাঠান।", "Send the request to the admin now.")}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Pill tone="warning">
                {tr("চার্জ ৳১৩০ — গ্রহীতা দেবেন", "Fee ৳130 — paid by receiver")}
              </Pill>
            </div>
            <Button asChild size="sm" className="mt-3 w-full">
              <Link to="/courier">{tr("কুরিয়ার রিকোয়েস্ট খুলুন", "Open courier request")}</Link>
            </Button>
          </div>
        )}
        <div ref={end} />
      </div>

      <div className="border-t bg-card p-3">
        <div className="mb-2 flex gap-2 overflow-x-auto scrollbar-none">
          {quick.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Button type="button" variant="ghost" size="icon" aria-label={tr("ছবি", "Photo")}>
            <ImageIcon className="h-5 w-5" />
          </Button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={tr("মেসেজ লিখুন…", "Write a message…")}
            aria-label={tr("মেসেজ লিখুন", "Write a message")}
            className="h-11 flex-1 rounded-full border bg-background px-4 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 sm:text-sm"
          />
          <Button type="submit" size="icon" className="rounded-full" disabled={!text.trim()}>
            <Send className="h-5 w-5" />
            <span className="sr-only">{tr("পাঠান", "Send")}</span>
          </Button>
        </form>
      </div>
    </section>
  );
}
