import { isAdminRequest, unauthorized } from "../../../../lib/admin-auth";
import { listOrders, readOrder, updateOrder } from "../../../../lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    return Response.json({ orders: await listOrders() });
  } catch {
    return Response.json({ error: "No fue posible cargar los pedidos" }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const body = (await request.json()) as { id?: string; status?: string };
  const allowed = new Set(["nuevo", "confirmado", "preparando", "listo", "entregado", "cancelado"]);
  if (!body.id || !/^JLD-[A-Z0-9-]+$/.test(body.id) || !body.status || !allowed.has(body.status)) {
    return Response.json({ error: "Estado inválido" }, { status: 400 });
  }
  try {
    const order = await readOrder(body.id);
    if (!order) return Response.json({ error: "Pedido no encontrado" }, { status: 404 });
    order.status = body.status as typeof order.status;
    await updateOrder(order);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "No fue posible actualizar el pedido" }, { status: 503 });
  }
}
