import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { SYSTEM_PROMPT, FREE_TRIAL_LIMIT } from "@/lib/constants";

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

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversation_id, user_message, conversation_history, message_count } =
      await request.json();

    // Check free trial limit
    if (message_count >= FREE_TRIAL_LIMIT) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!sub) {
        return NextResponse.json(
          { error: "Subscription required" },
          { status: 403 }
        );
      }
    }

    // Build messages for Claude
    const messages: ChatMessage[] = (conversation_history as ChatMessage[]).map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    messages.push({ role: "user", content: user_message });

    const isFinalResponse = message_count === FREE_TRIAL_LIMIT - 1;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages,
    });

    const aiResponse =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save messages to DB
    await supabase.from("messages").insert([
      {
        conversation_id,
        role: "user",
        content: user_message,
        message_number: message_count + 1,
      },
      {
        conversation_id,
        role: "assistant",
        content: aiResponse,
        message_number: message_count + 1,
      },
    ]);

    // Update conversation updated_at
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation_id);

    return NextResponse.json({
      ai_response: aiResponse,
      is_final_response: isFinalResponse,
      message_count: message_count + 1,
    });
  } catch (error) {
    console.error("AI processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
