import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "../images/side.webp";

const Landing = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-gradient pt-24 pb-12 sm:pt-28">

      <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        {/* Text Content */}
        <motion.div
          className="flex flex-col text-center lg:text-left lg:w-[55%] z-20"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-glass-white backdrop-blur-md border border-glass-border rounded-full px-4 py-2 mb-6 sm:mb-8 mx-auto lg:mx-0 shadow-glass w-fit"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Sparkles className="w-4 h-4 text-mango-orange" />
            <span className="text-sm font-inter font-medium text-primary-green tracking-wide">
              100% Natural & Chemical-Free
            </span>
          </motion.div>

          <motion.h1
            className="text-gray-900 font-outfit text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight drop-shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Taste the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-secondary-green font-berkshire font-normal block mt-2">Pure Magic</span>
          </motion.h1>

          <motion.p
            className="font-inter text-base sm:text-lg md:text-xl mb-8 sm:mb-10 text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Experience nature’s bounty in every bite. Handcrafted with handpicked Kolli Hills fruits and village-fresh milk. No artificial colors, just pure joy.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4 mx-auto lg:mx-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <a
              href="#favorites"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-green to-secondary-green text-white rounded-full font-inter font-semibold text-lg hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <span className="relative z-10 flex items-center gap-2">
                Explore Flavors
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
            
            <a
              href="#dealership"
              className="inline-flex items-center justify-center px-8 py-4 bg-glass-white backdrop-blur-md border border-primary-green/30 text-primary-green rounded-full font-inter font-semibold text-lg hover:bg-primary-green/10 transition-all duration-300 shadow-sm"
            >
              Become a Dealer
            </a>
          </motion.div>
          
          <motion.div 
            className="mt-12 flex items-center gap-6 justify-center lg:justify-start text-sm font-inter text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
             <div className="flex flex-col items-center lg:items-start">
               <span className="font-bold text-2xl text-gray-800">50+</span>
               <span>Flavors</span>
             </div>
             <div className="w-px h-10 bg-gray-300"></div>
             <div className="flex flex-col items-center lg:items-start">
               <span className="font-bold text-2xl text-gray-800">100%</span>
               <span>Natural</span>
             </div>
             <div className="w-px h-10 bg-gray-300"></div>
             <div className="flex flex-col items-center lg:items-start">
               <span className="font-bold text-2xl text-gray-800">15+</span>
               <span>Years Experience</span>
             </div>
          </motion.div>
        </motion.div>

        {/* Hero Image Container */}
        <motion.div
          className="lg:w-[45%] w-full h-[400px] sm:h-[500px] lg:h-[700px] relative flex justify-center items-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
        >
          {/* Decorative background blobs for the image */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary-green/10 rounded-full blur-[100px] -z-20"></div>
          
          <motion.div
            className="relative w-full h-full flex justify-center items-center"
            animate={{ y: [0, -18, 0] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ willChange: "transform" }}
          >
            <motion.img
              src={heroImage}
              alt="Frutico Natural Fruit Ice Cream - Premium Collection"
              fetchPriority="high"
              className="w-full h-auto max-h-[90%] object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.25)] relative z-10"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{ willChange: "transform" }}
            />

            {/* Glossy ring decoration around the image */}
            <div className="absolute inset-0 border-[20px] border-white/5 rounded-[5rem] -z-10 scale-90 blur-sm"></div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
