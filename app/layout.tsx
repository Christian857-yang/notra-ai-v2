import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Notra AI — GPT-4o Smart Assistant",
  description: "An intelligent multilingual AI assistant built with GPT-4o.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
