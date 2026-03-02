import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX, UserCheck } from "lucide-react";

interface LockScreenProps {
  onUnlock: () => void;
}

const SLIDES = [
  {
    id: 1,
    title: "Bienvenido a ICHEJA",
    description: "Aprende de manera interactiva y divertida.",
    color: "bg-blue-600",
    image: "https://placehold.co/600x400/2563eb/white?text=Slide+1",
    audioText: "Bienvenido a Icheja. Aprende de manera divertida.",
  },
  {
    id: 2,
    title: "Explora las Unidades",
    description: "Descubre nuevos temas cada día.",
    color: "bg-green-600",
    image: "https://placehold.co/600x400/16a34a/white?text=Slide+2",
    audioText: "Explora las unidades y descubre nuevos temas.",
  },
  {
    id: 3,
    title: "Ejercicios Prácticos",
    description: "Pon a prueba tus conocimientos.",
    color: "bg-purple-600",
    image: "https://placehold.co/600x400/9333ea/white?text=Slide+3",
    audioText: "Realiza ejercicios prácticos para reforzar tu aprendizaje.",
  },
  {
    id: 4,
    title: "Sigue tu Progreso",
    description: "Visualiza tus logros y avances.",
    color: "bg-orange-600",
    image: "https://placehold.co/600x400/ea580c/white?text=Slide+4",
    audioText: "Sigue tu progreso y celebra tus logros.",
  },
];

const SLIDE_DURATION = 10000; // 10 seconds

export const LockScreen = ({ onUnlock }: LockScreenProps) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAudioEnabled) {
      speak(SLIDES[currentSlideIndex].audioText);
    }
  }, [currentSlideIndex, isAudioEnabled, speak]);

  const handleUnlock = () => {
    window.speechSynthesis.cancel();
    onUnlock();
  };

  const currentSlide = SLIDES[currentSlideIndex];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-900 text-white overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 flex flex-col items-center justify-center ${currentSlide.color}`}
        >
          <div className="text-center p-8 max-w-4xl">
            <h1 className="text-6xl font-bold mb-6 drop-shadow-lg">
              {currentSlide.title}
            </h1>
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className="w-full max-w-2xl h-auto rounded-lg shadow-2xl mb-8 mx-auto object-cover aspect-video"
            />
            <p className="text-3xl font-light drop-shadow-md">
              {currentSlide.description}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicators */}
      <div className="absolute bottom-12 flex space-x-4 z-10">
        {SLIDES.map((_, index) => (
          <div
            key={index}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              index === currentSlideIndex ? "bg-white scale-125" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="absolute top-8 right-8 z-20 flex gap-4">
        <button
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          className="p-3 bg-black/30 hover:bg-black/50 rounded-full backdrop-blur-sm transition-colors"
          title={isAudioEnabled ? "Silenciar" : "Activar audio"}
        >
          {isAudioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
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
      
       {/* Debug Info */}
       <div className="absolute top-8 left-8 z-20 bg-black/50 p-2 rounded text-xs font-mono">
        <p>Slide: {currentSlideIndex + 1}/{SLIDES.length}</p>
        <p>Time: 10s</p>
      </div>
    </div>
  );
};
