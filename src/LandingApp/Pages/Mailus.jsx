import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MapPin, Mail, Phone, MessageSquare, Sparkles } from "lucide-react";
import deal from "../images/dealer.webp?v=2";

const Mailus = () => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    email: "",
    contact: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState(""); // Bot protection

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Basic sanitization: prevent very long inputs
    if (value.length > 200) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (honeypot) return; // Silent fail for bots

    const { name, location, email, contact } = formData;

    // Validation
    if (name.trim().length < 2) {
      setErrorMessage("Please enter a valid name.");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!/^[0-9]{10}$/.test(contact)) {
      setErrorMessage("Please enter a valid 10-digit phone number.");
      return;
    }

    if (location.trim().length < 3) {
      setErrorMessage("Please enter a valid location.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/dealership-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, email, contact }),
      });
      const data = await response.json();
      
      if (data.success) {
        setFormData({ name: "", location: "", email: "", contact: "" });
        setSuccessMessage("Enquiry sent successfully! Our team will contact you soon.");
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setErrorMessage(data.message || "Something went wrong.");
      }
    } catch (err) {
      setErrorMessage("Failed to send enquiry. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="dealership" className="relative py-24 sm:py-32 bg-hero-gradient overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary-green/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-mango-orange/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-green/10 text-primary-green text-sm font-bold tracking-wider uppercase mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-4 h-4" />
            Partnership
          </motion.div>
          <motion.h2
            className="font-outfit text-4xl sm:text-5xl font-black text-gray-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Grow Your Business with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-secondary-green font-berkshire font-normal">Frutico</span>
          </motion.h2>
          <motion.p
            className="text-gray-600 font-inter text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Join our network of successful dealers across South India and bring the magic of 100% natural fruit ice creams to your community.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Info Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative mb-12 group">
              <div className="absolute inset-0 bg-primary-green/10 rounded-[2.5rem] rotate-3 -z-10" />
              <img
                src={deal}
                alt="Frutico Dealership"
                className="w-full h-auto object-cover rounded-[2.5rem] shadow-2xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { icon: <MapPin className="w-6 h-6" />, title: "Location", detail: "Musiri, Tamil Nadu" },
                { icon: <Mail className="w-6 h-6" />, title: "Email Us", detail: "enquiries@ifrutico.com" },
                { icon: <Phone className="w-6 h-6" />, title: "Call Support", detail: "+91 88703 70349" },
                { icon: <MessageSquare className="w-6 h-6" />, title: "WhatsApp", detail: "+91  85080 54616" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center text-primary-green">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-outfit font-bold text-gray-900">{item.title}</h4>
                    <p className="font-inter text-gray-500 text-sm">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Form Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white/70 backdrop-blur-xl border border-glass-border p-8 sm:p-12 rounded-[3rem] shadow-glass">
              <h3 className="font-outfit text-2xl font-black text-gray-900 mb-8">Send an Enquiry</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Honeypot field - hidden from users but visible to bots */}
                <div className="hidden" aria-hidden="true">
                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex="-1"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-inter text-sm font-bold text-gray-700 ml-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Gopi"
                    required
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-all font-inter"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-inter text-sm font-bold text-gray-700 ml-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="City, State"
                      required
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-all font-inter"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-inter text-sm font-bold text-gray-700 ml-1">Contact No</label>
                    <input
                      type="tel"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      placeholder="10-digit number"
                      required
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-all font-inter"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-inter text-sm font-bold text-gray-700 ml-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="gopi@example.com"
                    required
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-green/20 focus:border-primary-green transition-all font-inter"
                  />
                </div>

                <AnimatePresence>
                  {errorMessage && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-sm font-inter font-medium ml-1"
                    >
                      {errorMessage}
                    </motion.p>
                  )}
                  {successMessage && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-primary-green text-sm font-inter font-medium ml-1"
                    >
                      {successMessage}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-5 text-white font-inter font-black rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 group ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-primary-green hover:bg-secondary-green shadow-green-500/20"
                    }`}
                  whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                >
                  <Send className={`w-5 h-5 transition-transform ${!isSubmitting && "group-hover:translate-x-1 group-hover:-translate-y-1"}`} />
                  {isSubmitting ? "Processing..." : "Connect on WhatsApp"}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Mailus;
