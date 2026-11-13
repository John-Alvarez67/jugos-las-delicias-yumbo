"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowRight, Check, Clock3, MapPin, Minus, Plus, ShoppingBag, Sparkles } from "lucide-react";
import AvailabilityCalendar from "./components/AvailabilityCalendar";
import { dateLabel, defaultConfig, formatCop, type Preparation, type Product, type SiteConfig } from "../lib/site-config";

type CartItem = { productId: string; preparation: Preparation; flavor?: string; quantity: number };
type CreatedOrder = { id: string; total: number; items: Array<{ name: string; flavor?: string; preparation: Preparation; quantity: number; subtotal: number }> };

function todayInBogota() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function itemKey(item: Omit<CartItem, "quantity">) {
  return `${item.productId}:${item.preparation}:${item.flavor ?? ""}`;
}

function MenuCard({ product, flavors, onAdd }: { product: Product; flavors: string[]; onAdd: (product: Product, preparation: Preparation, flavor?: string) => void }) {
  const [preparation, setPreparation] = useState<Preparation>("agua");
  const [flavor, setFlavor] = useState(flavors[0] ?? "");
  return (
    <article className={`menu-card ${product.available ? "" : "unavailable"}`}>
      <div className="menu-card-head">
        <span className="fruit-icon" style={{ backgroundColor: product.color }} aria-hidden="true">{product.emoji}</span>
        <span className={`stock-label ${product.available ? "" : "off"}`}>{product.available ? "Disponible" : "Agotado"}</span>
      </div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="menu-card-price"><strong>{formatCop(product.price)}</strong><span>{product.serving}</span></div>
      {product.category === "naturales" && product.allowMilk && <div className="prep-options" role="group" aria-label={`Preparación de ${product.name}`}>
        <button type="button" className={preparation === "agua" ? "chosen" : ""} onClick={() => setPreparation("agua")}>En agua</button>
        <button type="button" className={preparation === "leche" ? "chosen" : ""} onClick={() => setPreparation("leche")}>En leche</button>
      </div>}
      {product.category === "vitaminas" && <label className="flavor-select">Sabor del jugo<select value={flavor} onChange={(event) => setFlavor(event.target.value)}>{flavors.map((name) => <option key={name}>{name}</option>)}</select></label>}
      <button type="button" className="add-button" disabled={!product.available || (product.category === "vitaminas" && !flavor)} onClick={() => onAdd(product, product.category === "naturales" ? preparation : "unidad", product.category === "vitaminas" ? flavor : undefined)}>
        <Plus size={17} strokeWidth={2.6} /> Agregar al pedido
      </button>
    </article>
  );
}

export default function Home() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    fetch("/api/config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("No fue posible cargar el menú");
        return (await response.json()) as SiteConfig;
      })
      .then((data) => {
        setConfig(data);
        setPickupDate(data.availableDates.find((date) => date >= todayInBogota()) ?? "");
        setPickupTime(data.pickupTimes[0] ?? "");
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const flavors = useMemo(() => config.products.filter((p) => p.category === "naturales" && p.available).map((p) => p.name), [config.products]);
  const products = useMemo(() => new Map(config.products.map((p) => [p.id, p])), [config.products]);
  const details = cart.map((item) => ({ item, product: products.get(item.productId) })).filter((entry): entry is { item: CartItem; product: Product } => Boolean(entry.product));
  const total = details.reduce((sum, { item, product }) => sum + item.quantity * product.price, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const nextDate = config.availableDates.find((date) => date >= todayInBogota());
  const naturalPrices = config.products.filter((product) => product.category === "naturales" && product.available).map((product) => product.price);
  const lowestNaturalPrice = naturalPrices.length ? Math.min(...naturalPrices) : null;

  function addItem(product: Product, preparation: Preparation, flavor?: string) {
    const key = itemKey({ productId: product.id, preparation, flavor });
    setCart((current) => {
      const existing = current.find((item) => itemKey(item) === key);
      return existing
        ? current.map((item) => itemKey(item) === key ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { productId: product.id, preparation, flavor, quantity: 1 }];
    });
    setMessage(`${product.name} agregado al pedido.`);
  }

  function changeQuantity(item: CartItem, difference: number) {
    setCart((current) => current.map((entry) => itemKey(entry) === itemKey(item) ? { ...entry, quantity: entry.quantity + difference } : entry).filter((entry) => entry.quantity > 0));
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!customerName.trim() || !pickupDate || !pickupTime || cart.length === 0) {
      setMessage("Escribe tu nombre, selecciona fecha y hora, y agrega un producto.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, pickupDate, pickupTime, notes, items: cart }),
      });
      const data = (await response.json()) as { order?: CreatedOrder; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error ?? "No pudimos registrar el pedido.");
      const order = data.order;
      const lines = order.items.map((item) => `• ${item.quantity} × ${item.name}${item.flavor ? ` de ${item.flavor}` : ""}${item.preparation === "unidad" ? "" : ` en ${item.preparation}`} — ${formatCop(item.subtotal)}`);
      const text = [`Hola, soy ${customerName.trim()}. Quiero confirmar este pedido para recoger en Jugos Las Delicias de Yumbo:`, "", ...lines, "", `Total estimado: ${formatCop(order.total)}`, `Recogida: ${dateLabel(pickupDate)} a las ${pickupTime}`, notes.trim() ? `Nota: ${notes.trim()}` : "", `Código: ${order.id}`].filter(Boolean).join("\n");
      setSummary(text);
      const number = config.whatsappNumber.replace(/\D/g, "");
      if (number) {
        const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
        setWhatsappUrl(url);
        setMessage(`Pedido ${order.id} registrado. Toca Enviar en WhatsApp para confirmar con la tienda.`);
        window.location.assign(url);
      } else {
        setMessage(`Pedido ${order.id} registrado en la cola. La tienda aún debe configurar su número de WhatsApp.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos registrar el pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand"><Image src="/images/logo-oficial.png" alt="Logo de Jugos Las Delicias de Yumbo" width={57} height={57} priority /><span>Jugos Las Delicias <small>de Yumbo</small></span></Link>
        <nav aria-label="Navegación principal"><a href="#menu">Menú</a><a href="#disponibilidad">Disponibilidad</a><a href="#ubicacion">Ubicación</a><a className="nav-order" href="#pedido"><ShoppingBag size={16} /> Mi pedido <b>{count}</b></a></nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-photo"><Image src="/images/hero-jugos.webp" alt="Jugos naturales de frutas tropicales preparados al momento" fill priority sizes="100vw" /></div>
        <div className="hero-shade" />
        <div className="hero-content"><span className="hero-kicker"><Sparkles size={15} /> Frescura de Yumbo en cada vaso</span><h1>Un sabor que <em>alegra tu día.</em></h1><p>{config.welcome}</p><div className="hero-actions"><a className="button-primary" href="#menu">Explorar menú <ArrowRight size={17} /></a><a className="button-ghost" href="#disponibilidad">Ver días de atención <ArrowDown size={16} /></a></div><div className="hero-location"><MapPin size={17} /><span>Parque Belalcázar, Yumbo</span></div></div>
      </section>

      <div className="benefits"><div><span>01</span><strong>Elige tu jugo</strong><small>Sabores naturales y vitaminas</small></div><div><span>02</span><strong>Escoge el día</strong><small>Solo fechas habilitadas</small></div><div><span>03</span><strong>Recoge en el puesto</strong><small>Sin servicio a domicilio</small></div></div>

      <section className="section menu-section" id="menu"><div className="section-title"><span className="kicker">El menú</span><h2>Sabores hechos para ti</h2><p>Jugos naturales preparados para disfrutar en cada visita.</p></div>
        {loadError && <div className="alert">No pudimos cargar el menú actualizado. Vuelve a intentarlo en unos minutos.</div>}
        {loading ? <div className="loading">Cargando menú…</div> : <>
          <div className="category-title"><div><h3>Jugos naturales</h3><p>En agua o leche · vaso de 12 oz</p></div>{lowestNaturalPrice !== null && <span>Desde {formatCop(lowestNaturalPrice)}</span>}</div>
          <div className="menu-grid">{config.products.filter((p) => p.category === "naturales").map((p) => <MenuCard key={p.id} product={p} flavors={flavors} onAdd={addItem} />)}</div>
          <div className="category-title"><div><h3>Jugos con vitaminas</h3><p>Elige cuántas vitaminas y tu sabor favorito</p></div></div>
          <div className="menu-grid compact">{config.products.filter((p) => p.category === "vitaminas").map((p) => <MenuCard key={p.id} product={p} flavors={flavors} onAdd={addItem} />)}</div>
          <div className="category-title"><div><h3>Vitaminas por separado</h3><p>Productos publicados en el menú de la tienda</p></div></div>
          <div className="menu-grid compact">{config.products.filter((p) => p.category === "suplementos").map((p) => <MenuCard key={p.id} product={p} flavors={flavors} onAdd={addItem} />)}</div>
        </>}
      </section>

      <section className="availability-section" id="disponibilidad"><div className="availability-copy"><span className="kicker">Planea tu visita</span><h2>Consulta cuándo estamos atendiendo</h2><p>El local abre en fechas seleccionadas por Mary Luz. Consulta los días marcados antes de ir al puesto.</p><div className="next-open"><Clock3 size={21} /><div><small>Próximo día disponible</small><strong>{nextDate ? dateLabel(nextDate) : "Por confirmar"}</strong></div></div><div className="address-card"><MapPin size={21} /><div><strong>Nos encuentras en</strong><p>{config.address}</p></div></div></div><AvailabilityCalendar availableDates={config.availableDates} selectedDate={pickupDate} onSelect={setPickupDate} /></section>

      <section className="order-section" id="pedido"><div className="order-copy"><span className="kicker">Fácil y rápido</span><h2>Deja tu pedido listo</h2><p>Arma el pedido aquí. Se guardará en la cola de la tienda y podrás enviar el resumen al WhatsApp Business para recibir la confirmación.</p><div className="order-steps"><div><b>1</b><span>Agrega tus favoritos del menú.</span></div><div><b>2</b><span>Elige una fecha disponible y la hora.</span></div><div><b>3</b><span>Envía el resumen por WhatsApp.</span></div></div><div className="founder">Preparado con cariño por <strong>{config.founderName}</strong></div></div>
        <form className="order-panel" onSubmit={submitOrder}><div className="panel-heading"><h3>Tu pedido</h3><span>{count} {count === 1 ? "producto" : "productos"}</span></div>
          {details.length ? <div className="cart-items">{details.map(({ item, product }) => <div className="cart-item" key={itemKey(item)}><span className="cart-emoji" style={{ backgroundColor: product.color }}>{product.emoji}</span><div><strong>{product.name}{item.flavor ? ` de ${item.flavor}` : ""}</strong><small>{product.serving}{item.preparation === "unidad" ? "" : ` · En ${item.preparation}`}</small><b>{formatCop(product.price * item.quantity)}</b></div><div className="quantity"><button type="button" onClick={() => changeQuantity(item, -1)} aria-label={`Quitar un ${product.name}`}><Minus size={13} /></button><span>{item.quantity}</span><button type="button" onClick={() => changeQuantity(item, 1)} aria-label={`Agregar un ${product.name}`}><Plus size={13} /></button></div></div>)}</div> : <div className="empty-cart"><ShoppingBag size={33} /><p>Aún no has agregado productos.</p><a href="#menu">Ver el menú <ArrowRight size={14} /></a></div>}
          <div className="form-fields"><label>Nombre de quien recoge<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Tu nombre" maxLength={80} required /></label><div className="field-row"><label>Fecha disponible<select value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} required><option value="">Selecciona una fecha</option>{config.availableDates.filter((date) => date >= todayInBogota()).map((date) => <option key={date} value={date}>{dateLabel(date)}</option>)}</select></label><label>Hora<select value={pickupTime} onChange={(event) => setPickupTime(event.target.value)} required><option value="">Selecciona una hora</option>{config.pickupTimes.map((time) => <option key={time} value={time}>{time}</option>)}</select></label></div><label>Nota opcional<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} placeholder="Ej. Sin azúcar o alguna indicación especial" /></label></div>
          <div className="total"><span>Total estimado</span><strong>{formatCop(total)}</strong></div><button className="submit-button" type="submit" disabled={submitting || !config.acceptingOrders || loadError || !pickupDate}>{submitting ? "Registrando pedido…" : "Registrar y abrir WhatsApp"} <ArrowRight size={17} /></button>{message && !message.includes("agregado") && <div className="order-message" role="status"><Check size={17} /><span>{message}{whatsappUrl && <><br /><a href={whatsappUrl}>Abrir WhatsApp manualmente</a></>}{summary && !whatsappUrl && <><br /><button type="button" onClick={() => navigator.clipboard.writeText(summary)}>Copiar resumen</button></>}</span></div>}<p className="order-footnote">El cliente debe tocar Enviar en WhatsApp. El pago se coordina directamente con la tienda.</p>
        </form></section>

      <section className="visit-section" id="ubicacion"><div><span className="kicker">Te esperamos</span><h2>Nos vemos en el parque</h2><p>{config.address}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address)}`} target="_blank" rel="noreferrer">Cómo llegar <ArrowRight size={16} /></a></div><Image src="/images/menu-oficial.png" alt="Menú de referencia de Jugos Las Delicias de Yumbo" width={285} height={323} /></section>
      <footer><div className="footer-brand"><Image src="/images/logo-oficial.png" alt="" width={68} height={68} /><div><strong>{config.businessName}</strong><span>Fundado por {config.founderName}</span></div></div><p>{config.address}<br />{config.hours}</p><Link href="/admin">Administración</Link></footer>
      {message.includes("agregado") && <div className="toast" role="status">{message}</div>}
    </main>
  );
}
