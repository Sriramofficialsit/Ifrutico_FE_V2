import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import logo1 from "../images/logo.webp";

const Nav = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navItems = [
    "Favorites",
    "Categories",
    "About Us",
    "Dealership",
    "Contact us",
  ];

  const handleOrderNow = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("open-order-modal", { 
      detail: { productName: "General Enquiry" } 
    }));
  };

  return (
    <>
      {/* Main Navigation Wrapper */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "py-2" : "py-4 sm:py-6"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className={`mx-auto max-w-7xl px-4 sm:px-6 md:px-8 transition-all duration-500`}>
          <div 
            className={`flex items-center justify-between transition-all duration-500 rounded-full px-6 py-3
              ${scrolled ? "bg-glass-white backdrop-blur-md border border-glass-border shadow-glass" : "bg-transparent"}`}
          >
            {/* Left Section (Logo + Menu Button) */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Toggle */}
              <div className="block lg:hidden">
                <motion.button
                  onClick={toggleSidebar}
                  className="focus:outline-none text-primary-green p-2 rounded-full hover:bg-white/20 transition-colors"
                  aria-label={
                    isSidebarOpen
                      ? "Close navigation menu"
                      : "Open navigation menu"
                  }
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Logo */}
              <motion.a
                href="/"
                aria-label="Frutico Home"
                className="flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src={logo1}
                  alt="Frutico Logo"
                  className={`transition-all duration-300 ${scrolled ? "h-10" : "h-12 sm:h-14"}`}
                  loading="eager"
                />
              </motion.a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navItems.map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="relative text-gray-800 font-inter font-medium text-sm xl:text-base group"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  aria-label={`Navigate to ${item}`}
                >
                  <span className="relative z-10 group-hover:text-primary-green transition-colors">{item}</span>
                  <span className="absolute left-0 bottom-[-4px] w-0 h-0.5 bg-primary-green transition-all duration-300 group-hover:w-full rounded-full"></span>
                </motion.a>
              ))}
              
              <motion.a
                href="#"
                onClick={handleOrderNow}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="ml-4 px-6 py-2.5 bg-primary-green text-white font-inter font-semibold rounded-full hover:bg-secondary-green hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Order Now
              </motion.a>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Menu */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            id="mobile-menu"
            className="fixed inset-y-0 left-0 w-[80%] max-w-[320px] bg-cream/90 backdrop-blur-xl border-r border-glass-border shadow-2xl z-[60] lg:hidden flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex justify-between items-center p-6 border-b border-primary-green/10">
              <img
                src={logo1}
                alt="Frutico Logo"
                className="h-10"
              />
              <motion.button
                onClick={toggleSidebar}
                className="focus:outline-none p-2 rounded-full bg-white/50 text-primary-green hover:bg-white transition-colors"
                aria-label="Close menu"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            <div className="flex flex-col gap-2 p-6 overflow-y-auto flex-1">
              {navItems.map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-gray-800 font-inter font-medium text-lg py-4 border-b border-primary-green/10 hover:text-primary-green hover:pl-4 transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={toggleSidebar}
                >
                  {item}
                </motion.a>
              ))}
              
              <motion.a
                href="#"
                onClick={(e) => {
                  toggleSidebar();
                  handleOrderNow(e);
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="mt-8 px-6 py-4 bg-primary-green text-center text-white font-inter font-semibold rounded-2xl hover:bg-secondary-green transition-all duration-300 shadow-md"
              >
                Order Now
              </motion.a>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Background Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Nav;
