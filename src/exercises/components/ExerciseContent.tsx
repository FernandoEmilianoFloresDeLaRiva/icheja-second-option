import {
  ChevronLeft,
  ChevronRight,
  Square,
  Volume2,
  Maximize2,
  X,
  Check,
} from "lucide-react";
import ExerciseSelectImageO from "./ExcerciseSelectImageO/ExerciseSelectImageO";
import ExerciseSelectImageU from "./ExcerciseSelectImageU/ExcerciseSelectImageU";
import ExerciseHeader from "./ExerciseHeader/ExerciseHeader";
import ExerciseInstructions from "./ExerciseInstructions/ExerciseInstructions";
import { useExercises } from "../hooks/useExercises";
import { motion, AnimatePresence } from "framer-motion";
import { parseTitleExercises } from "../utils/parseTitleExercise";
import DrawingCanvas from "./DrawingCanvas/DrawingCanvas";
import { useState, useEffect } from "react";
import { useSpeech } from "../hooks/useSpeech";
import VowelCarouselGame from "./ExerciseTwentyFour/VowelCarouselGame";
import DragVowelExercise from "./DragVowelExercise/DragVowelExcercise";
import LetterSelectionGame from "./Select-letter/SelectLetter";
import LetterIdentificationGame from "./LetterIdentificationGame/LetterIdentificationGame";
import exercises from "../../../exercises.json";

interface ExerciseContentProps {
  unitId: number;
}

export default function ExerciseContent({ unitId }: ExerciseContentProps) {
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

  const [isFullscreenAudio, setIsFullscreenAudio] = useState(false);
  const [isFullscreenDrawing, setIsFullscreenDrawing] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);

  // Cerrar modales cuando cambia el ejercicio
  useEffect(() => {
    setIsFullscreenAudio(false);
    setIsFullscreenDrawing(false);
  }, [exercise?.title]);

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

  // Reproducir instrucciones cuando se abre el canvas de dibujo
  useEffect(() => {
    if (isFullscreenDrawing) {
      // 1. Instrucción principal al abrir (con pequeño delay)
      const mainInstructionTimer = setTimeout(() => {
        const voiceContent = `${exercise?.title}. ${exercise?.content.content}`;
        speak(voiceContent, {
          lang: "es-MX",
          rate: 0.9,
        });
      }, 500);
      
      // 2. Recordatorio periódico de cómo salir (empezando a los 15s para no interrumpir la principal)
      const reminderInterval = setInterval(() => {
        // Solo reproducir si sigue abierto el modal
        if (isFullscreenDrawing) {
          speak("Cuando termines de dibujar, presiona el botón verde con la palomita para salir.", {
            lang: "es-MX",
            rate: 0.9,
          });
        }
      }, 20000); // Repetir cada 20 segundos

      return () => {
        clearTimeout(mainInstructionTimer);
        clearInterval(reminderInterval);
        cancel(); // Cancelar audio al salir
      };
    }
  }, [isFullscreenDrawing, exercise?.title, exercise?.content.content, speak, cancel]);

  const handleSaveDrawing = (imageData: string) => {
    console.log("Dibujo guardado:", imageData);
  };

  const handleSpeakClick = () => {
    if (isSpeaking) {
      cancel();
    } else {
      const voiceContent = `${exercise?.title}. ${exercise?.content.content}`;
      speak(voiceContent, {
        lang: "es-MX",
        rate: 0.9,
      });
    }
  };

  const handleFullscreenAudioClick = () => {
    if (isSpeaking) {
      cancel();
    } else {
      const voiceContent = `${exercise?.title}. ${exercise?.content.content}`;
      speak(voiceContent, {
        lang: "es-MX",
        rate: 0.9,
      });
    }
  };

  // Calcular el total de ejercicios
  const totalExercises = exercises[0]?.content?.[validUnitId]?.exercise?.length || 0;
  const exerciseNumber = currentIndex + 1;

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
          {/* Indicador de progreso - Ultra compacto */}
          <div className="flex items-center gap-1.5 mb-1 flex-shrink-0 bg-white rounded-lg p-1.5 shadow-sm border border-gray-200">
            <div data-tour="progress-indicator" className="flex items-center gap-1.5">
              <div className="px-3 py-1 bg-gradient-to-r from-[#009887] to-[#00B8A9] text-white rounded-lg text-sm font-bold shadow-md min-w-[60px] text-center">
                {exerciseNumber}/{totalExercises}
              </div>
              <div className="w-[200px] h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#009887] to-[#00B8A9] rounded-full shadow-sm"
                  initial={{ width: 0 }}
                  animate={{ width: `${(exerciseNumber / totalExercises) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-600 whitespace-nowrap hidden lg:inline">
                Ejercicio {exerciseNumber} de {totalExercises}
              </span>
            </div>
          </div>

          {/* Layout principal: Header e Instrucciones a la izquierda, Contenido a la derecha */}
          <div className="flex-1 grid grid-cols-12 gap-1.5 min-h-0 overflow-hidden">
            {/* Columna izquierda: Header e Instrucciones */}
            <div className="col-span-12 md:col-span-5 flex flex-col gap-1 min-h-0">
              {/* Header del ejercicio - Grande y claro */}
              <div data-tour="exercise-header" className="bg-white rounded-xl shadow-md p-2 border-2 border-gray-200 flex-shrink-0">
                <ExerciseHeader
                  chapter={chapter}
                  subject={subject}
                  title={parsedTitle || ""}
                  number={number}
                />
              </div>

              {/* Instrucciones - Grande y clara para accesibilidad */}
              <div data-tour="exercise-instructions" className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md p-2.5 border-2 border-gray-200 flex-1 min-h-0 overflow-y-auto relative">
                {/* Botón de pantalla completa para audio - Grande para accesibilidad */}
                <motion.button
                  data-tour="fullscreen-audio-button"
                  onClick={() => setIsFullscreenAudio(true)}
                  className="absolute top-3 right-3 w-16 h-16 bg-gradient-to-br from-[#009887] to-[#00B8A9] text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all z-10 flex items-center justify-center border-2 border-white"
                  title="Escuchar instrucciones en pantalla completa"
                  aria-label="Abrir instrucciones en pantalla completa"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Maximize2 size={28} />
                </motion.button>
                <ExerciseInstructions
                  voiceContent={`${exercise?.title || ""}. ${exercise?.content?.content || ""}`}
                  subtitle={exercise?.content?.subtitle || ""}
                  content={exercise?.content?.content || ""}
                />
              </div>
            </div>

            {/* Columna derecha: Área de contenido/imagen - Misma altura que instrucciones */}
            <div className="col-span-12 md:col-span-7 flex flex-col min-h-0">
              <div data-tour="exercise-content-area" className="relative bg-gradient-to-br from-gray-50 to-gray-100 shadow-md rounded-xl p-2 flex-1 flex justify-center items-center border-2 border-gray-200 min-h-0">
            {/*SWICH CASE POR EJERCICIOS COPIADOS DE LA APP MOVIL*/}
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
                  return <LetterSelectionGame></LetterSelectionGame>;

                case 46:
                  return <ExerciseSelectImageO />;

                case 47:
                  return <ExerciseSelectImageU />;

                default:
                  return (
                    <>
                      <motion.img
                        src={`/stub_images/${exercise?.img}`}
                        alt={`Imagen del ejercicio: ${parsedTitle || exercise?.title}`}
                        className="max-h-[50%] max-w-[75%] w-auto h-auto object-contain rounded-xl shadow-lg cursor-pointer"
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
                        whileHover={!exercise?.isAudioExercise ? { scale: 1.05 } : {}}
                        whileTap={!exercise?.isAudioExercise ? { scale: 0.95 } : {}}
                        title={!exercise?.isAudioExercise ? "Toca la imagen para empezar a dibujar" : ""}
                      />

                      {exercise?.isAudioExercise && (
                        <motion.button
                          onClick={handleSpeakClick}
                          className={`absolute top-4 left-4 w-16 h-16 rounded-2xl transition-all z-50 shadow-xl border-2 flex items-center justify-center ${
                            isSpeaking
                              ? "bg-red-500 text-white hover:bg-red-600 border-red-600"
                              : "bg-white text-[#009887] hover:bg-gray-50 border-gray-400"
                          } hover:cursor-pointer`}
                          title={isSpeaking ? "Detener audio - Toca para parar" : "Escuchar instrucciones - Toca para oír"}
                          aria-label={isSpeaking ? "Detener audio" : "Escuchar instrucciones"}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isSpeaking ? (
                            <Square size={32} className="text-white" />
                          ) : (
                            <Volume2 size={32} className="text-[#009887]" />
                          )}
                        </motion.button>
                      )}
                    </>
                  );
              }
            })()}
              </div>
            </div>
          </div>

          {/* Footer con botones de navegación - Extendido por toda la pantalla - Grande para accesibilidad */}
          <div className="bg-white rounded-2xl shadow-lg p-2 border-2 border-gray-200 flex-shrink-0 mt-1">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <motion.div 
                className="flex items-center gap-2 flex-shrink-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.span 
                  className="text-2xl md:text-3xl"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  🎉
                </motion.span>
                <span className="font-bold text-base md:text-lg bg-gradient-to-r from-[#C90166] to-[#E91E63] bg-clip-text text-transparent whitespace-nowrap">
                  ¡Excelente trabajo!
                </span>
              </motion.div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.button
                  data-tour="nav-previous-button"
                  className="bg-gradient-to-r from-[#009887] to-[#00B8A9] hover:from-[#008577] hover:to-[#009887] disabled:from-gray-300 disabled:to-gray-400 hover:cursor-pointer disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:shadow-none text-base md:text-lg min-w-[120px] md:min-w-[140px] border-2 border-transparent hover:border-white"
                  disabled={isFirstExercise}
                  onClick={previousExercise}
                  title={isFirstExercise ? "No hay ejercicio anterior" : "Ir al ejercicio anterior"}
                  aria-label="Ejercicio anterior"
                  whileHover={!isFirstExercise ? { scale: 1.05 } : {}}
                  whileTap={!isFirstExercise ? { scale: 0.95 } : {}}
                >
                  <ChevronLeft size={24} className="md:w-7 md:h-7" />
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">Ant.</span>
                </motion.button>
                <motion.button
                  data-tour="nav-next-button"
                  className="bg-gradient-to-r from-[#009887] to-[#00B8A9] hover:from-[#008577] hover:to-[#009887] disabled:from-gray-300 disabled:to-gray-400 hover:cursor-pointer disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:shadow-none text-base md:text-lg min-w-[120px] md:min-w-[140px] border-2 border-transparent hover:border-white"
                  disabled={isLastExercise}
                  onClick={nextExercise}
                  title={isLastExercise ? "No hay más ejercicios" : "Ir al siguiente ejercicio"}
                  aria-label="Siguiente ejercicio"
                  whileHover={!isLastExercise ? { scale: 1.05 } : {}}
                  whileTap={!isLastExercise ? { scale: 0.95 } : {}}
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <span className="sm:hidden">Sig.</span>
                  <ChevronRight size={24} className="md:w-7 md:h-7" />
                </motion.button>
              </div>
            </div>
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
              {/* Botón de finalizar - Icono grande y claro para analfabetas */}
              <motion.button
                onClick={() => setIsFullscreenDrawing(false)}
                className="absolute bottom-6 right-6 w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full shadow-[0_8px_25px_rgba(34,197,94,0.4)] border-4 border-white flex items-center justify-center z-50 group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: 0.5 
                }}
              >
                <Check size={48} className="text-white stroke-[4px] drop-shadow-md" />
                
                {/* Onda de expansión para llamar la atención */}
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-green-400"
                  animate={{
                    scale: [1, 1.4, 1.4],
                    opacity: [0.6, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              </motion.button>

              {/* Botón grande de audio - para tablets y accesibilidad */}
              <motion.button
                onClick={handleSpeakClick}
                className={`absolute top-4 left-4 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all z-20 ${
                  isSpeaking
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-gradient-to-br from-[#009887] to-[#00B8A9] hover:from-[#008577] hover:to-[#009887] text-white"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                title={isSpeaking ? "Detener audio" : "Escuchar instrucciones"}
              >
                {isSpeaking ? (
                  <>
                    <Square size={40} />
                    {/* Onda de sonido animada */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-red-400"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.8, 0, 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </>
                ) : (
                  <Volume2 size={40} />
                )}
              </motion.button>

              {/* Contenedor del canvas en pantalla completa */}
              <div className="relative w-full h-full max-w-[95vw] max-h-[95vh] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-visible">
                <div className="relative w-full h-full overflow-hidden">
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

      {/* Modal de pantalla completa para audio */}
      <AnimatePresence>
        {isFullscreenAudio && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop con blur - clickeable para cerrar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsFullscreenAudio(false);
                if (isSpeaking) cancel();
              }}
              className="absolute inset-0 backdrop-blur-lg"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
              }}
            />
            
            {/* Contenido del modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col items-center justify-center gap-6 p-8 z-10"
            >
              {/* Botón de cerrar */}
              <motion.button
                onClick={() => {
                  setIsFullscreenAudio(false);
                  if (isSpeaking) cancel();
                }}
                className="absolute top-4 right-4 p-3 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 rounded-full transition-all backdrop-blur-sm shadow-lg border border-gray-200"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} />
              </motion.button>

              {/* Título */}
              <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4 drop-shadow-lg"
              >
                {exercise?.content.subtitle}
              </motion.h2>

              {/* Botón de audio grande */}
              <motion.button
                onClick={handleFullscreenAudioClick}
                className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                  isSpeaking
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-white hover:bg-gray-50"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                {isSpeaking ? (
                  <>
                    <Square size={64} className="text-red-600" />
                    {/* Onda de sonido animada */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-red-400"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.8, 0, 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </>
                ) : (
                  <Volume2 size={64} className="text-[#009887]" />
                )}
              </motion.button>

              {/* Texto de instrucción */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-800 text-lg md:text-xl text-center max-w-md px-4 font-semibold drop-shadow-md"
              >
                Toca el botón para escuchar las instrucciones
              </motion.p>

              {/* Instrucción completa (opcional, más pequeña) */}
              {exercise?.content.content && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 p-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-xl max-w-2xl shadow-xl border border-gray-200"
                >
                  <p className="text-gray-800 text-sm md:text-base text-center leading-relaxed font-medium">
                    {exercise.content.content}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
