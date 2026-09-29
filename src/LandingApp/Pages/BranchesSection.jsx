import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, MapPin, Sparkles, ExternalLink, Navigation2, ArrowUpRight } from "lucide-react";
import BorderGlow from "../Components/BorderGlow";

const BRANCHES = [
  {
    id: 0,
    name: "Annanagar Ulavar Sandhai",
    region: "Trichy, Tamil Nadu",
    tagline: "Sourced from regulated local markets",
    mapLink: "https://maps.app.goo.gl/DGArAJELjnvbCRKY8",
    embedUrl: "https://maps.google.com/maps?q=Annanagar+Ulavar+Sandhai+Trichy+Tamil+Nadu&output=embed&z=16",
    icon: "🌾",
    accent: "#22c55e",
    badge: "bg-lemerald-500/15 text-lemerald-300 border-lemerald-500/20",
    glow: "#22c55e",
  },
  {
    id: 1,
    name: "Palakarai Market",
    region: "Committee Regulated Market, Trichy",
    tagline: "Sourced from regulated local markets",
    mapLink: "https://maps.app.goo.gl/r4kXZ94JGiNaJdLo6",
    embedUrl: "https://maps.google.com/maps?q=Palakarai+Market+Trichy+Tamil+Nadu&output=embed&z=16",
    icon: "🏪",
    accent: "#f59e0b",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/20",
    glow: "#f59e0b",
  },
  {
    id: 2,
    name: "Kulithalai Ulavar Sandhai",
    region: "Karur District, Tamil Nadu",
    tagline: "Direct farm sourcing with natural quality",
    mapLink: "https://maps.app.goo.gl/1swoGdmhDYcSdE8T9",
    embedUrl: "https://maps.google.com/maps?q=Kulithalai+Ulavar+Sandhai+Karur+Tamil+Nadu&output=embed&z=16",
    icon: "🌿",
    accent: "#14b8a6",
    badge: "bg-lteal-500/15 text-lteal-300 border-lteal-500/20",
    glow: "#14b8a6",
  },
  {
    id: 3,
    name: "Avalanche – Ooty",
    region: "The Nilgiris, Tamil Nadu",
    tagline: "Premium produce from high-altitude hills",
    mapLink: "https://maps.app.goo.gl/j7ojXbf8vjiynwFu6",
    embedUrl: "https://maps.google.com/maps?q=Avalanche+Ooty+Nilgiris+Tamil+Nadu&output=embed&z=15",
    icon: "🏔️",
    accent: "#818cf8",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
    glow: "#818cf8",
    mist: true,
  },
];

const MistLayer = ({ delay }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{
      inset: 0,
      background:
        "linear-gradient(to right, transparent, rgba(186,230,253,0.08) 40%, rgba(186,230,253,0.15) 50%, rgba(186,230,253,0.08) 60%, transparent)",
      top: `${25 + delay * 18}%`,
      height: "20%",
    }}
    animate={{ x: ["-30%", "30%", "-30%"] }}
    transition={{ duration: 8 + delay * 2, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

const BranchesSection = () => {
  const [activeId, setActiveId] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);

  const active = BRANCHES[activeId];

  return (
    <section id="branches" className="relative py-24 sm:py-32 bg-gray-950 overflow-hidden">
      {/* Ambient orbs */}
      <motion.div
        className="absolute top-0 left-0 w-[700px] h-[700px] rounded-full blur-[200px]"
        style={{ backgroundColor: `${active.glow}12` }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[160px]"
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-primary-green/15 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2.5 mb-8"
            whileHover={{ scale: 1.04 }}
          >
            <Sparkles className="w-4 h-4 text-primary-green animate-pulse" />
            <span className="text-white font-inter text-xs font-black tracking-[0.3em] uppercase">
              Sourcing Network
            </span>
          </motion.div>

          <h2 className="font-outfit text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-5 tracking-tighter">
            Our Sourcing{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green via-yellow-400 to-secondary-green font-berkshire font-normal">
              Locations
            </span>
          </h2>
          <p className="text-white/50 font-inter text-lg max-w-2xl mx-auto leading-relaxed">
            Fresh produce sourced directly from trusted markets and hill regions across Tamil Nadu.
          </p>
        </motion.div>

        {/* ── Main Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-8 lg:gap-12 items-start">

          {/* ── LEFT: Branch Cards ── */}
          <div className="flex flex-col gap-4 order-2 lg:order-1">
            {BRANCHES.map((branch, index) => {
              const isActive = activeId === branch.id;
              return (
                <motion.button
                  key={branch.id}
                  onClick={() => { setActiveId(branch.id); setMapLoaded(false); }}
                  className={`text-left relative rounded-3xl border backdrop-blur-xl overflow-hidden transition-all duration-500 group ${
                    isActive
                      ? "border-white shadow-[0_20px_50px_rgba(255,255,255,0.15)] bg-white/90"
                      : "border-white/60 hover:border-white/80 bg-white/50 hover:bg-white/70"
                  }`}
                  style={
                    isActive
                      ? { boxShadow: `0 20px 60px ${branch.accent}30` }
                      : {}
                  }
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={!isActive ? { x: 4 } : {}}
                >
                  {/* Active left bar */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-full"
                        style={{ backgroundColor: branch.accent }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        exit={{ scaleY: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Glow orb */}
                  <motion.div
                    className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-3xl pointer-events-none"
                    style={{ backgroundColor: branch.accent }}
                    animate={{ opacity: isActive ? 0.18 : 0.06 }}
                    transition={{ duration: 0.5 }}
                  />

                  {/* Mist for Ooty */}
                  {branch.mist && isActive && (
                    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                      <MistLayer delay={0} />
                      <MistLayer delay={2} />
                    </div>
                  )}

                  <div className="relative z-10 p-6 flex items-center gap-5">
                    {/* Icon */}
                    <motion.div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-500 bg-white/80 shadow-sm backdrop-blur-md"
                      style={{
                        border: `1px solid ${isActive ? `${branch.accent}40` : "rgba(0,0,0,0.05)"}`,
                      }}
                      animate={isActive ? { rotate: [0, 5, -5, 0] } : { rotate: 0 }}
                      transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                    >
                      {branch.icon}
                    </motion.div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`font-outfit font-black text-base leading-tight transition-colors duration-300 ${isActive ? "text-gray-900" : "text-gray-700"}`}>
                          {branch.name}
                        </h3>
                        {isActive && (
                          <motion.span
                            className={`text-[10px] font-black tracking-[0.2em] uppercase px-2 py-0.5 rounded-full border ${branch.badge}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                          >
                            Live
                          </motion.span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: branch.accent }} />
                        <span className="text-gray-600 font-inter text-xs truncate">{branch.region}</span>
                      </div>
                      <p className={`font-inter text-xs italic leading-relaxed transition-all duration-300 ${isActive ? "text-gray-500" : "text-gray-500"}`}>
                        "{branch.tagline}"
                      </p>
                    </div>

                    {/* Arrow */}
                    <motion.div
                      animate={isActive ? { x: 3, opacity: 1 } : { x: 0, opacity: 0.3 }}
                      style={{ color: branch.accent }}
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </motion.div>
                  </div>
                </motion.button>
              );
            })}

            {/* "Open in Google Maps" link */}
            <motion.a
              href={active.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border border-white/10 text-white/50 font-inter text-sm font-semibold hover:border-primary-green/50 hover:text-primary-green transition-all duration-300 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Navigation2 className="w-4 h-4 group-hover:text-primary-green transition-colors" />
              Open {active.name} in Google Maps
              <ExternalLink className="w-3.5 h-3.5 opacity-50 ml-auto" />
            </motion.a>
          </div>

          {/* ── RIGHT: Real Google Maps Embed ── */}
          <motion.div
            className="relative order-1 lg:order-2 lg:sticky lg:top-28"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Multi-layered glow border */}
            <motion.div
              className="absolute -inset-[2px] rounded-[2.5rem] blur-sm opacity-50"
              style={{ background: `linear-gradient(135deg, ${active.accent}60, transparent, ${active.accent}30)` }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            <BorderGlow
              className="relative w-full h-full backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
              backgroundColor="rgba(255,255,255,0.6)"
              borderRadius={40}
            >
              <div className="relative rounded-[2.5rem] overflow-hidden w-full h-full flex flex-col z-10">
              {/* Map header bar */}
              <div className="flex items-center justify-between px-6 py-4 bg-white/80 border-b border-white/60 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: active.accent }}
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div>
                    <p className="text-gray-900 font-outfit font-black text-sm">{active.name}</p>
                    <p className="text-gray-500 font-inter text-xs">{active.region}</p>
                  </div>
                </div>
                <a
                  href={active.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300"
                  style={{
                    color: active.accent,
                    borderColor: `${active.accent}30`,
                    backgroundColor: `${active.accent}10`,
                  }}
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Maps
                </a>
              </div>

              {/* Map iframe */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId}
                  className="relative w-full"
                  style={{ paddingBottom: "65%" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Loading skeleton */}
                  {!mapLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 backdrop-blur-sm gap-4 z-10">
                      <motion.div
                        className="w-10 h-10 rounded-full border-2 border-t-transparent"
                        style={{ borderColor: `${active.accent}40`, borderTopColor: active.accent }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <p className="text-gray-500 font-inter text-xs font-medium">Loading map…</p>
                    </div>
                  )}

                  <iframe
                    title={`Map of ${active.name}`}
                    src={active.embedUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    onLoad={() => setMapLoaded(true)}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Bottom bar */}
              <div className="px-6 py-4 bg-white/80 border-t border-white/60 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Leaf className="w-3.5 h-3.5 text-primary-green" />
                  <span className="text-gray-500 font-inter text-xs font-medium">Sourcing Partner Location</span>
                </div>
                <div className="flex items-center gap-1">
                  {BRANCHES.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => { setActiveId(b.id); setMapLoaded(false); }}
                      className="w-2 h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: activeId === b.id ? b.accent : "rgba(0,0,0,0.1)",
                        width: activeId === b.id ? "20px" : "8px",
                      }}
                    />
                  ))}
                </div>
              </div>
              </div>
            </BorderGlow>
          </motion.div>

        </div>

        {/* Bottom note */}
        <motion.p
          className="mt-16 text-center text-white/25 font-inter text-xs tracking-widest uppercase"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          🌱 Every ingredient traceable · Every scoop trustworthy
        </motion.p>

      </div>
    </section>
  );
};

export default BranchesSection;
