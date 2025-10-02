import { Paddle } from "@paddle/paddle-node-sdk";

let paddleInstance: Paddle | null = null;

export function getPaddleInstance(): Paddle {
  if (!paddleInstance) {
    const apiKey = process.env.PADDLE_API_KEY;

    if (!apiKey) {
      throw new Error("PADDLE_API_KEY environment variable is not set");
    }

    paddleInstance = new Paddle(apiKey);
  }

  return paddleInstance;
}
