import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { theme } from "../../core/config/theme";
import alfiImage from "../../assets/images/splash/Alfi.svg";
// Import main image for hand cursor
import handCursor from "../../assets/images/splash/mano.png";
import playIcon from "../../assets/images/splash/play.png";
import logosImage from "../../assets/images/splash/logos.png";
import { useSpeech } from "../../exercises/hooks/useSpeech";

type TourStep = "alfi" | "iniciar" | null;

export default function SplashScreen() {
  const [, setLocation] = useLocation();
  const { speak, cancel, pause, isSpeaking } = useSpeech();
  const hasInteractedWithAlfiRef = useRef(false);
  const [currentTourStep, setCurrentTourStep] = useState<TourStep>(null);
  const currentTourStepRef = useRef<TourStep>(null);
  const alfiRef = useRef<HTMLDivElement>(null);
  const iniciarButtonRef = useRef<HTMLButtonElement>(null);
  const audioButtonRef = useRef<HTMLButtonElement>(null);
  const [elementPosition, setElementPosition] = useState<DOMRect | null>(null);

  // Sincronizar el ref con el estado
  useEffect(() => {
    currentTourStepRef.current = currentTourStep;
  }, [currentTourStep]);

  // Función para reproducir audio del paso actual
  const playStepAudio = (step: TourStep) => {
    if (step === "alfi") {
      hasInteractedWithAlfiRef.current = true;
      speak("Hola soy Alfi, te acompañaré en tu proceso de alfabetización. Haz clic en mí o en el botón de audio para escuchar mi presentación.");
    } else if (step === "iniciar") {
      speak("Presiona el botón Iniciar para comenzar tu aprendizaje. Te guiaré con un tour por la aplicación.");
    }
  };

  // Activar el tour automáticamente al cargar la página y reproducir primer audio
  useEffect(() => {
    let mounted = true;
    
    const startTour = async () => {
      // Esperar a que las voces estén disponibles
      const waitForVoices = () => {
        return new Promise<void>((resolve) => {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            resolve();
          } else {
            window.speechSynthesis.onvoiceschanged = () => {
              resolve();
            };
            // Timeout de seguridad
            setTimeout(resolve, 2000);
          }
        });
      };
      
      await waitForVoices();
      
      if (!mounted) return;
      
      // Activar el paso 1 - directo al botón Iniciar
      setCurrentTourStep("iniciar");
      
      // Reproducir audio después de un pequeño delay
      setTimeout(() => {
        if (mounted) {
          playStepAudio("iniciar");
        }
      }, 800);
    };
    
    const timer = setTimeout(startTour, 500);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleStart = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    // Si estamos en el tour del botón iniciar, cerrar el tour y activar el tour completo
    if (currentTourStep === "iniciar" && hasInteractedWithAlfiRef.current) {
      setCurrentTourStep(null);
      // Activar el tour completo cuando el usuario hace click en Iniciar después de escuchar a Alfi
      handleStartTour();
      return;
    }
    // Si estamos en el tour, cerrarlo
    if (currentTourStep) {
      setCurrentTourStep(null);
    }
    // El botón "Iniciar" navega normalmente a /welcome
    setLocation("/welcome");
  };

  const handleStartTour = () => {
    // Guardar en sessionStorage que se debe iniciar el tour
    sessionStorage.setItem("start-tour", "true");
    // Navegar a /welcome para mostrar el tour guiado
    setLocation("/welcome");
  };

  const togglePlay = () => {
    if (isSpeaking) {
      pause();
      // Si se pausa, no avanzar al siguiente paso
      return;
    } else {
      // Marcar que hubo interacción con Alfi/audio
      hasInteractedWithAlfiRef.current = true;
      speak("Hola soy Alfi, te acompañaré en tu proceso de alfabetización", {
        onEnd: () => {
          // Cuando el audio termine completamente, avanzar automáticamente al paso 2 (botón Iniciar)
          if (hasInteractedWithAlfiRef.current) {
            // Usar función de actualización de estado para acceder al valor más reciente
            setCurrentTourStep((prevStep) => {
              if (prevStep === "alfi") {
                return "iniciar";
              }
              return prevStep;
            });
          }
          // NO navegar automáticamente, esperar a que el usuario haga click en "Iniciar"
        },
      });
    }
  };

  // Limpiar el audio cuando el componente se desmonte
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  // Actualizar constantemente la posición del elemento para que el spotlight siga al botón durante el pulso
  useEffect(() => {
    if (!currentTourStep) return;

    let animationFrameId: number;
    
    const updatePosition = () => {
      const getElementPosition = (step: TourStep): DOMRect | null => {
        if (step === "alfi" && audioButtonRef.current) {
          return audioButtonRef.current.getBoundingClientRect();
        }
        if (step === "iniciar" && iniciarButtonRef.current) {
          return iniciarButtonRef.current.getBoundingClientRect();
        }
        return null;
      };

      const newPosition = getElementPosition(currentTourStep);
      if (newPosition) {
        setElementPosition(newPosition);
      }
      
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    updatePosition();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [currentTourStep]);

  // Variantes de animación para el contenedor principal
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  // Variantes para elementos hijos
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };



  // Animación de pulso para el botón de play cuando está reproduciendo
  const pulseAnimation = {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-gray-50 relative overflow-hidden">
      {/* Efecto de partículas de fondo animadas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-pink-200/20"
            style={{
              width: `${20 + i * 15}px`,
              height: `${20 + i * 15}px`,
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Header animado */}
      <motion.header
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 63, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          backgroundColor: theme.colors.primary.pink,
          overflow: "hidden",
        }}
      />

      {/* Contenido principal */}
      <motion.div
        className="flex flex-1 flex-col items-center justify-center relative pb-24 z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col items-center w-full">
          {/* Contenedor superior con texto, reproductor y Alfi */}
          <div className="flex flex-row items-center justify-center w-full px-8 mb-8 gap-12">
            {/* Contenedor izquierdo con textos y botón */}
            <motion.div
              className="flex flex-col items-start gap-6"
              variants={itemVariants}
            >
              {/* Texto Hola soy Alfi con animación de escritura */}
              <motion.h1
                style={{
                  width: "713px",
                  height: "134px",
                  opacity: 1,
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontStyle: "normal",
                  fontSize: "111.77px",
                  lineHeight: "120%",
                  letterSpacing: "0%",
                  textAlign: "left",
                  color: theme.colors.primary.pink,
                  margin: 0,
                }}
                initial={{ opacity: 0, x: -50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  duration: 0.8,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ scale: 1.02 }}
              >
                Hola soy Alfi
              </motion.h1>

              {/* Texto debajo de Hola soy Alfi */}
              <motion.p
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontStyle: "normal",
                  fontSize: "39.83px",
                  lineHeight: "120%",
                  letterSpacing: "0%",
                  textAlign: "left",
                  color: "#000000",
                  width: "713px",
                  margin: 0,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.3,
                  ease: "easeOut",
                }}
              >
                te acompañaré en tu proceso de alfabetizacion
              </motion.p>

              {/* Botón Iniciar con animaciones mejoradas */}
              <div className="relative">
                <motion.button
                ref={iniciarButtonRef}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStart(e);
                }}
                type="button"
                disabled={isSpeaking}
                className="font-semibold text-white whitespace-nowrap flex items-center justify-center relative overflow-hidden"
                style={{
                  width: "401px",
                  height: "100px",
                  borderRadius: "37px",
                  padding: "0 32px",
                  gap: "8px",
                  backgroundColor: isSpeaking
                    ? theme.colors.primary.pink + "80"
                    : theme.colors.primary.pink,
                  fontSize: "32px",
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  cursor: isSpeaking ? "not-allowed" : "pointer",
                  opacity: isSpeaking ? 0.6 : 1,
                  zIndex: currentTourStep === "iniciar" ? 10002 : "auto",
                  position: currentTourStep === "iniciar" ? "relative" : "static",
                  isolation: currentTourStep === "iniciar" ? "isolate" : "auto",
                  pointerEvents: "auto",
                }}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: isSpeaking ? 0.6 : 1,
                  // Efecto de pulso más intenso cuando está en tour - más rápido y constante
                  scale: currentTourStep === "iniciar" && !isSpeaking ? [1, 1.16, 1] : 1,
                }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.5 },
                  // Configuración del pulso - más intenso y siempre activo cuando está en tour
                  scale: {
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                whileHover={
                  !isSpeaking
                    ? {
                        scale: 1.05,
                        boxShadow: "0 20px 40px rgba(201, 1, 102, 0.3)",
                      }
                    : {}
                }
                whileTap={!isSpeaking ? { scale: 0.98 } : {}}
              >
                {/* Efecto de brillo al hacer hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10">Iniciar</span>
              </motion.button>
              
              {/* Manita apuntando al botón */}
              <AnimatePresence>
                {currentTourStep === "iniciar" && (
                  <motion.div
                    initial={{ opacity: 0, x: 50, y: 50 }}
                    animate={{ 
                      opacity: 1, 
                      x: [20, 0, 20], 
                      y: [20, 0, 20] 
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute -bottom-12 -right-12 z-[10003] pointer-events-none drop-shadow-lg"
                    style={{
                      filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.3))"
                    }}
                  >
                    {/* Imagen de la mano cursor - Reemplazar la imagen en src/assets/images/splash/hand-cursor.png */}
                    <img
                      src={handCursor}
                      alt="Click aquí"
                      className="w-35 h-35 object-contain rotate-[-15deg]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </motion.div>

            {/* Reproductor de audio CENTRADO */}
            <motion.div
              className="flex items-center justify-center"
              variants={itemVariants}
              style={{
                width: "120px",
                height: "120px",
                flexShrink: 0,
                position: "relative",
                zIndex: currentTourStep === "alfi" ? 10001 : "auto",
                isolation: currentTourStep === "alfi" ? "isolate" : "auto",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.4,
              }}
            >
                {/* Ondas animadas cuando está reproduciendo - Perfectamente centradas */}
                <AnimatePresence>
                  {isSpeaking &&
                    [0, 1, 2].map((i) => (
                      <motion.div
                        key={`wave-${i}`}
                        className="absolute rounded-full border-2 border-pink-400"
                        style={{
                          width: "120px",
                          height: "120px",
                          left: "0px",
                          top: "0px",
                          pointerEvents: "none",
                        }}
                        initial={{ scale: 0.8, opacity: 0.6 }}
                        animate={{
                          scale: [0.8, 1.5, 2],
                          opacity: [0.6, 0.3, 0],
                        }}
                        exit={{
                          scale: 2.2,
                          opacity: 0,
                          transition: {
                            duration: 0.25,
                            ease: "easeIn",
                          },
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                          ease: "easeOut",
                        }}
                      />
                    ))}
                </AnimatePresence>

                <motion.button
                  ref={audioButtonRef}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Iniciar el tour guiado cuando se hace click en el botón de audio
                    if (!currentTourStep) {
                      setCurrentTourStep("alfi");
                    }
                    togglePlay();
                  }}
                  type="button"
                  className="cursor-pointer relative z-10"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    width: "120px",
                    height: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  animate={isSpeaking ? pulseAnimation : {}}
                >
                  <img
                    src={playIcon}
                    alt="Reproducir audio de Alfi"
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "contain",
                    }}
                  />
                </motion.button>
              </motion.div>

              {/* Mascota Alfi - estático */}
              <div
                ref={alfiRef}
                className="flex justify-center items-center cursor-pointer relative"
                style={{
                  zIndex: currentTourStep === "alfi" ? 10001 : "auto",
                  position: currentTourStep === "alfi" ? "relative" : "static",
                  isolation: currentTourStep === "alfi" ? "isolate" : "auto",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Iniciar el tour guiado cuando se hace click en Alfi
                  if (!currentTourStep) {
                    setCurrentTourStep("alfi");
                  }
                  // Marcar interacción y reproducir audio
                  hasInteractedWithAlfiRef.current = true;
                  if (!isSpeaking) {
                    speak("Hola soy Alfi, te acompañaré en tu proceso de alfabetización", {
                      onEnd: () => {
                        // Cuando el audio termine completamente, avanzar automáticamente al paso 2 (botón Iniciar)
                        if (hasInteractedWithAlfiRef.current) {
                          // Usar función de actualización de estado para acceder al valor más reciente
                          setCurrentTourStep((prevStep) => {
                            if (prevStep === "alfi") {
                              return "iniciar";
                            }
                            return prevStep;
                          });
                        }
                        // NO navegar automáticamente, esperar a que el usuario haga click en "Iniciar"
                      },
                    });
                  }
                }}
              >
                <img
                  src={alfiImage}
                  alt="Alfi - Mascota de la empresa"
                  className="max-w-full h-auto object-contain"
                  style={{ maxHeight: "400px" }}
                />
              </div>
          </div>

          {/* Imagen de logos centrada con animación */}
          <motion.div
            style={{
              position: "absolute",
              width: "852px",
              height: "120.56px",
              bottom: "83px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.8,
              ease: "easeOut",
            }}
          >
            <motion.img
              src={logosImage}
              alt="Logos"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Footer animado */}
      <motion.footer
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 63, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        style={{
          backgroundColor: theme.colors.primary.pink,
          overflow: "hidden",
        }}
      />

      {/* Tour Guiado Overlay - Focus inverso: elemento resaltado se ve normal, resto sombreado */}
      <AnimatePresence>
        {currentTourStep && (
          <>
            {/* Overlay oscuro que cubre todo excepto el elemento resaltado */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9997]"
              style={{ 
                pointerEvents: "none",
                backgroundColor: "transparent",
                mixBlendMode: "normal"
              }}
            >
              {/* SVG con máscara para crear el agujero (spotlight) */}
              <svg
                className="absolute inset-0 w-full h-full"
                style={{ 
                  pointerEvents: "none",
                  mixBlendMode: "normal"
                }}
              >
                <defs>
                  <mask id={`splash-spotlight-mask-${currentTourStep}`}>
                    {/* Todo el fondo es blanco (visible) */}
                    <rect width="100%" height="100%" fill="white" />
                    {/* El rectángulo del spotlight es negro (transparente/invisible) */}
                    {elementPosition && (
                      <rect
                        x={elementPosition.left - 25}
                        y={elementPosition.top - 25}
                        width={elementPosition.width + 50}
                        height={elementPosition.height + 50}
                        rx={50}
                        fill="black"
                      />
                    )}
                  </mask>
                </defs>
                {/* Rectángulo oscuro que se aplica con la máscara */}
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0, 0, 0, 0.30)"
                  mask={`url(#splash-spotlight-mask-${currentTourStep})`}
                  style={{ mixBlendMode: "normal" }}
                />
              </svg>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

