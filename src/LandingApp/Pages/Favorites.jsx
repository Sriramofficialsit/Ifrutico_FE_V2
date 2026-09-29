import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import {
  Download, ChevronRight, X, Apple, LeafyGreen, Flower2,
  Nut, Flame, Sprout, Phone, CheckCircle, Loader2, BookOpen
} from "lucide-react";
import Card1 from "../Components/Card1";

import CoffeeImg from "../images/top/coffe.webp";
import CustardImg from "../images/top/custedapple.webp";
import SapotaImg from "../images/top/sapota.webp";

const Favorites = () => {
  const Data = [
    {
      name: "Sapota Delight",
      des: "Experience the unique, malty sweetness of farm-fresh Sapota blended into perfection.",
      ratings: 4.8,
      ratingCount: 156,
      img: SapotaImg,
      price: 120,
      currency: "INR",
      availability: "https://schema.org/InStock",
    },
    {
      name: "Creamy Custard Apple",
      des: "Made with handpicked Kolli Hills custard apples and farm-fresh cream.",
      ratings: 4.9,
      ratingCount: 92,
      img: CustardImg,
      price: 150,
      currency: "INR",
      availability: "https://schema.org/InStock",
    },
    {
      name: "Premium Coffee",
      des: "Rich Arabica bean infusion for the ultimate coffee lover's delight.",
      ratings: 4.7,
      ratingCount: 114,
      img: CoffeeImg,
      price: 150,
      currency: "INR",
      availability: "https://schema.org/InStock",
    },
  ];

  // "Explore Full Menu" modal state
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

  // Download lead modal state
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("idle"); // idle | loading | success | error

  const openDownloadModal = () => {
    setMobile("");
    setMobileError("");
    setDownloadStatus("idle");
    setIsDownloadModalOpen(true);
  };

  const validateMobile = (val) => /^[0-9]{10}$/.test(val);

  const handleDownload = async () => {
    if (!validateMobile(mobile)) {
      setMobileError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setMobileError("");
    setDownloadStatus("loading");

    try {
      const res = await fetch("/api/menu-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setDownloadStatus("success");

      // Trigger PDF download after short success display
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = "/src/LandingApp/images/ifrutico_menu.pdf";
        link.download = "Frutico_Menu.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          setIsDownloadModalOpen(false);
          setDownloadStatus("idle");
        }, 1200);
      }, 800);
    } catch (err) {
      setDownloadStatus("error");
      setMobileError("Something went wrong. Please try again.");
      setDownloadStatus("idle");
    }
  };

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "ItemList",
    name: "Frutico Favorites",
    description: "Explore Frutico's signature flavors, crafted with passion and natural ingredients.",
    itemListElement: Data.map((item, i) => ({
      "@type": "Product",
      position: i + 1,
      name: item.name,
      image: item.img,
      description: item.des,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: item.ratings,
        ratingCount: item.ratingCount,
        bestRating: 5,
        worstRating: 1,
      },
      offers: {
        "@type": "Offer",
        priceCurrency: item.currency,
        price: item.price,
        availability: item.availability,
        url: "https://www.ifrutico.com/favorites",
      },
    })),
  };

  const categories = [
    { title: "Fruits", desc: "Nature's candy transformed into smooth, refreshing scoops.", icon: Apple, color: "text-red-500", glow: "hover:shadow-red-200/50", bg: "bg-red-50/50", border: "hover:border-red-200" },
    { title: "Vegetables", desc: "Discover the surprisingly sweet side of garden-fresh goodness.", icon: LeafyGreen, color: "text-green-500", glow: "hover:shadow-green-200/50", bg: "bg-green-50/50", border: "hover:border-green-200" },
    { title: "Flowers", desc: "Delicate and aromatic floral infusions for a sophisticated palate.", icon: Flower2, color: "text-pink-500", glow: "hover:shadow-pink-200/50", bg: "bg-pink-50/50", border: "hover:border-pink-200" },
    { title: "Nuts", desc: "Premium roasted nuts folded into rich, creamy textures.", icon: Nut, color: "text-amber-600", glow: "hover:shadow-amber-200/50", bg: "bg-amber-50/50", border: "hover:border-amber-200" },
    { title: "Spices", desc: "Bold and exotic spice blends that create a unique tasting journey.", icon: Flame, color: "text-orange-500", glow: "hover:shadow-orange-200/50", bg: "bg-orange-50/50", border: "hover:border-orange-200" },
    { title: "Herbal", desc: "Refreshing herbal extracts for a natural and healthy indulgence.", icon: Sprout, color: "text-lemerald-500", glow: "hover:shadow-lemerald-200/50", bg: "bg-lemerald-50/50", border: "hover:border-lemerald-200" },
  ];

  return (
    <section id="favorites" className="relative py-24 sm:py-32 bg-white overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-secondary-green/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-mango-orange/5 rounded-full blur-[80px]" />

      <Helmet>
        <title>Favorites | Frutico - Our Signature Flavors</title>
        <meta name="description" content="Explore Frutico's classic favorites. Fresh, natural, and delicious ice creams." />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.span
            className="text-primary-green font-inter font-bold tracking-widest uppercase text-sm block mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Taste the Best
          </motion.span>
          <motion.h2
            className="font-outfit text-4xl sm:text-5xl font-black text-gray-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-secondary-green font-berkshire font-normal">Classic</span> Favorites
          </motion.h2>
          <motion.p
            className="text-gray-600 font-inter text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Discover the flavors that made us famous. Each scoop is a masterpiece of natural ingredients and traditional craftsmanship.
          </motion.p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
          {Data.map((curr, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card1
                name={curr.name}
                des={curr.des}
                ratings={curr.ratings}
                img={curr.img}
                price={curr.price}
              />
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <motion.div
          className="mt-16 sm:mt-20 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          {/* Explore Full Menu */}
          <button
            onClick={() => setIsMenuModalOpen(true)}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-full font-inter font-bold hover:bg-primary-green transition-all duration-300 shadow-xl"
          >
            <BookOpen className="w-5 h-5" />
            Explore Full Menu
          </button>

          {/* Download Our Menu */}
          <button
            onClick={openDownloadModal}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-green to-secondary-green text-white rounded-full font-inter font-bold hover:shadow-xl hover:shadow-primary-green/30 transition-all duration-300"
          >
            <Download className="w-5 h-5 group-hover:animate-bounce" />
            Download Our Menu
          </button>
        </motion.div>
      </div>

      {/* ────────────────────────────────────────────── */}
      {/* DOWNLOAD LEAD MODAL                           */}
      {/* ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isDownloadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => downloadStatus !== "loading" && setIsDownloadModalOpen(false)}
            />
            <motion.div
              className="relative bg-white/90 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-2xl border-2 border-white/60 ring-1 ring-primary-green/20"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              {/* Glow blobs */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary-green/20 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary-green/20 rounded-full blur-[50px] -ml-16 -mb-16 pointer-events-none" />

              {downloadStatus !== "loading" && (
                <button
                  onClick={() => setIsDownloadModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-20"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}

              <div className="relative z-10 text-center">
                <AnimatePresence mode="wait">
                  {downloadStatus === "success" ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-4 py-6"
                    >
                      <CheckCircle className="w-16 h-16 text-primary-green" />
                      <h3 className="text-2xl font-outfit font-black text-gray-900">Starting Download!</h3>
                      <p className="text-gray-500 font-inter">Your Frutico menu is downloading…</p>
                    </motion.div>
                  ) : (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {/* Icon */}
                      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary-green to-secondary-green flex items-center justify-center shadow-lg shadow-primary-green/25">
                        <Download className="w-8 h-8 text-white" />
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-outfit font-black text-gray-900 mb-2">
                        Download Our <span className="text-primary-green font-berkshire font-normal">Menu</span>
                      </h3>
                      <p className="text-gray-500 font-inter text-sm mb-8">
                        Enter your mobile number to get our full menu PDF instantly.
                      </p>

                      {/* Phone input */}
                      <div className="relative mb-2">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400 pointer-events-none">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm font-medium text-gray-500">+91</span>
                        </div>
                        <input
                          type="tel"
                          maxLength={10}
                          value={mobile}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setMobile(val);
                            if (mobileError) setMobileError("");
                          }}
                          onKeyDown={(e) => e.key === "Enter" && handleDownload()}
                          placeholder="98765 43210"
                          className={`w-full pl-24 pr-4 py-4 rounded-2xl border-2 font-inter text-gray-900 bg-gray-50/80 outline-none transition-all duration-200
                            ${mobileError
                              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                              : "border-gray-200 focus:border-primary-green focus:ring-2 focus:ring-primary-green/10"
                            }`}
                        />
                      </div>
                      {mobileError && (
                        <p className="text-red-500 text-sm font-inter text-left mb-4">{mobileError}</p>
                      )}

                      <motion.button
                        onClick={handleDownload}
                        disabled={downloadStatus === "loading"}
                        className="mt-6 w-full py-4 bg-gradient-to-r from-primary-green to-secondary-green text-white font-inter font-bold rounded-2xl hover:shadow-lg hover:shadow-primary-green/30 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        {downloadStatus === "loading" ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing…
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                            Download Menu PDF
                          </>
                        )}
                      </motion.button>

                      <p className="mt-4 text-xs text-gray-400 font-inter">
                        🔒 Your number is safe with us. No spam, ever.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────── */}
      {/* EXPLORE MENU CATEGORIES MODAL                 */}
      {/* ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setIsMenuModalOpen(false)}
            />
            <motion.div
              className="relative bg-white/80 backdrop-blur-2xl rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-12 w-full max-w-2xl max-h-[90vh] shadow-[0_30px_70px_rgba(0,0,0,0.15)] flex flex-col border-2 border-white/60 ring-1 ring-primary-green/20"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              {/* Animated border shine */}
              <div className="absolute inset-0 rounded-3xl sm:rounded-[2.5rem] overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute inset-[-100%] bg-gradient-to-tr from-transparent via-white/40 to-transparent rotate-45"
                  animate={{ translateX: ["100%", "-100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 5 }}
                />
              </div>

              {/* Glow blobs */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-green/30 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-green/30 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/40 hover:bg-white/60 transition-all z-20 backdrop-blur-md border border-white/60 shadow-sm"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
              </button>

              <div className="relative z-10 overflow-y-auto custom-scrollbar pr-1">
                <div className="text-center mb-8 sm:mb-12">
                  <motion.h3
                    className="text-2xl sm:text-4xl font-outfit font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary-green to-gray-900"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    Explore Our <span className="text-primary-green font-berkshire font-normal">Natural</span> Selection
                  </motion.h3>
                  <p className="text-sm sm:text-base text-gray-500 font-inter font-medium">Discover the pure essence of nature in every category</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {categories.map((category, index) => (
                    <motion.div
                      key={index}
                      className={`group relative flex flex-col p-6 rounded-3xl bg-white/50 backdrop-blur-md border-2 border-white/80 transition-all duration-500 cursor-pointer shadow-sm ${category.glow} ${category.border} hover:bg-white/90 hover:shadow-2xl`}
                      whileHover={{ y: -6, scale: 1.02 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${category.bg} ${category.color} transition-all duration-300 group-hover:scale-110 group-hover:bg-primary-green group-hover:text-white shadow-inner`}>
                          <category.icon className="w-6 h-6" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-gray-100">
                          <ChevronRight className="w-4 h-4 text-primary-green" />
                        </div>
                      </div>
                      <h4 className="font-inter font-bold text-lg text-gray-900 mb-2 group-hover:text-primary-green transition-colors">
                        {category.title}
                      </h4>
                      <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-600">
                        {category.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Favorites;
