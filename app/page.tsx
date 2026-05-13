import { HeroGeometric } from "@/components/hero-geometric";
import { TopNav } from "@/components/top-nav";
import { Cinzel } from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export default function Page() {
  return (
    <main>
      <TopNav />
      <HeroGeometric
        badge="MUSIC"
        title1="Creat Your"
        title2="Own Sound"
        titleClassName={cinzel.className}
      />
    </main>
  );
}
