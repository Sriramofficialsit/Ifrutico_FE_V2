import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Card2 from "../Components/card2";
import Marquee from "react-fast-marquee";
import { Sparkles, ChevronRight, X, ShoppingBag, Phone, MessageSquare, Send, Loader2 } from "lucide-react";

import CircularGallery from "../Components/CircularGallery";

import fruitsNew from "../images/categories/fruits.webp";
import vegetablesNew from "../images/categories/vegetables.webp";
import flowersNew from "../images/categories/flowers.webp";
import nutsNew from "../images/categories/nuts.webp";
import spicesNew from "../images/categories/spices.webp";
import herbalNew from "../images/categories/herbal.webp";

import AmlaImg from "../images/fruits/Amla.webp";
import AppleImg from "../images/fruits/Apple.webp";
import AvocadoImg from "../images/fruits/Avocado.webp";
import BananaImg from "../images/fruits/Banana.webp";
import BeriImg from "../images/fruits/Beri.webp";
import CherryImg from "../images/fruits/Cherry.webp";
import CocoaImg from "../images/fruits/Cocoa.webp";
import CoconutImg from "../images/fruits/Coconut.webp";
import CustardImg from "../images/fruits/Custard.webp";
import DatesplamImg from "../images/fruits/Datesplam.webp";
import DragonFruitImg from "../images/fruits/Dragon fruit.webp";
import FigImg from "../images/fruits/Fig.webp";
import GrapesImg from "../images/fruits/Grapes.webp";
import GuavaImg from "../images/fruits/Guava.webp";
import JackfruitImg from "../images/fruits/Jackfruit.webp";
import KiwiImg from "../images/fruits/Kiwi.webp";
import LycheeImg from "../images/fruits/Lychee Love.webp";
import MangoImg from "../images/fruits/Mango.webp";
import MuskmelonImg from "../images/fruits/Muskmelon.webp";
import PapayaImg from "../images/fruits/Papaya.webp";
import PassionFruitImg from "../images/fruits/Passion fruit.webp";
import PeachImg from "../images/fruits/Peach.webp";
import PearImg from "../images/fruits/Pear.webp";
import PineappleImg from "../images/fruits/Pineapple.webp";
import PomogranateImg from "../images/fruits/Pomogranate.webp";
import SapotaImg from "../images/fruits/Sapota.webp";
import StrawberryImg from "../images/fruits/Strawberry.webp";
import WatermelonImg from "../images/fruits/Watermelon.webp";

import BeetrootImg from "../images/vegetables/Beetroot.webp";
import CarrotImg from "../images/vegetables/Carrot.webp";
import CornImg from "../images/vegetables/Corn.webp";
import CucumberImg from "../images/vegetables/Cucumber.webp";
import GarlicImg from "../images/vegetables/Garlic.webp";
import GreenChillyImg from "../images/vegetables/Green chilli.webp";
import MintImg from "../images/vegetables/Mint.webp";
import PumpkinImg from "../images/vegetables/Pumpkin.webp";
import SweetPotatoImg from "../images/vegetables/Sweet Potato.webp";
import TomatoImg from "../images/vegetables/Tomato.webp";

import HibiscusImg from "../images/flowers/Hibiscus.webp";
import JasmineImg from "../images/flowers/Jasmine.webp";
import RoseImg from "../images/flowers/Rose.webp";
import SunflowerImg from "../images/flowers/Sunflower Butter.webp";

import AlmondImg from "../images/nuts/Almond.webp";
import BlackWalnutImg from "../images/nuts/Black Walnut.webp";
import CashewImg from "../images/nuts/Cashew Nut.webp";
import GroundnutsImg from "../images/nuts/Groundnuts.webp";
import PistachioImg from "../images/nuts/Pistachio.webp";
import SesameImg from "../images/nuts/Sesame.webp";
import WalnutImg from "../images/nuts/Walnut.webp";

import CardamonImg from "../images/spices/Cardamon.webp";
import CinnamonImg from "../images/spices/Cinnamon.webp";
import FennelImg from "../images/spices/Fennel.webp";

import AloeVeraImg from "../images/herbal/Aloe Vera.webp";
import BasilImg from "../images/herbal/Basil.webp";

// Must be a stable reference: CircularGallery tears down and rebuilds its WebGL scene
// (and reloads every texture) whenever `items` changes identity.
const galleryItems = [
  { image: fruitsNew, text: "Fruits" },
  { image: vegetablesNew, text: "Vegetables" },
  { image: flowersNew, text: "Flowers" },
  { image: nutsNew, text: "Nuts" },
  { image: spicesNew, text: "Spices" },
  { image: herbalNew, text: "Herbal" },
];

const Categories = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderForm, setOrderForm] = useState({ mobile: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    const handleGlobalOrder = (e) => {
      setSelectedProduct(e.detail?.productName || "General Enquiry");
      setIsOrderModalOpen(true);
    };
    window.addEventListener("open-order-modal", handleGlobalOrder);
    return () => window.removeEventListener("open-order-modal", handleGlobalOrder);
  }, []);

  const Data = [
    { img: fruitsNew, category: "Fruits" },
    { img: vegetablesNew, category: "Vegetables" },
    { img: flowersNew, category: "Flowers" },
    { img: nutsNew, category: "Nuts" },
    { img: spicesNew, category: "Spices" },
    { img: herbalNew, category: "Herbal" },
  ];

  const menuData = {
    Fruits: [
      "Banana", "Papaya", "Sapota", "Muskmelon", "Amla", "Pineapple", "Grape", "Pear", "Kiwi", "Apple", "Cherry", "Strawberry", "Cocoa", "Pomegranate", "Avocado", "Jackfruit", "Beri", "Mango", "Guava", "Watermelon", "Custard Apple", "Coconut", "Lychee Love", "Peach", "Passion Fruit Paradise", "Dragon Fruit Delight Plum", "Datesplam", "Fig",
    ],
    Vegetables: [
      "Beetroot", "Carrot", "Green Chilly", "Sweet Potato", "Cucumber", "Pumpkin", "Mint", "Tomato", "Garlic", "Corn",
    ],
    Flowers: ["Hibiscus", "Jasmine", "Sunflower Butter", "Rose"],
    Nuts: [
      "Almond", "Ground Nuts", "Fig", "Walnut", "Black Walnut", "Cashew Nut", "Pistachio", "Sesame",
    ],
    Spices: ["Cinnamon", "Cardamon", "Fennel"],
    Herbal: ["Aloe Vera", "Basil"],
  };

  const productImageMap = {
    // Fruits
    "Banana": BananaImg,
    "Papaya": PapayaImg,
    "Sapota": SapotaImg,
    "Muskmelon": MuskmelonImg,
    "Amla": AmlaImg,
    "Pineapple": PineappleImg,
    "Grape": GrapesImg,
    "Pear": PearImg,
    "Kiwi": KiwiImg,
    "Apple": AppleImg,
    "Cherry": CherryImg,
    "Strawberry": StrawberryImg,
    "Cocoa": CocoaImg,
    "Pomegranate": PomogranateImg,
    "Avocado": AvocadoImg,
    "Jackfruit": JackfruitImg,
    "Beri": BeriImg,
    "Mango": MangoImg,
    "Guava": GuavaImg,
    "Watermelon": WatermelonImg,
    "Custard Apple": CustardImg,
    "Coconut": CoconutImg,
    "Lychee Love": LycheeImg,
    "Peach": PeachImg,
    "Passion Fruit Paradise": PassionFruitImg,
    "Dragon Fruit Delight Plum": DragonFruitImg,
    "Datesplam": DatesplamImg,
    "Fig": FigImg,
    // Vegetables
    "Beetroot": BeetrootImg,
    "Carrot": CarrotImg,
    "Green Chilly": GreenChillyImg,
    "Sweet Potato": SweetPotatoImg,
    "Cucumber": CucumberImg,
    "Pumpkin": PumpkinImg,
    "Mint": MintImg,
    "Tomato": TomatoImg,
    "Garlic": GarlicImg,
    "Corn": CornImg,
    "Hibiscus": HibiscusImg,
    "Jasmine": JasmineImg,
    "Sunflower Butter": SunflowerImg,
    "Rose": RoseImg,
    "Almond": AlmondImg,
    "Ground Nuts": GroundnutsImg,
    "Walnut": WalnutImg,
    "Black Walnut": BlackWalnutImg,
    "Cashew Nut": CashewImg,
    "Pistachio": PistachioImg,
    "Sesame": SesameImg,
    "Cinnamon": CinnamonImg,
    "Cardamon": CardamonImg,
    "Fennel": FennelImg,
    "Aloe Vera": AloeVeraImg,
    "Basil": BasilImg,
  };

  const getEmoji = (item) => {
    const mapping = {
    };
    return mapping[item] || "🍃";
  };


  const openModal = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };
  
  const closeModal = () => setIsModalOpen(false);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(orderForm.mobile)) {
      setSubmitStatus({ type: "error", msg: "Please enter a valid 10-digit mobile number." });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const response = await fetch(`/api/order-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: selectedProduct,
          mobile: orderForm.mobile,
          message: orderForm.message
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSubmitStatus({ type: "success", msg: "Enquiry sent! We will contact you soon." });
        setTimeout(() => {
          setIsOrderModalOpen(false);
          setOrderForm({ mobile: "", message: "" });
          setSubmitStatus(null);
        }, 3000);
      } else {
        setSubmitStatus({ type: "error", msg: data.message });
      }
    } catch (err) {
      setSubmitStatus({ type: "error", msg: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openOrderModal = (productName, e) => {
    e.stopPropagation();
    setSelectedProduct(productName);
    setIsOrderModalOpen(true);
  };

  return (
    <section id="categories" className="relative py-24 sm:py-32 bg-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary-green/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-mango-orange/5 rounded-full blur-[120px] -z-10" />

      <Helmet>
        <title>Categories | Frutico - Fresh Fruits, Vegetables, Nuts & More</title>
        <meta
          name="description"
          content="Explore Frutico categories including Fruits, Vegetables, Flowers, Nuts, Spices, and Herbal selections."
        />
      </Helmet>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-20">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-green/10 text-primary-green text-sm font-bold tracking-wider uppercase mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-4 h-4" />
            Our Natural Bounty
          </motion.div>
          <motion.h2
            className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Explore Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-secondary-green font-berkshire font-normal">Natural</span> Selection
          </motion.h2>
          <motion.p
            className="text-gray-500 font-inter text-sm sm:text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex justify-center"
          >
            <Link to="/pure-joy">
              <button className="group relative px-8 py-4 bg-gray-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-primary-green/20 transition-all duration-300">
                <div className="relative z-10 flex items-center gap-3">
                  <span className="font-inter font-bold text-white text-xs tracking-[0.2em] uppercase">Experience Pure Joy 3D</span>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary-green transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-green/40 to-secondary-green/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Full Width Circular Gallery */}
      <motion.div 
        className="w-full h-[400px] sm:h-[500px] lg:h-[650px] relative bg-white/60 backdrop-blur-2xl border-y border-white/40 shadow-[inner_0_2px_20px_rgba(255,255,255,0.8)] my-8 sm:my-24 overflow-visible"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      >
        {/* Subtle decorative elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-green/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-green/20 to-transparent" />
        
        <CircularGallery items={galleryItems} bend={window?.innerWidth < 640 ? 1 : 3} textColor="#15803d" borderRadius={0.08} scrollEase={0.02} />
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 justify-items-center px-4 sm:px-0">
          {Data.map((curr, index) => (
            <motion.div
              key={index}
              className="cursor-pointer"
              onClick={() => openModal(curr.category)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card2 img={curr.img} category={curr.category} />
            </motion.div>
          ))}
        </div>

        {/* Bottom Decorative Marquee */}
        <div className="mt-32 pt-20 border-t border-gray-100">
           <p className="text-center font-outfit font-black text-gray-300 text-6xl sm:text-8xl lg:text-9xl opacity-20 select-none uppercase tracking-tighter">
             FRESH • ORGANIC • NATURAL • FRUTICO
           </p>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              className="relative bg-white/90 backdrop-blur-3xl rounded-[2.5rem] p-6 sm:p-12 w-full max-w-3xl shadow-[0_30px_70px_rgba(0,0,0,0.2)] border-2 border-white/60 ring-1 ring-primary-green/20 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-full hover:bg-black/5 bg-black/5 sm:bg-transparent transition-colors z-50 shadow-sm sm:shadow-none border border-black/5 sm:border-transparent"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary-green/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary-green" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-outfit font-black text-gray-900">
                      {selectedCategory}
                    </h3>
                    <p className="text-gray-500 font-inter">Explore our {selectedCategory.toLowerCase()} collection</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar py-4">
                  {menuData[selectedCategory]?.map((item, index) => (
                    <motion.div
                      key={index}
                      className="group relative h-[220px] sm:h-[280px] rounded-[2.5rem] bg-white/10 backdrop-blur-2xl border border-white/30 overflow-hidden cursor-pointer"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      {/* Product Full Image */}
                      <div className="absolute inset-0 z-0">
                        {productImageMap[item] ? (
                          <img 
                            src={productImageMap[item]} 
                            alt={`${item} - Frutico Natural Collection`} 
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-green/5 text-5xl">
                            {getEmoji(item)}
                          </div>
                        )}
                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Static subtle glassy overlay */}
                        <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                      </div>

                      {/* Floating Name & Order Button */}
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end p-5 pb-8">
                        <p className="font-outfit text-base sm:text-2xl font-black text-white text-center leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] mb-4">
                          {item}
                        </p>
                        
                        <motion.button
                          onClick={(e) => openOrderModal(item, e)}
                          className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 px-6 py-2 bg-white text-primary-green font-inter font-black text-sm rounded-full shadow-xl hover:bg-primary-green hover:text-white flex items-center gap-2"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Order Now
                        </motion.button>
                      </div>

                      {/* Water Shine Effect */}
                      <motion.div
                        className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-45 pointer-events-none"
                        animate={{ translateX: ["-100%", "100%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
                      />
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  onClick={closeModal}
                  className="mt-10 w-full py-4 bg-primary-green text-white font-inter font-bold rounded-2xl hover:bg-secondary-green transition-all duration-300 shadow-lg shadow-green-500/20"
                >
                  Close Categories
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Enquiry Modal */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => !isSubmitting && setIsOrderModalOpen(false)}
            />
            <motion.div
              className="relative bg-white rounded-[2.5rem] p-8 sm:p-10 w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-green to-secondary-green" />
              
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-primary-green" />
                </div>
                <h3 className="text-2xl font-outfit font-black text-gray-900 mb-2">
                  {selectedProduct === "General Enquiry" ? "Quick Enquiry" : `Order ${selectedProduct}`}
                </h3>
                <p className="text-gray-500 font-inter text-sm">Send an enquiry and we'll get back to you shortly.</p>
              </div>

              <form onSubmit={handleOrderSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="font-inter text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Enter 10-digit number"
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-all font-inter"
                      value={orderForm.mobile}
                      onChange={(e) => setOrderForm({ ...orderForm, mobile: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-inter text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Special Message (Optional)</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <textarea
                      placeholder="Any specific requirement?"
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-all font-inter h-32 resize-none"
                      value={orderForm.message}
                      onChange={(e) => setOrderForm({ ...orderForm, message: e.target.value })}
                    />
                  </div>
                </div>

                {submitStatus && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-sm font-inter font-bold text-center ${submitStatus.type === "success" ? "text-primary-green" : "text-red-500"}`}
                  >
                    {submitStatus.msg}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-primary-green text-white font-inter font-black rounded-2xl hover:bg-secondary-green transition-all duration-300 shadow-lg shadow-green-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {isSubmitting ? "Sending..." : "Submit Enquiry"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Categories;
