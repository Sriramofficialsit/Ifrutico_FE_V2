import React, { lazy, useEffect } from "react";
import SEO from "./Components/SEO";
import { seoData } from "../utils/seoData";
import Nav from "./Components/Nav";
import LazySection from "./Components/LazySection";
import Landing from "./Pages/Landing";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const IntroVideoHero = lazy(() => import("./Pages/IntroVideoHero"));
const Promote = lazy(() => import("./Pages/Promote"));
const Favorites = lazy(() => import("./Pages/Favorites"));
const ProcessVideoSection = lazy(() => import("./Pages/ProcessVideoSection"));
const Categories = lazy(() => import("./Pages/Categories"));
const NewsSection = lazy(() => import("./Pages/NewsSection"));
const Testimonial = lazy(() => import("./Pages/Testimonial"));
const BranchesSection = lazy(() => import("./Pages/BranchesSection"));
const Certifications = lazy(() => import("./Pages/Certifications"));
const Aboutus = lazy(() => import("./Pages/Aboutus"));
const Mailus = lazy(() => import("./Pages/Mailus"));
const HorizontalGallery = lazy(() => import("./Pages/HorizontalGallery"));
const FooterBanner = lazy(() => import("./Pages/FooterBanner"));
const Footer = lazy(() => import("./Pages/Footer"));

const App = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  return (
    <div className="scroll-smooth bg-gray-50 overflow-x-hidden">
      <SEO {...seoData.home} />

      {/* App Sections */}
      <Nav />
      <Landing />
      <LazySection rootMargin="200px 0px" minHeight="60vh"><IntroVideoHero /></LazySection>
      <LazySection id="promote"><Promote /></LazySection>
      <LazySection id="favorites"><Favorites /></LazySection>
      <LazySection id="process-section"><ProcessVideoSection /></LazySection>
      <LazySection><NewsSection /></LazySection>
      <LazySection id="categories" minHeight="120vh"><Categories /></LazySection>
      <LazySection id="testimonial"><Testimonial /></LazySection>
      <LazySection id="branches"><BranchesSection /></LazySection>
      <LazySection id="certifications"><Certifications /></LazySection>
      <LazySection id="about-us"><Aboutus /></LazySection>
      <LazySection id="dealership"><Mailus /></LazySection>
      <LazySection minHeight="100vh"><HorizontalGallery /></LazySection>
      <LazySection minHeight="40vh"><FooterBanner /></LazySection>
      <LazySection id="contact-us" minHeight="40vh"><Footer /></LazySection>
    </div>
  );
};

export default App;
