import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { InteractionDemoSection } from "@/components/landing/interaction-demo-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CTASection } from "@/components/landing/cta-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <EnhancedNavbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <InteractionDemoSection />
      <TestimonialsSection />
      <CTASection />
      <PricingSection />
      <Footer />
    </main>
  );
}
// Copyright (c) 2026 Tanushree Sarkar
// All rights reserved.
// Unauthorized copying, modification, distribution is prohibited.