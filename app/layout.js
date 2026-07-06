import "./globals.css";
import Providers from "./components/Providers";

export const metadata = {
  title: "MACCA PMS — Project Management System",
  description: "ระบบบริหารจัดการงานติดตั้งและบริการหลังการขาย สำหรับ MACCA Light Engineering",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
