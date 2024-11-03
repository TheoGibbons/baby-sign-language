import localFont from "next/font/local";
import "./globals.css";
import AuthProvider from "@/app/components/AuthProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Baby Sign Language",
  description: "Baby Sign Language app",
};

export default function RootLayout({children}) {
  return (
    <html lang="en">
    <head>
      <title>Baby Sign Language</title>
      <link rel="manifest" href="/manifest.json"/>
      <meta name="theme-color" content="#000000"/>
      <link rel="apple-touch-icon" href="/android-chrome-192x192.png"/>
    </head>
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
    <AuthProvider>
      {children}
    </AuthProvider>
    </body>
    </html>
  );
}
