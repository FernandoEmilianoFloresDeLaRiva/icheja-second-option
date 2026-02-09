import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function VideoIntro() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Después de 5 segundos, redirigir al splash
    const timer = setTimeout(() => {
      setLocation("/splash");
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-screen flex items-center justify-center"
      >
        <div className="relative w-full h-full">
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/kX77h7EpPOk?si=xZuBT82EbpyRCN3z&autoplay=1&mute=0&controls=0"
            title="Presentación de AprendIA"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </div>
      </motion.div>
    </div>
  );
}
