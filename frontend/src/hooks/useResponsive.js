import { useState, useEffect } from "react";

export function useResponsive() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    width,
    isMobile: width < 768,      // 320px+ to 767px
    isTablet: width >= 768 && width < 1024,  // 768px+
    isLaptop: width >= 1024 && width < 1440, // 1024px+
    isDesktop: width >= 1440,   // 1440px+
  };
}
