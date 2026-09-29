import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, History, Target, Users } from "lucide-react";
import post from "../images/post.webp";

const Aboutus = () => {
  const stats = [
    { icon: <History className="w-6 h-6" />, label: "Since", value: "2007" },
    { icon: <CheckCircle2 className="w-6 h-6" />, label: "Natural", value: "100%" },
    { icon: <Target className="w-6 h-6" />, label: "States", value: "South India" },
    { icon: <Users className="w-6 h-6" />, label: "Partners", value: "Growing" },
  ];

  return (
    <section id="about-us" className="relative py-24 sm:py-32 bg-white overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-green/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Image Section */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-primary-green rounded-[3rem] rotate-3 group-hover:rotate-6 transition-transform duration-500 -z-10 opacity-10" />
              <div className="absolute inset-0 bg-mango-orange rounded-[3rem] -rotate-3 group-hover:-rotate-6 transition-transform duration-500 -z-10 opacity-10" />
              <img
                src={post}
                alt="Frutico Dairy Farming"
                className="w-full h-auto object-cover rounded-[3rem] shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                loading="lazy"
              />
              
              {/* Overlay stats */}
              <div className="absolute -bottom-10 -right-10 hidden sm:grid grid-cols-2 gap-4 p-6 bg-white rounded-3xl shadow-2xl border border-gray-100 z-20">
                {stats.map((stat, i) => (
                  <div key={i} className="flex flex-col items-center p-2">
                    <div className="text-primary-green mb-1">{stat.icon}</div>
                    <span className="text-xs font-inter text-gray-400 uppercase tracking-wider">{stat.label}</span>
                    <span className="font-outfit font-black text-gray-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Text Content Section */}
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
              Our Story
            </motion.span>
            <h2 className="font-outfit text-4xl sm:text-5xl font-black text-gray-900 mb-8 leading-tight">
              Crafting <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-secondary-green font-berkshire font-normal">Pure Joy</span> Since 2007
            </h2>
            
            <p className="font-inter text-lg text-gray-600 mb-10 leading-relaxed">
              Started as <span className="font-bold text-gray-900">Vigneshwara Agro Products</span>, our journey has always been about purity. With <span className="font-bold text-primary-green">Frutico</span>, we've transformed our dairy expertise into a premium range of 100% natural fruit ice creams.
            </p>

            <div className="space-y-6">
              {[
                {
                  title: "Naturally Ripened",
                  text: "Hand-picked fruits from Kolli Hills and Nilgiri, ripened on the tree for maximum flavor.",
                },
                {
                  title: "Chemical Free",
                  text: "Sulphur-free sugar and zero artificial colors. Just nature's vibrant palette.",
                },
                {
                  title: "Village Sourced",
                  text: "We source A-grade berries and dry fruits directly from local village farmers.",
                },
                {
                  title: "Vision of Purity",
                  text: "Expanding into pure milk products to bring nature's finest to every South Indian table.",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl hover:shadow-green-500/5 border border-transparent hover:border-primary-green/10 transition-all duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="mt-1">
                    <CheckCircle2 className="w-6 h-6 text-primary-green" />
                  </div>
                  <div>
                    <h3 className="font-outfit font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="font-inter text-gray-500 text-sm leading-relaxed">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Aboutus;
