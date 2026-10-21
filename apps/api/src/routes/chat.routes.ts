import { Router } from "express";
import { z } from "zod";
import { getSupabaseClient } from "../database/client";
import { isParticipant } from "../lib/chat";
import { ah, forbidden, must, notFound } from "../lib/http";
import { notify } from "../lib/notify";
import { me, requireAuth } from "../middlewares/auth.middleware";
import { SocketService } from "../services/socket.service";

const router = Router();
router.use(requireAuth);

const MESSAGES_PER_CHAT = 100;

interface ParticipantRow {
  conversation_id: string;
  unread_count: number;
  conversation: {
    id: string;
    last_message_at: string;
    post: { id: string; title: string; kind: "offer" | "need" } | null;
    participants: {
      user_id: string;
      profile: { display_name: string; username: string; is_verified: boolean };
    }[];
  };
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  type: "text" | "image" | "system";
  content: string;
  created_at: string;
}

const toMessage = (m: MessageRow, myId: string) => ({
  id: m.id,
  from: m.sender_id === null ? "system" : m.sender_id === myId ? "me" : "them",
  type: m.type,
  text: m.content,
  at: m.created_at,
});

// GET /api/chat — my conversations with their recent messages, latest first.
router.get(
  "/",
  ah(async (req, res) => {
    const myId = me(req).id;
    const db = getSupabaseClient();
    const rows = must(
      await db
        .from("conversation_participants")
        .select(
          `conversation_id, unread_count,
           conversation:conversations!inner (id, last_message_at,
             post:posts (id, title, kind),
             participants:conversation_participants (user_id,
               profile:profiles (display_name, username, is_verified)))`,
        )
        .eq("user_id", myId)
        .eq("archived", false)
        .order("conversation(last_message_at)", { ascending: false })
        .limit(100),
    ) as unknown as ParticipantRow[];

    const ids = rows.map((r) => r.conversation_id);
    const messages = ids.length
      ? (must(
          await db
            .from("messages")
            .select("id, conversation_id, sender_id, type, content, created_at")
            .in("conversation_id", ids)
            .order("created_at", { ascending: false })
            .limit(ids.length * MESSAGES_PER_CHAT),
        ) as MessageRow[])
      : [];
    const byChat = new Map<string, MessageRow[]>();
    for (const m of messages) {
      const list = byChat.get(m.conversation_id) ?? [];
      if (list.length < MESSAGES_PER_CHAT) list.push(m);
      byChat.set(m.conversation_id, list);
    }

    const data = rows
      .map((r) => {
        const other = r.conversation.participants.find((p) => p.user_id !== myId)?.profile;
        const list = (byChat.get(r.conversation_id) ?? []).reverse();
        const last = list[list.length - 1];
        return {
          id: r.conversation_id,
          with: other?.display_name ?? "",
          withUsername: other?.username ?? "",
          verified: other?.is_verified ?? false,
          postId: r.conversation.post?.id ?? null,
          postTitle: r.conversation.post?.title ?? "",
          postKind: r.conversation.post?.kind ?? "offer",
          last: last ? toMessage(last, myId) : null,
          lastAt: r.conversation.last_message_at,
          unread: r.unread_count,
          messages: list.map((m) => toMessage(m, myId)),
        };
      })
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    res.json({ success: true, data });
  }),
);

// POST /api/chat/:id/messages { text }
router.post(
  "/:id/messages",
  ah(async (req, res) => {
    const myId = me(req).id;
    const { text } = z.object({ text: z.string().trim().min(1).max(2000) }).parse(req.body);
    if (!(await isParticipant(req.params.id, myId))) throw notFound("chat_not_found");
    const db = getSupabaseClient();

    const others = must(
      await db
        .from("conversation_participants")
        .select("user_id, unread_count, muted")
        .eq("conversation_id", req.params.id)
        .neq("user_id", myId),
    ) as { user_id: string; unread_count: number; muted: boolean }[];

    const m = must(
      await db.rpc("send_message", { p_conversation: req.params.id, p_sender: myId, p_text: text }),
    ) as MessageRow;

    for (const o of others) {
      SocketService.emitNewMessage(req.params.id, { ...toMessage(m, o.user_id), conversationId: m.conversation_id });
      // One notification per burst of messages, not one per message.
      if (o.unread_count === 0 && !o.muted) {
        await notify(o.user_id, "message", `${me(req).display_name} আপনাকে মেসেজ পাঠিয়েছেন`, `/messages/${req.params.id}`);
      }
    }
    res.status(201).json({ success: true, data: toMessage(m, myId) });
  }),
);

// POST /api/chat/:id/read — clears my unread count.
router.post(
  "/:id/read",
  ah(async (req, res) => {
    const myId = me(req).id;
    if (!(await isParticipant(req.params.id, myId))) throw notFound("chat_not_found");
    must(
      await getSupabaseClient()
        .from("conversation_participants")
        .update({ unread_count: 0, last_read_at: new Date().toISOString() })
        .eq("conversation_id", req.params.id)
        .eq("user_id", myId),
    );
    res.json({ success: true });
  }),
);

// POST /api/chat/:id/mute { muted }
router.post(
  "/:id/mute",
  ah(async (req, res) => {
    const myId = me(req).id;
    const { muted } = z.object({ muted: z.boolean() }).parse(req.body);
    if (!(await isParticipant(req.params.id, myId))) throw forbidden();
    must(
      await getSupabaseClient()
        .from("conversation_participants")
        .update({ muted })
        .eq("conversation_id", req.params.id)
        .eq("user_id", myId),
    );
    res.json({ success: true });
  }),
);

export const chatRouter = router;
