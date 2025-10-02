import { NextRequest } from "next/server";
import { ProcessWebhook } from "@/lib/paddle/process-webhook";
import { getPaddleInstance } from "@/lib/paddle/get-paddle-instance";

const webhookProcessor = new ProcessWebhook();

export async function POST(request: NextRequest) {
  const signature = request.headers.get("paddle-signature") || "";
  const rawRequestBody = await request.text();
  const privateKey = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET || "";

  try {
    if (!signature || !rawRequestBody) {
      console.error("Missing signature or request body");
      return Response.json({ error: "Missing signature from header" }, { status: 400 });
    }

    if (!privateKey) {
      console.error("PADDLE_NOTIFICATION_WEBHOOK_SECRET not configured");
      return Response.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const paddle = getPaddleInstance();
    const eventData = await paddle.webhooks.unmarshal(
      rawRequestBody,
      privateKey,
      signature
    );
    const eventName = eventData?.eventType ?? "Unknown event";

    console.log(`Received Paddle webhook: ${eventName}`);

    if (eventData) {
      await webhookProcessor.processEvent(eventData);
      console.log(`Successfully processed webhook: ${eventName}`);
    }

    return Response.json({ status: 200, eventName });
  } catch (e) {
    console.error("Paddle webhook error:", e);
    return Response.json(
      { error: "Internal server error", details: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
