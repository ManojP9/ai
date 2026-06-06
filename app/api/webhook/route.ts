import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@vercel/postgres";
import { initProfilesExtended } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id ?? session.customer_email;
    if (userId) {
      await initProfilesExtended();
      await sql`
        INSERT INTO profiles (user_id, is_premium) VALUES (${userId}, TRUE)
        ON CONFLICT (user_id) DO UPDATE SET is_premium = TRUE
      `;
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const email = (sub as Stripe.Subscription & { customer_email?: string }).customer_email;
    if (email) {
      await sql`UPDATE profiles SET is_premium = FALSE WHERE user_id = ${email}`;
    }
  }

  return NextResponse.json({ received: true });
}
