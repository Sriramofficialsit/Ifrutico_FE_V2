import React from "react";
import { motion } from "framer-motion";
import newsImg from "../images/news.webp";
import { Newspaper, Calendar, ArrowRight } from "lucide-react";

const NewsSection = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gray-50 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Text Content */}
          <motion.div 
            className="w-full lg:w-1/2 order-2 lg:order-1"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary-green/10 text-primary-green px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
              <Newspaper className="w-4 h-4" />
              Latest Updates
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-outfit font-black text-gray-900 mb-8 leading-tight">
              Frutico in the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-secondary-green font-berkshire font-normal">Spotlight</span>
            </h2>
            
            <p className="text-gray-600 font-inter text-lg mb-8 leading-relaxed">
              Stay tuned with the latest happenings at Frutico. From new flavor launches to our community initiatives, discover how we're spreading joy one scoop at a time.
            </p>

            <div className="space-y-6 mb-10">
              <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-mango-orange/10 rounded-xl text-mango-orange">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-outfit font-bold text-gray-900">New Summer Collection '24</h4>
                  <p className="text-gray-500 text-sm mt-1">Exploring 15+ new exotic fruit combinations from Kolli Hills.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-secondary-green/10 rounded-xl text-secondary-green">
                  <ArrowRight className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-outfit font-bold text-gray-900">Award for Sustainable Sourcing</h4>
                  <p className="text-gray-500 text-sm mt-1">Recognized for our direct-from-farmer approach and organic practices.</p>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ x: 10 }}
              className="flex items-center gap-2 text-primary-green font-inter font-black text-lg group"
            >
              Read Full Stories
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          {/* Image Content - Magazine Style */}
          <motion.div 
            className="w-full lg:w-1/2 order-1 lg:order-2"
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative group">
              {/* Decorative paper stack effect */}
              <div className="absolute -inset-4 bg-white/50 border border-gray-200 rounded-2xl rotate-3 -z-10" />
              <div className="absolute -inset-2 bg-white border border-gray-200 rounded-2xl -rotate-2 -z-10 shadow-xl" />
              
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <motion.img
                  src={newsImg}
                  alt="Frutico News"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* News Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                  <span className="text-primary-green font-inter font-bold text-xs tracking-widest uppercase">Featured Article</span>
                  <h3 className="text-white font-outfit text-2xl font-bold mt-2">Purity in Every Scoop: The Frutico Journey</h3>
                </div>
              </div>
              
              {/* Floating Badge */}
              <motion.div 
                className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 hidden sm:block"
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="text-center">
                  <p className="text-primary-green font-outfit font-black text-2xl">TOP</p>
                  <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">STORY</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default NewsSection;
