import React from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { ArrowRight, Star, Heart, Leaf } from "lucide-react";
import women from "../images/women.webp";

const Promote = () => {
  const highlights = [
    { icon: <Leaf className="w-5 h-5" />, text: "Pure Milk & Solids" },
    { icon: <Star className="w-5 h-5" />, text: "No Artificial Flavors" },
    { icon: <Heart className="w-5 h-5" />, text: "Tree-Ripened Fruits" },
  ];

  return (
    <section id="promote" className="relative py-24 sm:py-32 bg-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-primary-green/5 rounded-full blur-[100px]" />

      <Helmet>
        <title>Frutico Classic Ice Creams - Pure Natural Ingredients</title>
        <meta
          name="description"
          content="Relive the sweet memories of classic ice creams with Frutico. Made from pure milk, handpicked fruits, and natural colors."
        />
      </Helmet>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Image Side */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, scale: 0.9, x: -50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-secondary-green/20 rounded-[3rem] blur-3xl -z-10" />
              <img
                src={women}
                alt="Frutico Promotion"
                loading="lazy"
                className="w-full h-auto object-cover rounded-[3rem] transition-transform duration-500 hover:scale-[1.02]"
              />
              
              {/* Floating Badge */}
              <motion.div
                className="absolute top-10 -right-5 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 hidden sm:block"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-green flex items-center justify-center text-white">
                    <Star className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <p className="font-inter font-bold text-gray-900 text-sm">Best Selection</p>
                    <p className="text-gray-400 text-xs">100% Natural Choice</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Text Side */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.span
              className="text-primary-green font-inter font-bold tracking-widest uppercase text-sm block mb-4"
            >
              Classic Memories
            </motion.span>
            <h2 className="font-outfit text-4xl sm:text-5xl font-black text-gray-900 mb-8 leading-tight">
              Relive the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-secondary-green font-berkshire font-normal">Sweet Memories</span> of Classic Scoops
            </h2>
            
            <p className="font-inter text-lg text-gray-600 mb-10 leading-relaxed">
              Frutico is crafted using pure milk, sulphur-free sugar, and tree-ripened fruits handpicked from the lush Kolli Hills and Nilgiris. No artificial flavors, just the authentic taste of nature.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {highlights.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="text-primary-green">{item.icon}</div>
                  <span className="font-outfit font-bold text-gray-700 text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <a
                href="#categories"
                className="group inline-flex items-center gap-3 px-10 py-5 bg-gray-900 text-white rounded-full font-inter font-black hover:bg-primary-green transition-all duration-300 shadow-xl"
              >
                Explore Our Menu
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Promote;
