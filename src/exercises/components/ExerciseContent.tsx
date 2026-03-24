import {
  ChevronLeft,
  ChevronRight,
  Square,
  Volume2,
  Check,
  X,
  RotateCcw,
} from "lucide-react";
import ExerciseSelectImageO from "./ExcerciseSelectImageO/ExerciseSelectImageO";
import ExerciseSelectImageU from "./ExcerciseSelectImageU/ExcerciseSelectImageU";
import { useExercises } from "../hooks/useExercises";
import { motion, AnimatePresence } from "framer-motion";
import { parseTitleExercises } from "../utils/parseTitleExercise";
import DrawingCanvas from "./DrawingCanvas/DrawingCanvas";
import { useState, useEffect, useRef } from "react";
import { useSpeech } from "../hooks/useSpeech";
import VowelCarouselGame from "./ExerciseTwentyFour/VowelCarouselGame";
import DragVowelExercise from "./DragVowelExercise/DragVowelExcercise";
import LetterSelectionGame from "./Select-letter/SelectLetter";
import LetterIdentificationGame from "./LetterIdentificationGame/LetterIdentificationGame";
import exercises from "../../../exercises.json";

// Audio de bienvenida para la primera vez (vista de selección de ejercicios)
const WELCOME_AUDIO = `¡Bienvenido de nuevo! Aquí puedes elegir el dibujo que más te guste para practicar.
En el centro de la pantalla verás un dibujo.
Si quieres ver otro dibujo diferente, busca el botón grande con una flecha que apunta hacia la DERECHA y presiónalo.
Si quieres regresar a ver el dibujo anterior, presiona el botón grande con la flecha que apunta hacia la IZQUIERDA.
Y si te perdiste y quieres volver a escuchar todo lo que te acabo de decir, presiona el botón pequeño de color ROSA.
Tómate tu tiempo. Cuando encuentres el dibujo que quieres hacer, simplemente presiona con tu dedo sobre el dibujo que está en el centro.
Al presionarlo, entraremos al juego para que empieces a unir las líneas.`;

// Audio de instrucciones para el canvas de dibujo
const DRAWING_AUDIO = `¡Hola! Vamos a practicar un poco.
En la pantalla verás un dibujo hecho con rayitas separadas.
Tu misión es unirlas todas.
Toma tu dedo o tu lápiz y traza una línea sobre las rayitas, desde donde empiezan hasta donde terminan, para completar el dibujo.
Cuando hayas terminado el dibujo y te guste cómo quedó, presiona el botón VERDE con la palomita que está abajo a la derecha.
Si quieres borrarlo y empezar de nuevo, presiona el botón NARANJA que está abajo a la izquierda.
Si quieres salir sin guardar, presiona el botón ROJO con la equis que está arriba a la izquierda.
Y si te perdiste y quieres volver a escuchar estas instrucciones, presiona el botón AZUL con la bocina que está arriba a la derecha.
¡Adelante, tú puedes hacerlo!`;

interface ExerciseContentProps {
  unitId: number;
  onIndexChange?: (index: number, total: number) => void;
}

export default function ExerciseContent({ unitId, onIndexChange }: ExerciseContentProps) {
  // Validar que unitId sea un número válido, usar 0 por defecto
  const validUnitId = unitId !== undefined && !isNaN(unitId) ? unitId : 0;
  
  const {
    exercise,
    nextExercise,
    previousExercise,
    isFirstExercise,
    isLastExercise,
    chapter,
    subject,
    currentIndex,
  } = useExercises(validUnitId);
  console.log(currentIndex);

  const { speak, cancel, isSpeaking } = useSpeech();

  const { parsedTitle, number } = parseTitleExercises(exercise?.title || "");

  const [isFullscreenDrawing, setIsFullscreenDrawing] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const hasPlayedWelcomeRef = useRef(false);
  const hasPlayedDrawingAudioRef = useRef(false);

  // Notificar cambios en el índice al componente padre
  useEffect(() => {
    if (onIndexChange) {
      const total = exercises[0]?.content?.[validUnitId]?.exercise?.length || 0;
      onIndexChange(currentIndex, total);
    }
  }, [currentIndex, onIndexChange, validUnitId]);

  // Cerrar modales cuando cambia el ejercicio
  useEffect(() => {
    setIsFullscreenDrawing(false);
  }, [exercise?.title]);

  // Emitir evento cuando el modal de dibujo cambia de estado (para ocultar Alfi)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('drawing-modal-state', { detail: { isOpen: isFullscreenDrawing } }));
  }, [isFullscreenDrawing]);

  // Reproducir audio de bienvenida la primera vez que entra a la vista de ejercicios
  useEffect(() => {
    const welcomeKey = `welcome-audio-unit-${validUnitId}`;
    const hasPlayedWelcome = sessionStorage.getItem(welcomeKey) === 'true';
    
    if (!hasPlayedWelcome && !hasPlayedWelcomeRef.current) {
      hasPlayedWelcomeRef.current = true;
      // Pequeño delay para asegurar que la vista esté lista
      const timer = setTimeout(() => {
        speak(WELCOME_AUDIO, {
          lang: "es-MX",
          rate: 0.9,
        });
        sessionStorage.setItem(welcomeKey, 'true');
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [validUnitId, speak]);

  // Escuchar eventos del tour para aplicar efecto de pulso
  useEffect(() => {
    const handleTourStepChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ stepId: string | null }>;
      const { stepId } = customEvent.detail;
      setIsTourActive(stepId === "exercise-content-area");
    };
    
    window.addEventListener('tour-step-changed', handleTourStepChange);
    
    return () => {
      window.removeEventListener('tour-step-changed', handleTourStepChange);
    };
  }, []);

  // Reproducir instrucciones de dibujo cuando se abre el canvas (solo una vez por apertura)
  useEffect(() => {
    if (isFullscreenDrawing && !hasPlayedDrawingAudioRef.current) {
      hasPlayedDrawingAudioRef.current = true;
      // Pequeño delay para asegurar que el modal esté visible
      const timer = setTimeout(() => {
        speak(DRAWING_AUDIO, {
          lang: "es-MX",
          rate: 0.9,
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    // Resetear el flag cuando se cierra el modal
    if (!isFullscreenDrawing) {
      hasPlayedDrawingAudioRef.current = false;
      cancel(); // Cancelar audio al salir
    }
  }, [isFullscreenDrawing, speak, cancel]);

  const handleSaveDrawing = (imageData: string) => {
    console.log("Dibujo guardado:", imageData);
  };

  // Botón rosa para reproducir el audio de bienvenida (en la vista principal)
  const handleWelcomeAudioClick = () => {
    if (isSpeaking) {
      cancel();
    } else {
      speak(WELCOME_AUDIO, {
        lang: "es-MX",
        rate: 0.9,
      });
    }
  };

  // Botón rosa para reproducir las instrucciones de dibujo (en el modal)
  const handleDrawingAudioClick = () => {
    if (isSpeaking) {
      cancel();
    } else {
      speak(DRAWING_AUDIO, {
        lang: "es-MX",
        rate: 0.9,
      });
    }
  };

  // Función para limpiar el canvas (dispara evento personalizado)
  const handleClearCanvas = () => {
    window.dispatchEvent(new CustomEvent('clear-drawing-canvas'));
  };

  return (
    <div data-tour="content" className="w-full h-full flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={exercise?.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col h-full min-h-0 overflow-hidden"
        >
          {/* Botón rosa de audio - Fijo en la parte inferior izquierda, después del sidebar */}
          <motion.button
            onClick={handleWelcomeAudioClick}
            className={`fixed bottom-6 left-24 z-50 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all ${
              isSpeaking
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-br from-[#C90166] to-[#E91E63] hover:from-[#B00050] hover:to-[#D81B60]"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={isSpeaking ? "Detener audio" : "Escuchar instrucciones"}
          >
            {isSpeaking ? (
              <Square size={28} className="text-white" />
            ) : (
              <Volume2 size={32} className="text-white" />
            )}
          </motion.button>

          {/* Área principal: Canvas con flechas de navegación a los lados */}
          <div className="flex-1 flex items-center justify-center gap-4 min-h-0 overflow-hidden px-4">
            {/* Flecha izquierda - Anterior */}
            <motion.button
              onClick={previousExercise}
              disabled={isFirstExercise}
              className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-xl transition-all flex-shrink-0 ${
                isFirstExercise
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-br from-[#009887] to-[#00B8A9] text-white hover:from-[#008577] hover:to-[#009887] cursor-pointer"
              }`}
              whileHover={!isFirstExercise ? { scale: 1.1 } : {}}
              whileTap={!isFirstExercise ? { scale: 0.95 } : {}}
              title={isFirstExercise ? "No hay ejercicio anterior" : "Ejercicio anterior"}
            >
              <ChevronLeft size={48} className="md:w-14 md:h-14" />
            </motion.button>

            {/* Canvas/Imagen del ejercicio - Área central */}
            <div 
              data-tour="exercise-content-area" 
              className="flex-1 h-full max-h-full bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg rounded-2xl p-4 flex justify-center items-center border-2 border-gray-200 overflow-hidden"
            >
              {(() => {
                const caseNumber = exercise?.case ?? null;

                switch (caseNumber) {
                  case 24:
                    return <VowelCarouselGame />;

                  case 25:
                    return (
                      <div className="w-full h-full flex items-center justify-center overflow-hidden">
                        <DragVowelExercise targetVowel="a" wordsPerRound={5} />
                      </div>
                    );

                  case 26:
                    return <LetterIdentificationGame />;

                  case 27:
                    return <LetterSelectionGame />;

                  case 46:
                    return <ExerciseSelectImageO />;

                  case 47:
                    return <ExerciseSelectImageU />;

                  default:
                    return (
                      <motion.img
                        src={`/stub_images/${exercise?.img}`}
                        alt={`Imagen del ejercicio: ${parsedTitle || exercise?.title}`}
                        className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl shadow-lg cursor-pointer"
                        onClick={() => !exercise?.isAudioExercise && setIsFullscreenDrawing(true)}
                        animate={{
                          scale: isTourActive && !exercise?.isAudioExercise ? [1, 1.16, 1] : 1,
                        }}
                        transition={{
                          scale: {
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                        }}
                        whileHover={!exercise?.isAudioExercise ? { scale: 1.03 } : {}}
                        whileTap={!exercise?.isAudioExercise ? { scale: 0.97 } : {}}
                        title={!exercise?.isAudioExercise ? "Toca la imagen para empezar a dibujar" : ""}
                      />
                    );
                }
              })()}
            </div>

            {/* Flecha derecha - Siguiente */}
            <motion.button
              onClick={nextExercise}
              disabled={isLastExercise}
              className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-xl transition-all flex-shrink-0 ${
                isLastExercise
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-br from-[#009887] to-[#00B8A9] text-white hover:from-[#008577] hover:to-[#009887] cursor-pointer"
              }`}
              whileHover={!isLastExercise ? { scale: 1.1 } : {}}
              whileTap={!isLastExercise ? { scale: 0.95 } : {}}
              title={isLastExercise ? "No hay más ejercicios" : "Siguiente ejercicio"}
            >
              <ChevronRight size={48} className="md:w-14 md:h-14" />
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modal de pantalla completa para dibujo */}
      <AnimatePresence>
        {isFullscreenDrawing && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop con blur - clickeable para cerrar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFullscreenDrawing(false)}
              className="absolute inset-0 backdrop-blur-lg"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
              }}
            />
            
            {/* Contenido del modal - Canvas en pantalla completa */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full h-full flex items-center justify-center p-4 z-10"
            >
              {/* Botón ROJO - Salir (X) - Esquina superior izquierda */}
              <motion.button
                onClick={() => setIsFullscreenDrawing(false)}
                className="absolute top-4 left-4 w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full shadow-[0_8px_25px_rgba(239,68,68,0.4)] border-4 border-white flex items-center justify-center z-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
                title="Salir"
              >
                <X size={32} className="text-white stroke-[4px] drop-shadow-md" />
              </motion.button>

              {/* Botón AZUL - Audio instrucciones - Esquina superior derecha */}
              <motion.button
                onClick={handleDrawingAudioClick}
                className={`absolute top-4 right-4 w-16 h-16 rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(59,130,246,0.4)] border-4 border-white transition-all z-50 ${
                  isSpeaking
                    ? "bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    : "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 }}
                title={isSpeaking ? "Detener audio" : "Escuchar instrucciones"}
              >
                {isSpeaking ? (
                  <>
                    <Square size={28} className="text-white" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-purple-400"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </>
                ) : (
                  <Volume2 size={32} className="text-white" />
                )}
              </motion.button>

              {/* Botón NARANJA - Rehacer dibujo - Esquina inferior izquierda */}
              <motion.button
                onClick={handleClearCanvas}
                className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 rounded-full shadow-[0_8px_25px_rgba(251,146,60,0.4)] border-4 border-white flex items-center justify-center z-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.5 }}
                title="Borrar y empezar de nuevo"
              >
                <RotateCcw size={32} className="text-white stroke-[3px] drop-shadow-md" />
              </motion.button>

              {/* Botón VERDE - Confirmar/Guardar - Esquina inferior derecha */}
              <motion.button
                onClick={() => {
                  // Aquí podrías guardar el dibujo antes de cerrar
                  setIsFullscreenDrawing(false);
                }}
                className="absolute bottom-4 right-4 w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full shadow-[0_8px_25px_rgba(34,197,94,0.4)] border-4 border-white flex items-center justify-center z-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.6 }}
                title="Guardar y continuar"
              >
                <Check size={40} className="text-white stroke-[4px] drop-shadow-md" />
                {/* Onda de expansión para llamar la atención */}
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-green-400"
                  animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
              </motion.button>

              {/* Contenedor del canvas - con padding para no tocar los botones */}
              <div className="relative w-[calc(100vw-8rem)] h-[calc(100vh-8rem)] max-w-full max-h-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={`/stub_images/${exercise?.img}`}
                    alt="ejercicio"
                    className="w-full h-full object-contain"
                  />
                  <DrawingCanvas
                    isActive={true}
                    backgroundImage={`/stub_images/${exercise?.img}`}
                    exerciseId={exercise?.title || ""}
                    exerciseTitle={parsedTitle || ""}
                    chapter={chapter}
                    subject={subject}
                    exerciseNumber={number || undefined}
                    onSave={handleSaveDrawing}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
