import { useState, useEffect, useRef } from "react";

export function useVideoTime(): number {
  const [currentTime, setCurrentTime] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    function tick() {
      const video = document.querySelector("video");
      if (video) {
        setCurrentTime(video.currentTime);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return currentTime;
}
