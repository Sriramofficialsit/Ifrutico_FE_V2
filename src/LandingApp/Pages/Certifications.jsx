import React from "react";
import { motion } from "framer-motion";
import safetyImg from "../images/food_safety_cerificate_founder.webp";
import partnersImg from "../images/Partners.webp";
import { Award, Users, Sparkles } from "lucide-react";
import BorderGlow from "../Components/BorderGlow";

const Certifications = () => {
  return (
    <section id="certifications" className="relative py-24 sm:py-32 bg-gray-50/50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-green/5 rounded-full blur-[100px] -z-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-green/10 text-primary-green text-sm font-bold tracking-wider uppercase mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-4 h-4" />
            Certifications & Partners
          </motion.div>
          <motion.h2
            className="font-outfit text-4xl sm:text-5xl font-black text-gray-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Recognized for Excellence
          </motion.h2>
          <motion.p
            className="text-gray-600 font-inter text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Committed to the highest standards of food safety and collaborating with industry leaders to bring you the best natural products.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Food Safety Card */}
          <motion.div
            className="group relative flex flex-col transition-transform duration-500 hover:-translate-y-2"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <BorderGlow
              className="w-full h-full backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(34,197,94,0.1)] transition-shadow duration-500"
              backgroundColor="rgba(255,255,255,0.6)"
              borderRadius={40}
            >
              <div className="p-6 sm:p-10 relative z-10 w-full h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary-green/10 flex items-center justify-center text-primary-green">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="font-outfit text-2xl font-black text-gray-900">Food Safety Certified</h3>
                </div>

                <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-3xl overflow-hidden mb-6 border border-gray-100 shadow-inner group-hover:border-primary-green/30 transition-colors duration-500">
                  <div className="absolute inset-0 bg-gray-100 animate-pulse -z-10" />
                  <img
                    src={safetyImg}
                    alt="Getting Food Safety Certificate"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-gray-600 font-inter text-sm leading-relaxed">
                    Our founder officially receiving the Food Safety Certificate. We adhere to rigorous hygiene and quality protocols to ensure every product is exceptionally safe and pure.
                  </p>
                </div>
              </div>
            </BorderGlow>
          </motion.div>

          {/* Partners Card */}
          <motion.div
            className="group relative flex flex-col transition-transform duration-500 hover:-translate-y-2"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <BorderGlow
              className="w-full h-full backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(34,197,94,0.1)] transition-shadow duration-500"
              backgroundColor="rgba(255,255,255,0.6)"
              borderRadius={40}
            >
              <div className="p-6 sm:p-10 relative z-10 w-full h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-mango-orange/10 flex items-center justify-center text-mango-orange">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-outfit text-2xl font-black text-gray-900">Our Trusted Partners</h3>
                </div>

                <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-3xl overflow-hidden mb-6 border border-gray-100 shadow-inner group-hover:border-mango-orange/30 transition-colors duration-500">
                  <div className="absolute inset-0 bg-gray-100 animate-pulse -z-10" />
                  <img
                    src={partnersImg}
                    alt="Our Valued Partners"
                    loading="lazy"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-gray-600 font-inter text-sm leading-relaxed">
                    We are proud to collaborate with esteemed partners. Together, we are committed to building a strong network that delivers authentic natural products.
                  </p>
                </div>
              </div>
            </BorderGlow>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Certifications;
