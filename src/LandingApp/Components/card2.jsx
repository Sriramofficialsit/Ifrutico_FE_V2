import React from "react";
import { motion } from "framer-motion";
import BorderGlow from "./BorderGlow";

const Card2 = ({ category, img }) => {
  const altText = `${category} – Frutico Natural Product Category`;

  return (
    <motion.div
      className="group relative w-[90vw] sm:max-w-[340px] h-[420px] mb-6 sm:mb-10 mx-auto cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.95 }}
      viewport={{ once: true }}
      role="region"
      aria-label={`Product category: ${category}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-green/20 to-transparent rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <BorderGlow
        className="w-full h-full backdrop-blur-2xl bg-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/20 overflow-hidden"
        backgroundColor="rgba(255,255,255,0.1)"
        borderRadius={48}
      >
        {/* The Full Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={img}
            alt={altText}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          {/* Glassy Overlay with reflections */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-end p-6 sm:p-8 w-full h-full pb-10">
          <h3 className="font-outfit text-2xl sm:text-4xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] text-center mb-2">
            {category}
          </h3>

          <div className="flex flex-col items-center mt-2">
            <div className="h-1 w-16 bg-white/50 rounded-full my-3 shadow-lg group-hover:bg-white transition-colors duration-300" />
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 group-hover:bg-white/30 backdrop-blur-md rounded-full border border-white/30 text-white font-inter font-bold text-[10px] sm:text-xs tracking-widest uppercase drop-shadow-md transition-all duration-300">
              <span>view full menu</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Dynamic Water Shine Effect */}
        <motion.div
          className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-45 pointer-events-none"
          animate={{ translateX: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
        />
      </BorderGlow>
    </motion.div>
  );
};

const ChevronRight = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
  </svg>
);

export default Card2;
