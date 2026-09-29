import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Presupuesto Sin Miedo — tu presupuesto personal con IA",
  description:
    "Ordena tus finanzas personales con ayuda de inteligencia artificial: categoriza tus gastos, mide tu salud financiera y recibe recomendaciones de ahorro personalizadas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
