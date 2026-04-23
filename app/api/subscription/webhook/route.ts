import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const subscriptionId = session.subscription as string;

    if (userId && subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_subscription_id: subscriptionId,
        status: "active",
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      });

      await supabase
        .from("users")
        .update({ subscription_status: "active" })
        .eq("id", userId);
    }
  }

  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    if (sub) {
      const status =
        subscription.status === "active" ? "active" : "cancelled";

      await supabase
        .from("subscriptions")
        .update({
          status,
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      await supabase
        .from("users")
        .update({ subscription_status: status })
        .eq("id", sub.user_id);
    }
  }

  return NextResponse.json({ received: true });
}
