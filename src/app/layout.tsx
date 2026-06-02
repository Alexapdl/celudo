import type { Metadata } from "next";
import { Outfit, Pirata_One } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { cn } from "@/lib/utils";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const pirata = Pirata_One({
  variable: "--font-pirata",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Celudo — Play Ludo, Boost Your Yield",
  description: "Celudo is the first Play-to-Boost platform on Celo. Stake tokens, play Ludo for free, and boost your staking APY with tournament points.",
  icons: { icon: "/celudo_logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("h-full antialiased", outfit.variable, pirata.variable)}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
