import { Environment, Paddle } from "@paddle/paddle-node-sdk";

let paddleInstance: Paddle | null = null;

export function getPaddleInstance(): Paddle {
  if (!paddleInstance) {
    const apiKey = process.env.PADDLE_API_KEY;

    if (!apiKey) {
      throw new Error("PADDLE_API_KEY environment variable is not set");
    }

    const environment =
      process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox"
        ? Environment.sandbox
        : Environment.production;

    paddleInstance = new Paddle(apiKey, { environment });
  }

  return paddleInstance;
}
