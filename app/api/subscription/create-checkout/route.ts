import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

// Stripe price IDs always start with "price_"
const VALID_PRICE_RE = /^price_[a-zA-Z0-9]+$/;

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

  // Rate limit: 10 checkout sessions per hour per user
  const { allowed } = rateLimit(`checkout:${user.id}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { price_id } = body;

  // Validate price_id format
  if (!price_id || typeof price_id !== "string" || !VALID_PRICE_RE.test(price_id)) {
    return NextResponse.json({ error: "Invalid price_id" }, { status: 400 });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { data: userData } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = userData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: price_id, quantity: 1 }],
      mode: "subscription",
      success_url: `${appUrl}/dashboard?payment=success`,
      cancel_url: `${appUrl}/pricing?payment=cancelled`,
      metadata: { user_id: user.id },
    });

    return NextResponse.json({ checkout_url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
