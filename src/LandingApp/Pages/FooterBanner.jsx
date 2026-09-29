import React from "react";
import { motion } from "framer-motion";
import footerImg from "../images/footer.webp";
import { ArrowRight, Sparkles } from "lucide-react";

const FooterBanner = () => {
  return (
    <section className="relative h-[550px] sm:h-[500px] overflow-hidden group">
      {/* Parallax Background Image */}
      <motion.div 
        className="absolute inset-0 w-full h-full"
        initial={{ scale: 1.1 }}
        whileInView={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <img
          src={footerImg}
          alt="Frutico Nature"
          loading="lazy"
          className="w-full h-full object-cover brightness-50"
        />
      </motion.div>

      {/* Animated Overlay Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-green/20 to-transparent opacity-40" />

      {/* Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white text-xs font-bold tracking-widest uppercase mb-4">
            <Sparkles className="w-4 h-4 text-mango-orange" />
            Join the Frutico Family
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-outfit font-black text-white leading-tight">
            Ready to Scoop some <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-secondary-green font-berkshire font-normal">Pure Magic</span>?
          </h2>
          
          <p className="text-gray-200 font-inter text-lg max-w-2xl mx-auto">
            Whether you want to enjoy our natural delights or become a partner in our growth, we're here to share nature's best with you.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.a
              href="#contact-us"
              className="px-10 py-5 bg-primary-green text-white rounded-full font-inter font-black text-lg shadow-2xl hover:bg-white hover:text-primary-green transition-all duration-300 flex items-center gap-3 group/btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Order Now
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
            </motion.a>
            
            <motion.a
              href="#dealership"
              className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-full font-inter font-black text-lg hover:bg-white/20 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Apply for Dealership
            </motion.a>
          </div>
        </motion.div>
      </div>

      {/* Decorative floating elements */}
      <motion.div 
        className="absolute bottom-10 right-10 w-32 h-32 bg-mango-orange/20 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />
    </section>
  );
};

export default FooterBanner;
