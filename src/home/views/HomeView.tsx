import AlfiImg from "../../assets/images/alfi.png";
import GobiernoLogo from "../../assets/images/gobierno_logo.png";
import AlfaLogo from "../../assets/images/alfa_logo.png";
import UPLogo from "../../assets/images/up_logo.png";
import dividerHome from "../../assets/images/divider_home.png";

import { theme } from "../../core/config/theme";
import { useLocation } from "wouter";
import { useSpeech } from "../../exercises/hooks/useSpeech";
import { Square, Volume2, ArrowLeft } from "lucide-react";
import { UI_CONSTANTS } from "../../common/constants/UI_CONSTANTS";
import { useEffect, useState } from "react";
import { useUnits } from "../../units/hooks/useUnits";
import { motion, AnimatePresence } from "framer-motion";
import UnitsGrid from "../../units/components/UnitsGrid";

// Animación flotante para Alfi
const floatingAnimation = {
  y: [0, -15, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

export default function HomeView() {
  const [_, setLocation] = useLocation();
  const { speak, isSpeaking, cancel } = useSpeech();
  const { units } = useUnits();
  const [showUnits, setShowUnits] = useState(false);

  const handlePlayAudio = () => {
    if (isSpeaking) {
      cancel();
    } else {
      console.log("hablando");
      speak(UI_CONSTANTS.welcomeText);
    }
  };

  useEffect(() => {
    console.log("Speech Synthesis disponible:", !!window.speechSynthesis);

    const timer = setTimeout(() => {
      console.log("Ejecutando reproducción automática...");
      const result = speak(UI_CONSTANTS.welcomeText);
      console.log("Resultado de speak():", result);
    }, 1000);

    return () => {
      console.log("Limpiando timer...");
      clearTimeout(timer);
    };
  }, [speak]);

  return (
    <div className="h-full w-full flex flex-col bg-white relative">
      {/* Alfi arriba a la derecha - siempre visible */}
      <motion.div
        data-tour="alfi"
        className="fixed cursor-pointer"
        style={{
          width: "120px",
          height: "120px",
          top: "24px",
          right: "24px",
          zIndex: 10002,
          position: "fixed",
        }}
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: 0,
          ...floatingAnimation,
        }}
        transition={{
          opacity: { duration: 0.8 },
          scale: { duration: 0.8 },
          rotate: { duration: 0.8 },
        }}
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        <img
          src={AlfiImg}
          alt="Alfi - Asistente virtual"
          className="w-full h-full object-contain"
        />
      </motion.div>

      {/* Header de bienvenida con fondo rosa */}
      <div
        className="w-full h-20"
        style={{ backgroundColor: theme.colors.primary.pink }}
      >
        <img src={dividerHome} alt="" />
      </div>
      <div className="text-left pl-16 mt-8">
        <h1
          className="text-8xl font-bold "
          style={{ color: theme.colors.primary.pink }}
        >
          ¡Hola soy Alfi!
        </h1>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex items-start px-16 mt-8">
        <AnimatePresence mode="wait">
          {!showUnits ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex items-stretch justify-between w-full h-full max-w-7xl"
            >
              {/* Sección izquierda con texto y botón de audio */}
              <div className="flex-2 pt-16 flex flex-col justify-between">
                {/* Botón de audio y texto principal */}
                <div className="flex-1 flex flex-row items-start space-x-9">
                  <button
                    data-tour="audio-button"
                    className="w-40 h-32 mt-14 rounded-xl flex items-center justify-center shadow-lg hover:cursor-pointer relative"
                    style={{ 
                      backgroundColor: theme.colors.primary.turquoise,
                      zIndex: 10001,
                    }}
                    aria-label={
                      isSpeaking ? "Detener audio" : "Escuchar bienvenida"
                    }
                    onClick={handlePlayAudio}
                  >
                    {isSpeaking ? (
                      <Square size={60} className="text-white" />
                    ) : (
                      <Volume2 size={80} className="text-white" />
                    )}
                  </button>

                  {/* Texto principal */}
                  <h2 className="text-4xl font-bold text-gray-800 leading-relaxed mb-4 ml-4">
                    Bienvenido <br /> te estaré ayudando <br /> en tu proceso de
                    alfabetización. <br /> Presiona el botón Iniciar
                  </h2>
                </div>

                {/* Logos institucionales */}
                <div className="flex-1 flex items-end justify-center space-x-32 mt-auto">
                  <div className="flex items-center">
                    <img
                      src={GobiernoLogo}
                      alt="Gobierno Logo"
                      className="h-16 w-auto object-contain"
                    />
                  </div>

                  <div className="flex items-center">
                    <img
                      src={AlfaLogo}
                      alt="Chiapas Puede Logo"
                      className="h-16 w-auto object-contain"
                    />
                  </div>

                  <div className="flex items-center">
                    <img
                      src={UPLogo}
                      alt="Universidad Politécnica Logo"
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Sección derecha con el personaje y botón */}
              <div className="flex-1 flex flex-col items-center justify-center">
                {/* Imagen de Alfi */}
                <div className="mb-12">
                  <img
                    src={AlfiImg}
                    alt="Alfi"
                    className="w-100 h-100 scale-140 object-contain"
                  />
                </div>

                {/* Botón de iniciar */}
                <button
                  data-tour="iniciar-button"
                  onClick={() => {
                    setShowUnits(true);
                    // Pequeño delay para asegurar que el DOM se actualice antes de que el tour intente encontrar el grid
                    setTimeout(() => {
                      // El tour detectará automáticamente el cambio cuando avance al siguiente paso
                    }, 300);
                  }}
                  className="w-72 mt-6 px-16 py-4 text-white text-2xl font-bold rounded-4xl shadow-lg transition-all duration-200 animate-bounce hover:opacity-90 hover:scale-105 hover:cursor-pointer relative"
                  style={{ 
                    backgroundColor: theme.colors.primary.pink,
                    zIndex: 10001,
                  }}
                >
                  Iniciar
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="units"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* Botón Volver */}
              <div className="mb-6">
                <button
                  onClick={() => setShowUnits(false)}
                  className="flex items-center gap-2 px-6 py-3 text-white text-lg font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 hover:cursor-pointer"
                  style={{ backgroundColor: theme.colors.primary.turquoise }}
                >
                  <ArrowLeft size={24} />
                  Volver
                </button>
              </div>

              {/* Grid de Unidades */}
              <div 
                data-tour="units-grid"
                className="relative"
                style={{ zIndex: 10001 }}
              >
                <UnitsGrid
                  units={units}
                  onUnitClick={(unitId) => setLocation(`/units?unitId=${unitId}`)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
