import React, { Suspense, useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Defers a section until it is near the viewport. The lazy() chunk, its images,
 * videos and WebGL/animation setup are only fetched/started once it is about to
 * be seen, instead of everything loading at page open.
 *
 * `id` keeps in-page anchors (#favorites, ...) working while the placeholder is shown.
 */
const LazySection = ({ children, id, minHeight = "80vh", rootMargin = "600px 0px" }) => {
  // No IntersectionObserver support -> just render immediately
  const [visible, setVisible] = useState(() => !("IntersectionObserver" in window));
  const ref = useRef(null);

  useEffect(() => {
    if (visible || !ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  // Late-mounted sections change page height: let GSAP recompute pinned/scrubbed triggers
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return <div ref={ref} id={id} style={{ minHeight }} aria-hidden="true" />;

  return <Suspense fallback={<div id={id} style={{ minHeight }} />}>{children}</Suspense>;
};

export default LazySection;
