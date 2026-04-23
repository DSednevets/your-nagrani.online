import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error: fetchError } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (fetchError) {
    console.error("Fetch conversations error:", fetchError.message);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }

  return NextResponse.json({ conversations: data });
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 20 conversations per hour per user
  const { allowed } = rateLimit(`conv:${user.id}`, 20, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Ensure user exists in public.users before inserting conversation (FK constraint)
  await supabase.from("users").upsert(
    { id: user.id, email: user.email! },
    { onConflict: "id" }
  );

  const { data, error: insertError } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      title: `Исследование ${new Date().toLocaleDateString("ru-RU")}`,
      status: "active",
      conversation_mode: "free_trial",
    })
    .select()
    .single();

  if (insertError) {
    console.error("Insert conversation error:", insertError.message);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }

  return NextResponse.json({ conversation: data });
}
