import { get, list, put } from "@vercel/blob";
import { defaultConfig, type SiteConfig } from "./site-config";

export type StoredOrderItem = {
  productId: string;
  name: string;
  flavor?: string;
  preparation: "agua" | "leche" | "unidad";
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type StoredOrder = {
  id: string;
  createdAt: string;
  customerName: string;
  pickupDate: string;
  pickupTime: string;
  items: StoredOrderItem[];
  total: number;
  notes: string;
  status: "nuevo" | "confirmado" | "preparando" | "listo" | "entregado" | "cancelado";
};

async function readJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  return (await new Response(result.stream).json()) as T;
}

async function writeJson(pathname: string, value: unknown, overwrite = false) {
  await put(pathname, JSON.stringify(value), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: overwrite,
  });
}

export async function readSiteConfig(): Promise<SiteConfig> {
  return (await readJson<SiteConfig>("site-config.json")) ?? defaultConfig;
}

export async function writeSiteConfig(config: SiteConfig) {
  await writeJson("site-config.json", config, true);
}

export async function writeOrder(order: StoredOrder) {
  await writeJson(`orders/${order.id}.json`, order);
}

export async function readOrder(id: string) {
  return await readJson<StoredOrder>(`orders/${id}.json`);
}

export async function updateOrder(order: StoredOrder) {
  await writeJson(`orders/${order.id}.json`, order, true);
}

export async function listOrders(limit = 100): Promise<StoredOrder[]> {
  const result = await list({ prefix: "orders/", limit: 1000 });
  const newest = result.blobs
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    .slice(0, limit);
  const rows = await Promise.all(newest.map((blob) => readJson<StoredOrder>(blob.pathname)));
  return rows.filter((row): row is StoredOrder => row !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
