import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, Loader2, User, UserCheck, MessageSquare, X } from "lucide-react";

// Same-origin like the rest of the app (nginx maps /api/* to the backend); VITE_API_URL only overrides it
const API = `${import.meta.env.VITE_API_URL || ""}/api/testimonials`;

const FeedbackForm = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({ name: "", content: "", rating: 5, gender: "male" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type, msg }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: "success", msg: "Feedback submitted! It will appear after approval." });
        setTimeout(() => {
          onClose();
          setForm({ name: "", content: "", rating: 5, gender: "male" });
          setStatus(null);
        }, 3000);
      } else {
        setStatus({ type: "error", msg: data.message });
      }
    } catch (err) {
      setStatus({ type: "error", msg: "Failed to send feedback. Try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => !isSubmitting && onClose()}
          />
          <motion.div
            className="relative bg-white rounded-[2.5rem] p-8 sm:p-10 w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-green to-secondary-green" />
            
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary-green" />
              </div>
              <h3 className="text-2xl font-outfit font-black text-gray-900 mb-2">Share Your Experience</h3>
              <p className="text-gray-500 font-inter text-sm">We value your feedback to make Frutico even better.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="font-inter text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Your Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-green/20 transition-all font-inter"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Rating & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-inter text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Rating</label>
                  <div className="flex gap-1 py-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 cursor-pointer transition-colors ${star <= form.rating ? "text-mango-orange fill-mango-orange" : "text-gray-200"}`}
                        onClick={() => setForm({ ...form, rating: star })}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="font-inter text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                  <div className="flex bg-gray-50 rounded-2xl p-1 border border-gray-100">
                    {["male", "female"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm({ ...form, gender: g })}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all capitalize ${form.gender === g ? "bg-white text-primary-green shadow-sm" : "text-gray-400"}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="font-inter text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Your Feedback</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <textarea
                    required
                    placeholder="Tell us what you think..."
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-green/20 transition-all font-inter h-32 resize-none"
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                </div>
              </div>

              {status && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm font-inter font-bold text-center ${status.type === "success" ? "text-primary-green" : "text-red-500"}`}
                >
                  {status.msg}
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
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackForm;
