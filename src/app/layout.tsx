import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ניתוח מכרזים - פורן שרם",
  description: "מערכת ניתוח מכרזים אוטומטית בעזרת בינה מלאכותית",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
