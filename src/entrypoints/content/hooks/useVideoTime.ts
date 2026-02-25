import { useState, useEffect, useRef } from "react";

export function useVideoTime(): number {
  const [currentTime, setCurrentTime] = useState(0);
  const rafRef = useRef<number>(0);
  const lastReportedRef = useRef(0);

  useEffect(() => {
    function tick() {
      const video = document.querySelector("video");
      if (video) {
        const t = video.currentTime;
        // setState at most every ~100ms to avoid 60fps re-renders
        if (Math.abs(t - lastReportedRef.current) > 0.1) {
          lastReportedRef.current = t;
          setCurrentTime(t);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return currentTime;
}
