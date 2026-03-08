import { NextRequest } from "next/server";
import { generateScreen } from "@/lib/poc/ai-engine";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, images, history, slug } = body;

  if (!message) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of generateScreen({ message, images, history, slug })) {
          const data = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      } catch (exc) {
        const msg = exc instanceof Error ? exc.message : String(exc);
        const data = `event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`;
        controller.enqueue(encoder.encode(data));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
