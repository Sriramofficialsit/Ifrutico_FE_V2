import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import introVideo from "../images/intro.mp4";
import { Sparkles, Volume2, VolumeX, ArrowDown } from "lucide-react";

const IntroVideoHero = () => {
  const videoRef = useRef(null);
  const videoRefDesktop = useRef(null);
  const containerRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);

  // Only mount ONE <video>; rendering both (hidden via CSS) made the browser download/decode the clip twice
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 640px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const { scrollY } = useScroll();
  const videoScale = useTransform(scrollY, [0, 600], [1, 1.1]);
  const contentY = useTransform(scrollY, [0, 500], [0, -50]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  const toggleMute = () => {
    [videoRef, videoRefDesktop].forEach((ref) => {
      if (ref.current) ref.current.muted = !isMuted;
    });
    setIsMuted(!isMuted);
  };

  const textVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <>
      {/* MOBILE */}
      {!isDesktop && (
      <section className="relative w-full block sm:hidden bg-gray-950 overflow-hidden">
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: "56.25%" }}>
          <video
            ref={videoRef}
            src={introVideo}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
          <div className="absolute inset-0 bg-primary-green/5 mix-blend-overlay" />
          <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.3)] pointer-events-none" />

          <div className="absolute inset-x-0 top-3 flex justify-center z-10">
            <motion.div
              custom={0}
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-4 py-1 shadow-lg"
            >
              <Sparkles className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-white font-inter text-[9px] font-black tracking-[0.2em] uppercase">
                Pure Natural Joy
              </span>
            </motion.div>
          </div>

          <button
            onClick={toggleMute}
            className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        <div className="px-5 py-8 text-center bg-gray-950">
          <motion.h1
            custom={1}
            variants={textVariants}
            initial="hidden"
            animate="visible"
            className="font-outfit text-4xl font-black text-white leading-tight mb-3 tracking-tighter"
          >
            Freshly{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-yellow-300 font-berkshire font-normal">
              Scooped
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={textVariants}
            initial="hidden"
            animate="visible"
            className="font-inter text-white/65 text-sm leading-relaxed mb-7"
          >
            Experience the authentic taste of nature with our handpicked fruit ice creams.
            No additives, just pure, creamy happiness.
          </motion.p>

          <motion.div
            custom={3}
            variants={textVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            <motion.a
              href="#favorites"
              className="w-full py-4 bg-white text-primary-green rounded-2xl font-inter font-black text-base shadow-xl flex items-center justify-center gap-2"
              whileTap={{ scale: 0.97 }}
            >
              Start Exploring <ArrowDown className="w-4 h-4" />
            </motion.a>
          </motion.div>
        </div>
      </section>
      )}

      {/* DESKTOP */}
      {isDesktop && (
      <section
        ref={containerRef}
        className="relative w-full h-[90vh] overflow-hidden hidden sm:block"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <motion.div className="absolute inset-0 w-full h-full" style={{ scale: videoScale }}>
          <video
            ref={videoRefDesktop}
            src={introVideo}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        <div className="absolute inset-0 bg-primary-green/5 mix-blend-overlay" />

        <motion.div
          className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4"
          style={{ y: contentY, opacity }}
        >
          <motion.div
            custom={0}
            variants={textVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-6 py-2.5 mb-8 shadow-xl"
          >
            <Sparkles className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-white font-inter text-xs font-black tracking-[0.25em] uppercase">
              Pure Natural Joy
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={textVariants}
            initial="hidden"
            animate="visible"
            className="font-outfit text-8xl lg:text-9xl font-black text-white leading-tight mb-8 tracking-tighter drop-shadow-2xl"
          >
            Freshly{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-yellow-300 font-berkshire font-normal">
              Scooped
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={textVariants}
            initial="hidden"
            animate="visible"
            className="font-inter text-white/90 text-xl sm:text-2xl max-w-3xl mb-12 leading-relaxed drop-shadow-md"
          >
            Experience the authentic taste of nature with our handpicked fruit ice creams.
            No additives, just pure, creamy happiness.
          </motion.p>

          <motion.div
            custom={3}
            variants={textVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <motion.a
              href="#favorites"
              className="group relative px-12 py-5 bg-white text-primary-green rounded-full font-inter font-black text-xl overflow-hidden shadow-2xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Exploring{" "}
                <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
              </span>
            </motion.a>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-12 right-12 flex items-center gap-4 z-20"
            >
              <button
                onClick={toggleMute}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 flex items-center justify-center text-white hover:bg-white/40 transition-all shadow-lg"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <span className="text-white/40 font-inter text-xs tracking-widest uppercase">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown className="w-5 h-5 text-white/40" />
          </motion.div>
        </motion.div>

        <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.5)] pointer-events-none" />
      </section>
      )}
    </>
  );
};

export default IntroVideoHero;