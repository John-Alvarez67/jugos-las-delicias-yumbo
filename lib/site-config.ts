export type Category = "naturales" | "vitaminas" | "suplementos";
export type Preparation = "agua" | "leche" | "unidad";

export type Product = {
  id: string;
  name: string;
  description: string;
  category: Category;
  emoji: string;
  color: string;
  price: number;
  serving: string;
  allowMilk: boolean;
  available: boolean;
};

export type SiteConfig = {
  businessName: string;
  founderName: string;
  whatsappNumber: string;
  address: string;
  hours: string;
  welcome: string;
  acceptingOrders: boolean;
  availableDates: string[];
  pickupTimes: string[];
  products: Product[];
};

const oddNovemberDays = Array.from({ length: 15 }, (_, index) => `2026-11-${String(index * 2 + 1).padStart(2, "0")}`);

export const defaultConfig: SiteConfig = {
  businessName: "Jugos Las Delicias de Yumbo",
  founderName: "Mary Luz Giraldo",
  whatsappNumber: "",
  address: "Carrera 4 con Calle 6, Parque Belalcázar, Yumbo",
  hours: "Atención en las fechas disponibles publicadas en el calendario.",
  welcome: "Jugos naturales hechos al momento. Elige tu sabor, programa la recogida y envíanos el resumen por WhatsApp.",
  acceptingOrders: true,
  availableDates: oddNovemberDays,
  pickupTimes: ["9:00 a. m.", "10:00 a. m.", "11:00 a. m.", "12:00 p. m.", "2:00 p. m.", "3:00 p. m.", "4:00 p. m."],
  products: [
    { id: "borojo", name: "Borojó", description: "Intenso y tradicional.", category: "naturales", emoji: "🥥", color: "#A76C45", price: 8000, serving: "12 oz", allowMilk: true, available: true },
    { id: "lulo", name: "Lulo", description: "Fresco y cítrico.", category: "naturales", emoji: "🍈", color: "#9FCC32", price: 8000, serving: "12 oz", allowMilk: true, available: true },
    { id: "maracuya", name: "Maracuyá", description: "Tropical y refrescante.", category: "naturales", emoji: "🟡", color: "#F4BC24", price: 8000, serving: "12 oz", allowMilk: true, available: true },
    { id: "mango", name: "Mango", description: "Dulce y suave.", category: "naturales", emoji: "🥭", color: "#FF952B", price: 8000, serving: "12 oz", allowMilk: true, available: true },
    { id: "mora", name: "Mora", description: "Frutal y ligeramente ácida.", category: "naturales", emoji: "🫐", color: "#7C3F85", price: 8000, serving: "12 oz", allowMilk: true, available: true },
    { id: "banano", name: "Banano", description: "Cremoso y nutritivo.", category: "naturales", emoji: "🍌", color: "#F1CD3F", price: 8000, serving: "12 oz", allowMilk: true, available: true },
    { id: "guanabana", name: "Guanábana", description: "Suave y tropical.", category: "naturales", emoji: "🍃", color: "#A6CF76", price: 8000, serving: "12 oz", allowMilk: true, available: true },
    { id: "vitaminas-2", name: "Jugo con 2 vitaminas", description: "Preparación con vitaminas.", category: "vitaminas", emoji: "💊", color: "#14B7CF", price: 12000, serving: "12 oz", allowMilk: false, available: true },
    { id: "vitaminas-4", name: "Jugo con 4 vitaminas", description: "Preparación con vitaminas.", category: "vitaminas", emoji: "✨", color: "#007AB9", price: 15000, serving: "12 oz", allowMilk: false, available: true },
    { id: "vitafer-l", name: "Vitafer-L", description: "Vitamina por separado.", category: "suplementos", emoji: "🧴", color: "#D79A45", price: 38000, serving: "unidad", allowMilk: false, available: true },
    { id: "lion-force", name: "Lion Force", description: "Vitamina por separado.", category: "suplementos", emoji: "🦁", color: "#6D8C39", price: 35000, serving: "unidad", allowMilk: false, available: true },
    { id: "ginseng", name: "Ginseng Royal Jelly", description: "Vitamina por separado.", category: "suplementos", emoji: "🌿", color: "#BF4437", price: 90000, serving: "unidad", allowMilk: false, available: true }
  ]
};

export function formatCop(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

export function dateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(date);
}
