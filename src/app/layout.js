import "./globals.css";

export const metadata = {
  title: "Bank Sampah Digital",
  description:
    "Mulai kebiasaan mengelola sampah dengan lebih bijak bersama Bank Sampah Digital.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
