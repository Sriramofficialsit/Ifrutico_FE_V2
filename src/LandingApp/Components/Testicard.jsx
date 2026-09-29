import React from "react";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import a from "../images/man.webp";
import b from "../images/wom.webp";

const Testicard = ({ name, des, img, rating = 5, gender = "male" }) => {
  const avatar = img || (gender === "male" ? a : b);
  
  return (
    <motion.div
      className="relative flex flex-col sm:flex-row gap-6 sm:gap-8 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] bg-white/60 backdrop-blur-xl border-2 border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:bg-white/90 transition-all duration-500 w-[280px] sm:w-[500px] lg:w-[600px] mx-2 sm:mx-4"
      whileHover={{ y: -5 }}
    >
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 text-primary-green/5">
        <Quote className="w-12 h-12 sm:w-20 sm:h-20 rotate-180" />
      </div>

      <div className="relative z-10 flex-shrink-0 flex justify-center sm:block">
        <div className="relative">
          <div className="absolute inset-0 bg-primary-green rounded-2xl sm:rounded-3xl rotate-6 -z-10 opacity-10" />
          <img
            src={avatar}
            alt={name}
            loading="lazy"
            className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 object-cover rounded-2xl sm:rounded-3xl shadow-xl bg-white"
          />
        </div>
      </div>

      <div className="relative z-10 flex flex-col justify-center text-center sm:text-left">
        <div className="flex justify-center sm:justify-start gap-1 mb-3 sm:mb-4">
          {[1, 2, 3, 4, 5].map((_, i) => (
            <Star key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${i < rating ? "fill-mango-orange text-mango-orange" : "text-gray-200"}`} />
          ))}
        </div>
        
        <p className="font-inter text-gray-600 text-sm sm:text-base lg:text-lg italic leading-relaxed mb-4 sm:mb-6">
          "{des}"
        </p>

        <div>
          <h4 className="font-outfit font-black text-gray-900 text-lg sm:text-xl">{name}</h4>
          <p className="font-inter text-primary-green text-xs font-bold uppercase tracking-widest">Verified Scoop Lover</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Testicard;
