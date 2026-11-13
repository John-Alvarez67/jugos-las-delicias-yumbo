import { readSiteConfig } from "../../../lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await readSiteConfig(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "No fue posible cargar el menú" }, { status: 503 });
  }
}
