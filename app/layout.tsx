import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jugos Las Delicias de Yumbo | Jugos naturales y pedidos para recoger",
  description: "Consulta los sabores y precios, revisa los días de atención en Parque Belalcázar y deja listo tu pedido para recoger en Jugos Las Delicias de Yumbo.",
  icons: { icon: "/images/logo-oficial.png", shortcut: "/images/logo-oficial.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
