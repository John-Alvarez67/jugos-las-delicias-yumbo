import { isAdminRequest, unauthorized } from "../../../../lib/admin-auth";
import { readSiteConfig, writeSiteConfig } from "../../../../lib/storage";
import type { SiteConfig } from "../../../../lib/site-config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    return Response.json({ config: await readSiteConfig() });
  } catch {
    return Response.json({ error: "No fue posible cargar la configuración" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const config = (await request.json()) as SiteConfig;
    if (!config.businessName?.trim() || !Array.isArray(config.products) || !Array.isArray(config.availableDates) || !Array.isArray(config.pickupTimes)) {
      return Response.json({ error: "Configuración incompleta" }, { status: 400 });
    }
    if (config.products.some((p) => !p.id || !p.name || !Number.isFinite(p.price) || p.price < 0)) {
      return Response.json({ error: "Revisa los productos y sus precios" }, { status: 400 });
    }
    config.whatsappNumber = (config.whatsappNumber ?? "").replace(/\D/g, "");
    config.availableDates = [...new Set(config.availableDates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)))].sort();
    config.pickupTimes = [...new Set(config.pickupTimes.filter(Boolean))];
    await writeSiteConfig(config);
    return Response.json({ config });
  } catch {
    return Response.json({ error: "No fue posible guardar la configuración" }, { status: 503 });
  }
}
