import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import AcademyIntro from "@/components/landing/AcademyIntro";
import AcademyJourney from "@/components/landing/AcademyJourney";
import HowItWorks from "@/components/landing/HowItWorks";
import LearningModes from "@/components/landing/LearningModes";
import Assessment from "@/components/landing/Assessment";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <AcademyIntro />
        <AcademyJourney />
        <HowItWorks />
        <LearningModes />
        <Assessment />
        <FAQ />
      </main>

      <Footer />
    </>
  );
}