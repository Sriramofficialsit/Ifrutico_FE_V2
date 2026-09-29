import React from "react";
import { Helmet } from "react-helmet";
import { Star, ShoppingCart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import BorderGlow from "./BorderGlow";

const Card1 = ({ img, name, price, ratings, des }) => {
  const ratingValue = parseFloat(ratings) || 0;

  return (
    <motion.article
      className="group relative flex flex-col w-[300px] sm:w-[320px] h-[480px] cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.95 }}
      viewport={{ once: true }}
      itemScope
      itemType="https://schema.org/Product"
    >
      {/* Background glow shadow */}
      <div className="absolute inset-x-4 bottom-0 h-1/2 bg-primary-green/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <BorderGlow
        className="w-full h-full backdrop-blur-2xl bg-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/20 overflow-hidden"
        backgroundColor="rgba(255,255,255,0.1)"
        borderRadius={24}
      >
        {/* Dynamic Water Shine Effect */}
        <motion.div
          className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/15 to-transparent rotate-45 pointer-events-none"
          animate={{ translateX: ["-100%", "100%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />

        <div className="flex flex-col relative z-10 w-full h-full">

          <Helmet>
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org/",
                "@type": "Product",
                name: name,
                image: img,
                description: des,
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: ratingValue,
                  bestRating: "5",
                  worstRating: "1",
                },
                offers: {
                  "@type": "Offer",
                  priceCurrency: "INR",
                  price: price,
                  availability: "https://schema.org/InStock",
                },
              })}
            </script>
          </Helmet>

          {/* Image Container - Rectangular/Soft-Corner style */}
          <div className="relative h-60 p-6 z-10">
            <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.1)] bg-white/40 backdrop-blur-md border-2 border-white/80 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500">
              <motion.img
                src={img}
                alt={name}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
                loading="lazy"
                itemProp="image"
              />
              {/* Glassy reflection */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
            </div>
            
            {/* Rating badge */}
            <div className="absolute top-8 right-8 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg z-20 border border-white/50 scale-90 group-hover:scale-100 transition-transform duration-500">
              <Star className="w-4 h-4 text-mango-orange fill-mango-orange" />
              <span className="text-sm font-inter font-bold text-gray-800">{ratings}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 px-8 pb-8 pt-2 gap-2 z-10">
            <header className="space-y-1">
              <h1
                className="font-outfit text-2xl font-black text-gray-900 line-clamp-1 group-hover:text-primary-green transition-colors duration-300"
                itemProp="name"
              >
                {name}
              </h1>
              <p
                className="text-gray-500 font-inter text-sm line-clamp-2 leading-relaxed"
                itemProp="description"
              >
                {des}
              </p>
            </header>

            <div className="mt-auto pt-6 flex items-end justify-between border-t border-gray-100/30">
              <div className="flex flex-col">
                <span className="text-[10px] font-inter font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Our Signature</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-primary-green font-outfit font-bold text-xl">₹</span>
                  <p className="font-outfit text-4xl font-black text-gray-900 tracking-tight" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                    <span itemProp="price">{price}</span>
                  </p>
                </div>
              </div>
              
              <button 
                className="group/btn relative flex items-center justify-center w-14 h-14 bg-gray-900 text-white rounded-2xl hover:bg-primary-green transition-all duration-300 shadow-xl hover:shadow-primary-green/30 active:scale-90"
                aria-label="Add to cart"
              >
                <ShoppingCart className="w-6 h-6 group-hover/btn:scale-0 transition-transform duration-300" />
                <ArrowRight className="absolute scale-0 group-hover/btn:scale-110 w-6 h-6 transition-transform duration-300" />
                
                {/* Internal Glow */}
                <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none" />
              </button>
            </div>
          </div>
        </div>
      </BorderGlow>
    </motion.article>
  );
};

export default Card1;
