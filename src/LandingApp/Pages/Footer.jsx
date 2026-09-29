import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import logo from "../images/logo.webp";
import qrCode from "../images/QR.webp";

const Instagram = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact-us" className="relative bg-gray-900 text-white pt-24 pb-12 overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-green/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-green/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand Column */}
          <div className="space-y-8">
            <motion.img
              src={logo}
              alt="Frutico Logo"
              className="h-16 w-auto brightness-0 invert"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            />
            <p className="text-gray-400 font-inter leading-relaxed">
              Bringing nature's purest gifts to your table since 2007. 100% natural fruit ice creams and organic dairy products.
            </p>
            <div className="flex items-center gap-4">
              <motion.a
                href="https://www.instagram.com/ifrutico?utm_source=qr&igsh=OHU4bWx5eWtlOTJ5"
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-primary-green hover:scale-110 transition-all duration-300 border border-white/10 shadow-lg"
                whileHover={{ y: -5 }}
              >
                <Instagram className="w-7 h-7" />
              </motion.a>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-primary-green mb-1">Follow Us</span>
                <span className="text-gray-500 text-[10px] font-medium font-inter">@ifrutico</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-outfit font-black text-xl mb-8 uppercase tracking-widest text-primary-green">Explore</h4>
            <ul className="space-y-4">
              {["Favorites", "Categories", "Testimonials", "About Us", "Dealership"].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase().replace(" ", "-")}`}
                    className="text-gray-400 hover:text-white hover:translate-x-2 transition-all duration-300 flex items-center gap-2 group font-inter"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-green opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-outfit font-black text-xl mb-8 uppercase tracking-widest text-primary-green">Our Range</h4>
            <ul className="space-y-4">
              {["Natural Ice Creams", "Fresh Fruit Pulps", "Organic Dairy", "Traditional Flavors", "Healthy Snacks"].map((item) => (
                <li key={item} className="text-gray-400 font-inter flex items-center gap-2">
                  <ExternalLink className="w-3 h-3 text-gray-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-outfit font-black text-xl mb-8 uppercase tracking-widest text-primary-green">Contact</h4>
            <div className="space-y-6">
              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary-green transition-colors">
                  <MapPin className="w-5 h-5" />
                </div>
                <p className="text-gray-400 text-sm font-inter leading-relaxed">
                  1/173 Vadugar Street, Karikali<br />
                  Musiri, Tamil Nadu - 621210
                </p>
              </div>
              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary-green transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="text-gray-400 text-sm font-inter">
                  <p>+91 88703 70349</p>
                  <p>+91 88703 70354</p>
                  <p>+91 8508054616</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary-green transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <a href="mailto:enquiries@ifrutico.com" className="text-gray-400 text-sm font-inter hover:text-white transition-colors">
                  enquiries@ifrutico.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-sm font-inter">
            © {currentYear} <span className="text-white font-bold">Frutico</span>. All rights reserved. Crafted with ❤️ for Nature.
          </p>
          <div className="flex gap-8 text-gray-500 text-sm font-inter">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
