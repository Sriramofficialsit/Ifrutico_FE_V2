import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import processVideo from "../images/process.mp4";
import { Play, Pause, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

const STEPS = [
  {
    time: 0,
    label: "Fresh Ingredients",
    icon: "🌿",
    description: "Handpicked fruits from Kolli Hills & Nilgiris, combined with farm-fresh village milk.",
    color: "from-lemerald-400 to-green-600",
  },
  {
    time: 15,
    label: "Preparation",
    icon: "🔪",
    description: "Fruits are cleaned, peeled, and naturally processed without any chemicals or preservatives.",
    color: "from-yellow-400 to-orange-500",
  },
  {
    time: 30,
    label: "Blending",
    icon: "🌀",
    description: "Ingredients are blended to a perfectly smooth consistency with sulphur-free sugar.",
    color: "from-pink-400 to-rose-600",
  },
  {
    time: 45,
    label: "Freezing",
    icon: "❄️",
    description: "Quick-frozen at precise temperatures to lock in the natural flavor and freshness.",
    color: "from-blue-400 to-cyan-600",
  },
  {
    time: 60,
    label: "Serving",
    icon: "🍦",
    description: "Perfectly scooped and served — a pure, joyful experience in every bite.",
    color: "from-purple-400 to-violet-600",
  },
];

const ProcessVideoSection = () => {
  const videoRef = useRef(null);
  const sectionRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const headerY = useTransform(scrollYProgress, [0, 0.3], [60, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;
      setProgress(pct);

      // Map to steps proportionally
      const stepDuration = video.duration / STEPS.length;
      const step = Math.min(
        Math.floor(video.currentTime / stepDuration),
        STEPS.length - 1
      );
      setActiveStep(step);
    };

    const handleLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekToStep = (index) => {
    if (!videoRef.current || !duration) return;
    const stepDuration = duration / STEPS.length;
    videoRef.current.currentTime = index * stepDuration;
    setActiveStep(index);
    if (!isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (videoRef.current && duration) {
      videoRef.current.currentTime = pct * duration;
    }
  };

  return (
    <section
      id="process-section"
      ref={sectionRef}
      className="relative py-24 sm:py-32 bg-gray-950 overflow-hidden"
    >
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-green/20 rounded-full blur-[150px] animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-mango-orange/20 rounded-full blur-[150px] animate-blob animation-delay-2000" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-24"
          style={{ y: headerY, opacity: headerOpacity }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-green/20 to-secondary-green/20 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2.5 mb-8 shadow-2xl"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-5 h-5 text-primary-green animate-pulse" />
            <span className="text-white font-inter text-xs font-black tracking-[0.3em] uppercase">
              The Art of Crafting
            </span>
          </motion.div>

          <h2 className="font-outfit text-5xl sm:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tighter">
            Crafted with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green via-yellow-400 to-secondary-green font-berkshire font-normal">
              Love & Nature
            </span>
          </h2>
          <p className="text-white/60 font-inter text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            Witness the journey of purity. We transform nature’s finest bounty into
            frozen masterpieces, preserving every ounce of natural goodness.
          </p>
        </motion.div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

          {/* ---- VIDEO SIDE (Left 7 cols) ---- */}
          <motion.div
            className="lg:col-span-7 sticky top-32"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            {/* Multi-layered glow */}
            <div className={`absolute -inset-[3px] rounded-[2.5rem] bg-gradient-to-br from-primary-green/40 via-yellow-400/20 to-secondary-green/40 blur-md opacity-70 transition-all duration-1000`} />

            <div className="relative bg-gray-900/60 lg:bg-gray-900/40 backdrop-blur-md lg:backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">

              {/* Cinematic Video Container */}
              <div className="relative aspect-video group/video">
                <video
                  ref={videoRef}
                  src={processVideo}
                  className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                  preload="metadata"
                  playsInline
                  loop
                />

                {/* Glass Play Overlay */}
                <AnimatePresence>
                  {!isPlaying && (
                    <motion.div
                      className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={togglePlay}
                    >
                      <motion.div
                        className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl"
                        whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.2)" }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Play className="w-10 h-10 text-white fill-current ml-1" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>


              </div>

              {/* Premium Control Bar */}
              <div className="p-8 bg-black/20 border-t border-white/5">
                <div
                  className="w-full h-1.5 bg-white/5 rounded-full mb-6 cursor-pointer group/progress relative"
                  onClick={handleProgressClick}
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary-green via-yellow-400 to-secondary-green relative"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] scale-0 group-hover/progress:scale-100 transition-transform" />
                  </motion.div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button onClick={togglePlay} className="text-white/60 hover:text-white transition-colors">
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                    </button>
                    <span className="text-white/40 font-inter text-xs tracking-widest font-bold">
                      {Math.floor(progress)}% COMPLETED
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-500 ${i === activeStep ? "w-8 bg-primary-green" : "w-2 bg-white/10"
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ---- STEPS SIDE (Right 5 cols) ---- */}
          <div className="lg:col-span-5 relative">
            {/* Connecting Line */}
            <div className="absolute left-[39px] top-10 bottom-10 w-px bg-gradient-to-b from-primary-green/50 via-yellow-400/50 to-secondary-green/50 opacity-20 hidden sm:block" />

            <div className="flex flex-col gap-6">
              {STEPS.map((step, index) => {
                const isActive = index === activeStep;
                const isPast = index < activeStep;

                return (
                  <motion.button
                    key={index}
                    onClick={() => seekToStep(index)}
                    className={`text-left relative group rounded-3xl border transition-all duration-500 ${isActive
                        ? "bg-white/10 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10"
                        : "bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/10"
                      }`}
                    whileHover={{ x: 10 }}
                  >
                    <div className="flex items-center gap-6 p-6">
                      {/* Number/Icon Container */}
                      <div className="relative z-10">
                        <motion.div
                          className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 ${isActive
                              ? "bg-white text-primary-green shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                              : isPast
                                ? "bg-primary-green text-white"
                                : "bg-white/10 text-white/20"
                            }`}
                        >
                          {isPast ? <CheckCircle2 className="w-6 h-6" /> : <span>{step.icon}</span>}
                        </motion.div>

                        {/* Pulse effect for active */}
                        {isActive && (
                          <span className="absolute inset-0 rounded-2xl bg-white/40 animate-ping -z-10" />
                        )}
                      </div>

                      {/* Text Content */}
                      <div className="flex-1">
                        <h4 className={`font-outfit font-black text-lg mb-1 tracking-tight transition-colors duration-300 ${isActive ? "text-white" : "text-white/40"
                          }`}>
                          {step.label}
                        </h4>
                        <AnimatePresence>
                          {isActive && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-white/60 font-inter text-sm leading-relaxed"
                            >
                              {step.description}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      {isActive && <ChevronRight className="w-5 h-5 text-primary-green animate-pulse" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ProcessVideoSection;
