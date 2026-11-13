import { readSiteConfig, writeOrder, type StoredOrder, type StoredOrderItem } from "../../../lib/storage";
import type { Preparation } from "../../../lib/site-config";

export const dynamic = "force-dynamic";

type OrderItemInput = { productId: string; preparation: Preparation; quantity: number; flavor?: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customerName?: string;
      pickupDate?: string;
      pickupTime?: string;
      notes?: string;
      items?: OrderItemInput[];
    };
    const customerName = body.customerName?.trim().slice(0, 80) ?? "";
    const items = body.items ?? [];
    if (!customerName || !body.pickupDate || !body.pickupTime || !Array.isArray(items) || items.length < 1 || items.length > 30) {
      return Response.json({ error: "Completa el nombre, la fecha, la hora y el pedido" }, { status: 400 });
    }
    const config = await readSiteConfig();
    if (!config.acceptingOrders || !config.availableDates.includes(body.pickupDate)) {
      return Response.json({ error: "La fecha seleccionada ya no está disponible" }, { status: 409 });
    }
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    if (body.pickupDate < today) {
      return Response.json({ error: "Selecciona una fecha futura" }, { status: 409 });
    }
    if (!config.pickupTimes.includes(body.pickupTime)) {
      return Response.json({ error: "La hora seleccionada ya no está disponible" }, { status: 409 });
    }
    const normalized: StoredOrderItem[] = items.map((item) => {
      const product = config.products.find((candidate) => candidate.id === item.productId && candidate.available);
      if (!product || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
        throw new Error("Revisa los productos y cantidades del pedido");
      }
      const preparation: Preparation = product.category === "naturales" && product.allowMilk
        ? (item.preparation === "leche" ? "leche" : "agua")
        : "unidad";
      const flavor = product.category === "vitaminas" ? item.flavor?.trim().slice(0, 60) : undefined;
      if (product.category === "vitaminas" && (!flavor || !config.products.some((entry) => entry.category === "naturales" && entry.name === flavor))) {
        throw new Error("Revisa los productos y cantidades del pedido");
      }
      return {
        productId: product.id,
        name: product.name,
        flavor,
        preparation,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: product.price * item.quantity,
      };
    });
    const total = normalized.reduce((sum, item) => sum + item.subtotal, 0);
    const id = `JLD-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    const order: StoredOrder = {
      id,
      createdAt: new Date().toISOString(),
      customerName,
      pickupDate: body.pickupDate,
      pickupTime: body.pickupTime,
      items: normalized,
      total,
      notes: body.notes?.trim().slice(0, 500) ?? "",
      status: "nuevo",
    };
    await writeOrder(order);
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible registrar el pedido";
    const invalid = message.startsWith("Revisa los productos");
    return Response.json({ error: invalid ? message : "No fue posible registrar el pedido" }, { status: invalid ? 400 : 503 });
  }
}
