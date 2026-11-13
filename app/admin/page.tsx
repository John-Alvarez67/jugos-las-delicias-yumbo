"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, LogOut, Plus, RefreshCw, Save, ShoppingBag } from "lucide-react";
import AvailabilityCalendar from "../components/AvailabilityCalendar";
import { dateLabel, formatCop, type Category, type Product, type SiteConfig } from "../../lib/site-config";
import type { StoredOrder } from "../../lib/storage";

const statuses: StoredOrder["status"][] = ["nuevo", "confirmado", "preparando", "listo", "entregado", "cancelado"];
const categoryNames: Record<Category, string> = { naturales: "Jugo natural", vitaminas: "Jugo con vitaminas", suplementos: "Vitamina por separado" };
const lines = (text: string) => text.split(/[\n,]+/).map((entry) => entry.trim()).filter(Boolean);

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [draftToken, setDraftToken] = useState("");
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [timesText, setTimesText] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (secret: string) => {
    setBusy(true);
    try {
      const headers = { Authorization: `Bearer ${secret}` };
      const [configResponse, ordersResponse] = await Promise.all([
        fetch("/api/admin/config", { headers, cache: "no-store" }),
        fetch("/api/admin/orders", { headers, cache: "no-store" }),
      ]);
      if (configResponse.status === 401) throw new Error("La clave de administración no es válida.");
      if (!configResponse.ok || !ordersResponse.ok) throw new Error("No se pudieron cargar los datos de la tienda.");
      const configData = (await configResponse.json()) as { config: SiteConfig };
      const orderData = (await ordersResponse.json()) as { orders: StoredOrder[] };
      setConfig(configData.config);
      setTimesText(configData.config.pickupTimes.join("\n"));
      setOrders(orderData.orders);
      setToken(secret);
      sessionStorage.setItem("jugos-admin-token", secret);
      setNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No fue posible ingresar.");
      sessionStorage.removeItem("jugos-admin-token");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("jugos-admin-token");
    if (!saved) return;
    const timer = window.setTimeout(() => { setDraftToken(saved); load(saved); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function changeProduct(id: string, patch: Partial<Product>) {
    if (!config) return;
    setConfig({ ...config, products: config.products.map((product) => product.id === id ? { ...product, ...patch } : product) });
  }

  function toggleDate(date: string) {
    if (!config) return;
    const dates = config.availableDates.includes(date)
      ? config.availableDates.filter((entry) => entry !== date)
      : [...config.availableDates, date].sort();
    setConfig({ ...config, availableDates: dates });
  }

  function addProduct() {
    if (!config) return;
    const product: Product = { id: `nuevo-${Date.now()}`, name: "Nuevo producto", description: "Describe el sabor o producto.", category: "naturales", emoji: "🥤", color: "#00A9D0", price: 8000, serving: "12 oz", allowMilk: true, available: true };
    setConfig({ ...config, products: [...config.products, product] });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!config) return;
    setBusy(true);
    try {
      const payload = { ...config, pickupTimes: lines(timesText) };
      const response = await fetch("/api/admin/config", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = (await response.json()) as { config?: SiteConfig; error?: string };
      if (!response.ok || !data.config) throw new Error(data.error ?? "No se pudieron guardar los cambios.");
      setConfig(data.config);
      setNotice("Cambios guardados. El menú público ya muestra la nueva información.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudieron guardar los cambios.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(id: string, status: StoredOrder["status"]) {
    const previous = orders;
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
    try {
      const response = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ id, status }) });
      if (!response.ok) throw new Error();
    } catch {
      setOrders(previous);
      setNotice("No se pudo actualizar el estado del pedido.");
    }
  }

  if (!config || !token) {
    return <main className="admin-page"><header className="admin-topbar"><Link className="admin-brand" href="/"><Image src="/images/logo-oficial.png" alt="" width={50} height={50} /><span>Jugos Las Delicias <small>Administración</small></span></Link><Link href="/"><ArrowLeft size={16} /> Ver tienda</Link></header><section className="login-card"><span className="kicker">Acceso privado</span><h1>Panel de la tienda</h1><p>Ingresa la clave de administración para actualizar el menú, los días de atención y revisar los pedidos.</p><form onSubmit={(event) => { event.preventDefault(); if (draftToken.trim()) load(draftToken.trim()); }}><label htmlFor="admin-secret">Clave de administración</label><input id="admin-secret" type="password" value={draftToken} onChange={(event) => setDraftToken(event.target.value)} autoComplete="current-password" /><button className="button-primary" disabled={busy} type="submit">{busy ? "Ingresando…" : "Ingresar"} </button></form>{notice && <p className="admin-notice">{notice}</p>}</section></main>;
  }

  return <main className="admin-page"><header className="admin-topbar"><Link className="admin-brand" href="/"><Image src="/images/logo-oficial.png" alt="" width={50} height={50} /><span>Jugos Las Delicias <small>Administración</small></span></Link><div><Link href="/"><ArrowLeft size={16} /> Ver tienda</Link><button type="button" onClick={() => { sessionStorage.removeItem("jugos-admin-token"); setToken(""); setConfig(null); }}><LogOut size={16} /> Salir</button></div></header>
    <div className="admin-container"><div className="admin-heading"><div><span className="kicker">Panel de Mary Luz</span><h1>Tu tienda, siempre al día</h1><p>Los cambios se publican al tocar Guardar.</p></div><button className="save-button" form="admin-form" type="submit" disabled={busy}><Save size={17} />{busy ? "Guardando…" : "Guardar cambios"}</button></div>{notice && <div className="admin-notice"><CheckCircle2 size={18} />{notice}</div>}
      <div className="admin-columns"><form id="admin-form" onSubmit={save}><section className="admin-box"><div className="admin-box-title"><span>01</span><div><h2>Información del negocio</h2><p>Datos que aparecen en la página pública.</p></div></div><div className="admin-fields"><label>Nombre de la tienda<input value={config.businessName} onChange={(e) => setConfig({ ...config, businessName: e.target.value })} /></label><label>Fundadora<input value={config.founderName} onChange={(e) => setConfig({ ...config, founderName: e.target.value })} /></label><label className="wide">WhatsApp Business con indicativo<input value={config.whatsappNumber} onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })} placeholder="Ej. 573001234567" /><small>Sin espacios ni signo +. El cliente enviará el mensaje desde su WhatsApp.</small></label><label className="wide">Dirección<input value={config.address} onChange={(e) => setConfig({ ...config, address: e.target.value })} /></label><label className="wide">Información de horario<input value={config.hours} onChange={(e) => setConfig({ ...config, hours: e.target.value })} /></label><label className="wide">Mensaje de bienvenida<textarea value={config.welcome} onChange={(e) => setConfig({ ...config, welcome: e.target.value })} /></label><label className="wide switch-line"><input type="checkbox" checked={config.acceptingOrders} onChange={(e) => setConfig({ ...config, acceptingOrders: e.target.checked })} /><span>Recibir pedidos ahora</span></label></div></section>
        <section className="admin-box"><div className="admin-box-title"><span>02</span><div><h2>Calendario de atención</h2><p>Selecciona en verde los días en que abrirá el local.</p></div></div><AvailabilityCalendar editable availableDates={config.availableDates} onSelect={toggleDate} /><label className="times-field">Horas de recogida, una por línea<textarea value={timesText} onChange={(e) => setTimesText(e.target.value)} /></label></section>
        <section className="admin-box"><div className="admin-box-title"><span>03</span><div><h2>Menú y precios</h2><p>Actualiza sabores, categorías, valores y disponibilidad.</p></div></div><div className="admin-products">{config.products.map((product) => <div className="admin-product" key={product.id}><div className="admin-product-head"><span className="admin-product-emoji" style={{ backgroundColor: product.color }}>{product.emoji}</span><strong>{product.name}</strong><label><input type="checkbox" checked={product.available} onChange={(e) => changeProduct(product.id, { available: e.target.checked })} /> Disponible</label></div><div className="admin-fields"><label>Nombre<input value={product.name} onChange={(e) => changeProduct(product.id, { name: e.target.value })} /></label><label>Precio COP<input type="number" min="0" step="500" value={product.price} onChange={(e) => changeProduct(product.id, { price: Number(e.target.value) })} /></label><label>Categoría<select value={product.category} onChange={(e) => changeProduct(product.id, { category: e.target.value as Category })}>{Object.entries(categoryNames).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label><label>Presentación<input value={product.serving} onChange={(e) => changeProduct(product.id, { serving: e.target.value })} /></label><label className="wide">Descripción<input value={product.description} onChange={(e) => changeProduct(product.id, { description: e.target.value })} /></label></div></div>)}</div><button className="admin-add" type="button" onClick={addProduct}><Plus size={17} /> Agregar producto</button></section><button className="save-button mobile-save" type="submit" disabled={busy}><Save size={17} /> Guardar cambios</button></form>
        <aside><section className="admin-box orders-box"><div className="admin-box-title"><span><ShoppingBag size={18} /></span><div><h2>Cola de pedidos</h2><p>{orders.length} pedidos recientes</p></div><button type="button" className="refresh" onClick={() => load(token)} aria-label="Actualizar pedidos"><RefreshCw size={17} /></button></div>{orders.length === 0 ? <div className="orders-empty">Los pedidos que registren los clientes aparecerán aquí.</div> : <div className="orders-list">{orders.map((order) => <article key={order.id} className="order-row"><div><strong>{order.customerName}</strong><b>{formatCop(order.total)}</b></div><small>{order.id} · {dateLabel(order.pickupDate)} · {order.pickupTime}</small><p>{order.items.map((item) => `${item.quantity} × ${item.name}${item.flavor ? ` de ${item.flavor}` : ""}${item.preparation === "unidad" ? "" : ` en ${item.preparation}`}`).join(" · ")}</p>{order.notes && <p>Nota: {order.notes}</p>}<select value={order.status} onChange={(e) => changeStatus(order.id, e.target.value as StoredOrder["status"])} aria-label={`Estado de ${order.id}`}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></article>)}</div>}</section></aside></div>
    </div>
  </main>;
}
