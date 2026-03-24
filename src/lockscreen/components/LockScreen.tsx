import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserCheck } from "lucide-react";

// Importar imágenes del slider
import slaider1 from "../../assets/images/slaider1.jpg";
import slaider2 from "../../assets/images/slaider2.jpg";
import slaider3 from "../../assets/images/slaider3.png";
import slaider4 from "../../assets/images/slaider4.png";
import slaider5 from "../../assets/images/slaider5.jpg";
import slaider6 from "../../assets/images/slaider6.jpg";

interface LockScreenProps {
  onUnlock: () => void;
}

const SLIDES = [
  { id: 1, image: slaider1 },
  { id: 2, image: slaider2 },
  { id: 3, image: slaider3 },
  { id: 4, image: slaider4 },
  { id: 5, image: slaider5 },
  { id: 6, image: slaider6 },
];

const SLIDE_DURATION = 3000; // 3 seconds

export const LockScreen = ({ onUnlock }: LockScreenProps) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, []);

  const handleUnlock = () => {
    onUnlock();
  };

  const currentSlide = SLIDES[currentSlideIndex];

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={currentSlide.image}
            alt={`Slide ${currentSlide.id}`}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicators */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-4 z-10">
        {SLIDES.map((_, index) => (
          <div
            key={index}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              index === currentSlideIndex ? "bg-white scale-125" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Simulation Trigger */}
      <div className="absolute bottom-8 right-8 z-20">
        <button
          onClick={handleUnlock}
          className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
          title="Simular detección de persona"
        >
          <UserCheck size={24} />
          <span>Simular Detección</span>
        </button>
      </div>
    </div>
  );
};
