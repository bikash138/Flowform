import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Templates } from "@/components/landing/templates";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-[#FDFAF6] font-sans">
      <Navbar />
      <Hero />
      <HowItWorks />
      <div className="max-w-4xl mx-auto w-full px-6">
        <Separator className="bg-[#E8DDD0]" />
      </div>
      <Features />
      <div className="overflow-hidden rounded-t-[2.5rem] rounded-b-[2.5rem]">
        <Templates />
      </div>
      <Pricing />
      <div className="max-w-4xl mx-auto w-full px-6">
        <Separator className="bg-[#E8DDD0]" />
      </div>
      <FAQ />
      <Footer />
    </div>
  );
}
