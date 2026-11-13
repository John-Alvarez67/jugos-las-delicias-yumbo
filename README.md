# Jugos Las Delicias de Yumbo

Sitio de demostración para consultar el menú, conocer los días de atención y preparar pedidos para recoger en el puesto de Mary Luz Giraldo.

## Funciones

- Menú de jugos naturales, jugos con vitaminas y vitaminas por separado.
- Calendario de atención editable desde `/admin`.
- Pedido con sabor, preparación, fecha, hora y resumen listo para WhatsApp Business.
- Cola privada de pedidos con estados.
- Panel para cambiar precios, disponibilidad, dirección, horario y teléfono de WhatsApp.

El cliente debe pulsar **Enviar** después de abrir WhatsApp. La web guarda el pedido antes de abrirlo.

## Tecnologías

Next.js, TypeScript y Vercel Blob privado. Las imágenes oficiales están en `public/images`; la imagen principal fue creada para esta demo tomando la marca y el menú como referencia.

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configura `BLOB_READ_WRITE_TOKEN` con una tienda privada de Vercel Blob y una clave larga en `ADMIN_TOKEN`. El archivo `.env.local` está excluido de Git.

## Datos iniciales

El catálogo y el calendario de noviembre de 2026 se encuentran en `lib/site-config.ts`. Los cambios guardados desde el panel se almacenan en Vercel Blob y prevalecen sobre esos datos iniciales. Para empezar un mes nuevo, Mary Luz puede marcar sus fechas en el calendario del panel.

Dirección: Carrera 4 con Calle 6, Parque Belalcázar, Yumbo.
