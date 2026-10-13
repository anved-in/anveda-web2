import { colourFlowAuto } from "@/lib/colourflow";

// The automatic By Colour order, as variant ids. The CMS reads this so its
// "Colour wall" screen starts from exactly what the website would show.
export const dynamic = "force-static";

export async function GET() {
  const auto = await colourFlowAuto();
  return Response.json({ order: auto.map((l) => l.variant.id) });
}
