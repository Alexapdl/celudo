import type { Metadata } from "next";
import { Outfit, Press_Start_2P } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const pressStart2D = Press_Start_2P({
  variable: "--font-press-start-2d",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Celudo — Play Ludo, Boost Your Yield",
  description: "Celudo is the first Play-to-Boost platform on Celo. Stake tokens, play Ludo for free, and boost your staking APY with tournament points.",
  icons: {
    icon: "/celudo_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${pressStart2D.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
