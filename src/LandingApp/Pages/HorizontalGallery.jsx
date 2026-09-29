import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// Import images
import gsap1 from "../images/gsap1.webp";
import gsap2 from "../images/gsap2.webp";
import gsap3 from "../images/gsap3.webp";
import gsap4 from "../images/gsap4.webp";
import gsap5 from "../images/gsap5.webp";
import gsap6 from "../images/gsap1.webp"; // Using gsap1 as 6th or any other image

gsap.registerPlugin(ScrollTrigger);

const HorizontalGallery = () => {
  const sectionRef = useRef(null);
  const triggerRef = useRef(null);

  const galleryItems = [
    { id: 1, img: gsap1, title: "Pure Harvest", subtitle: "Nature's Finest Selection" },
    { id: 2, img: gsap2, title: "Artisan Quality", subtitle: "Handcrafted with Care" },
    { id: 3, img: gsap3, title: "Natural Bounty", subtitle: "Sun-Ripened Excellence" },
    { id: 4, img: gsap4, title: "Fresh Essence", subtitle: "Authentic Fruit Flavors" },
    { id: 5, img: gsap5, title: "Sustainable Roots", subtitle: "Eco-Friendly Farming" },
    { id: 6, img: gsap6, title: "Frutico Legacy", subtitle: "A Journey of Freshness" },
  ];

  useEffect(() => {
    const totalWidth = sectionRef.current.offsetWidth;
    const viewportWidth = window.innerWidth;
    const xDist = totalWidth - viewportWidth;

    const pin = gsap.fromTo(
      sectionRef.current,
      {
        translateX: 0,
      },
      {
        translateX: -xDist,
        ease: "none",
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: () => `+=${sectionRef.current.offsetWidth - window.innerWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 1,
        },
      }
    );

    return () => {
      pin.kill();
    };
  }, []);

  return (
    <section className="relative z-20 overflow-hidden bg-white">
      <div ref={triggerRef} className="relative bg-white w-full h-full">
        <div 
          ref={sectionRef} 
          className="h-screen w-max flex flex-row items-center px-[5vw] sm:px-[10vw]"
        >
          {/* Introductory Slide */}
          <div className="h-full w-[90vw] sm:w-[100vw] flex flex-col justify-center shrink-0 pr-[5vw] sm:pr-[10vw]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-500 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-6 sm:mb-8 w-fit"
            >
              <Sparkles className="w-4 h-4 text-primary-green" />
              The Visual Journey
            </motion.div>
            <h2 className="font-outfit text-4xl sm:text-6xl md:text-8xl font-black text-gray-900 leading-[1.1] mb-6 sm:mb-8">
              Experience <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-secondary-green font-berkshire font-normal">Pure Nature</span>
            </h2>
            <p className="text-gray-400 font-inter text-base sm:text-xl max-w-sm sm:max-w-lg leading-relaxed">
              Scroll horizontally to discover the meticulous process and vibrant life behind every Frutico creation.
            </p>
          </div>

          {/* Image Cards */}
          {galleryItems.map((item, index) => (
            <div 
              key={item.id} 
              className={`h-[55vh] sm:h-[70vh] w-[85vw] sm:w-[45vw] shrink-0 relative group ${index === galleryItems.length - 1 ? 'mr-0' : 'mr-[8vw] sm:mr-[5vw]'}`}
            >
              <div className="w-full h-full rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-gray-100 transition-all duration-700 group-hover:scale-[1.02] group-hover:shadow-2xl">
                <img
                  src={item.img}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                
                {/* Overlay Text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 sm:p-12">
                  <h3 className="font-outfit text-2xl sm:text-4xl font-black text-white mb-1 sm:mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    {item.title}
                  </h3>
                  <p className="font-inter text-white/80 text-sm sm:text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Floating Number Decor - Hidden on small mobile to avoid clutter */}
              <span className="hidden sm:block absolute -top-10 -left-10 text-[12rem] font-outfit font-black text-gray-50 select-none -z-10 group-hover:text-gray-100 transition-colors duration-500">
                0{item.id}
              </span>
            </div>
          ))}

          {/* Ending Spacer - Calculated to center the last card */}
          <div className="w-[7.5vw] sm:w-[27.5vw] shrink-0" />
        </div>
      </div>
    </section>
  );
};

export default HorizontalGallery;
