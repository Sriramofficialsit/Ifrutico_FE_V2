import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import Marquee from "react-fast-marquee";
import Testicard from "../Components/Testicard";
import FeedbackForm from "../Components/FeedbackForm";
import { Sparkles, MessageSquarePlus } from "lucide-react";

const API = `/api/testimonials/approved`;

const Testimonial = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await fetch(API);
        const data = await res.json();
        if (data.success) {
          setTestimonials(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch testimonials", err);
      }
    };
    fetchTestimonials();
  }, []);

  const fallbackData = [
    { name: "Rajesh Kumar", content: "The Jackfruit flavor is out of this world. Never thought a natural ice cream could capture the aroma so perfectly! Truly premium quality.", rating: 5, gender: "male" },
    { name: "Meera Krishnan", content: "I've been a regular at their outlet. The fact that they use real fruit pulp makes it the best healthy treat for my toddlers. They just love the Tender Coconut!", rating: 5, gender: "female" },
    { name: "Karthik Raja", content: "Finally found an ice cream that doesn't feel like a sugar bomb. The creamy texture of the Guava flavor with that hint of spice is genius.", rating: 5, gender: "male" },
    { name: "Sneha Reddy", content: "Pure magic! You can literally see the fruit pieces. It's not just ice cream, it's a real fruit experience in every scoop.", rating: 5, gender: "female" },
    { name: "Vijay Ananth", content: "The Sitaphal flavor is incredibly creamy and authentic. It's refreshing to see a brand committed to 100% natural ingredients.", rating: 5, gender: "male" },
    { name: "Priya Sharma", content: "The packaging and the taste both scream quality. It's my go-to dessert for every family gathering now.", rating: 5, gender: "female" },
  ];

  const displayData = testimonials.length > 0 ? testimonials : fallbackData;

  return (
    <section id="testimonial" className="relative py-24 sm:py-32 bg-gray-50/50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary-green/5 rounded-full blur-[120px] -z-10" />

      <Helmet>
        <title>Frutico - Natural Fruit Ice Cream & Dairy Products</title>
        <meta
          name="description"
          content="Hear what our customers say about Frutico's natural ice creams. Enjoy real fruit flavors and premium ingredients."
        />
      </Helmet>

      <div className="relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 px-4">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-green/10 text-primary-green text-sm font-bold tracking-wider uppercase mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-4 h-4" />
            Testimonials
          </motion.div>
          <motion.h2
            className="font-outfit text-4xl sm:text-5xl font-black text-gray-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-secondary-green font-berkshire font-normal">Ice Cream</span> Enthusiasts
          </motion.h2>
          <motion.p
            className="text-gray-600 font-inter text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Don't just take our word for it. Here's what our happy customers have to say about their Frutico experience.
          </motion.p>

          <motion.button
            onClick={() => setIsFormOpen(true)}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary-green text-primary-green font-inter font-bold rounded-full hover:bg-primary-green hover:text-white transition-all duration-300 shadow-lg shadow-green-500/5"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <MessageSquarePlus className="w-5 h-5" />
            Leave Your Feedback
          </motion.button>
        </div>

        <motion.div
          className="w-full relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <Marquee
            speed={40}
            gradient={true}
            gradientColor={[249, 250, 251]}
            gradientWidth={100}
            pauseOnHover
            className="py-12 sm:py-20 no-scrollbar"
          >
            <div className="flex gap-4 sm:gap-8 px-4">
              {displayData.map((curr, index) => (
                <Testicard 
                  key={curr._id || index} 
                  name={curr.name} 
                  des={curr.content || curr.des} 
                  rating={curr.rating} 
                  gender={curr.gender} 
                />
              ))}
            </div>
          </Marquee>
        </motion.div>

        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <p className="font-inter text-gray-400 text-sm font-medium tracking-widest uppercase">
            Over 10,000+ Happy Scoops Served
          </p>
        </motion.div>
      </div>

      <FeedbackForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </section>
  );
};

export default Testimonial;
