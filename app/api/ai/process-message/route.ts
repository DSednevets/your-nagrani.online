import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { SYSTEM_PROMPT, FREE_TRIAL_LIMIT } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 60 requests per hour per user
    const { allowed } = rateLimit(`ai:${user.id}`, 60, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Parse and validate input
    const body = await request.json();
    const { conversation_id, user_message, conversation_history } = body;

    if (!conversation_id || !UUID_RE.test(conversation_id)) {
      return NextResponse.json({ error: "Invalid conversation_id" }, { status: 400 });
    }

    if (!user_message || typeof user_message !== "string") {
      return NextResponse.json({ error: "user_message is required" }, { status: 400 });
    }

    const trimmed = user_message.trim();
    if (trimmed.length === 0 || trimmed.length > 5000) {
      return NextResponse.json(
        { error: "user_message must be between 1 and 5000 characters" },
        { status: 400 }
      );
    }

    // CRITICAL FIX: verify conversation belongs to this user
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("user_id")
      .eq("id", conversation_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conversation.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // CRITICAL FIX: count messages server-side, never trust client
    const { count: dbCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversation_id)
      .eq("role", "assistant");

    const actualCount = dbCount ?? 0;

    // Check free trial limit
    if (actualCount >= FREE_TRIAL_LIMIT) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!sub) {
        return NextResponse.json({ error: "Subscription required" }, { status: 403 });
      }
    }

    // Sanitize conversation history — only allow valid roles and string content
    const safeHistory: ChatMessage[] = Array.isArray(conversation_history)
      ? conversation_history
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.length <= 10000
          )
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
      : [];

    safeHistory.push({ role: "user", content: trimmed });

    const isFinalResponse = actualCount === FREE_TRIAL_LIMIT - 1;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: safeHistory,
    });

    const aiResponse =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save messages to DB
    await supabase.from("messages").insert([
      {
        conversation_id,
        role: "user",
        content: trimmed,
        message_number: actualCount + 1,
      },
      {
        conversation_id,
        role: "assistant",
        content: aiResponse,
        message_number: actualCount + 1,
      },
    ]);

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation_id);

    return NextResponse.json({
      ai_response: aiResponse,
      is_final_response: isFinalResponse,
      message_count: actualCount + 1,
    });
  } catch (error) {
    console.error("AI processing error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
