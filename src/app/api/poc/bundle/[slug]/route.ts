import { NextRequest } from "next/server";
import { readBundle } from "@/lib/poc/compiler";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const bundle = await readBundle(slug);

  if (!bundle) {
    return Response.json({ error: "Bundle not found" }, { status: 404 });
  }

  return new Response(bundle, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
    },
  });
}
