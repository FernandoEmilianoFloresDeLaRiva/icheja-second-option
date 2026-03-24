import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeech } from "../../../exercises/hooks/useSpeech";
import handCursor from "../../../assets/images/splash/mano.png";

interface TourStep {
  id: string;
  title: string;
  description: string;
  selector: string;
  position: "top" | "bottom" | "left" | "right" | "center";
}

interface TourGuiadoProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  currentRoute?: string;
}

const EXERCISE_TOUR_STEPS: (TourStep & { audioText?: string })[] = [
  {
    id: "exercise-content-area",
    title: "Comienza aquí",
    description:
      "Toca la imagen para empezar a dibujar y trabajar en tu ejercicio.",
    selector: '[data-tour="exercise-content-area"]',
    position: "top",
    audioText: "Toca la imagen para empezar a dibujar y trabajar en tu ejercicio.",
  },
];

// Pasos del tour de welcome - Unidad 1 (primera vez)
const WELCOME_TOUR_UNIT_1: (TourStep & { audioText: string })[] = [
  {
    id: "unit-1",
    title: "Comienza aquí",
    description:
      "Toca esta unidad para empezar a trabajar con los ejercicios.",
    selector: '[data-tour="unit-1"]',
    position: "top",
    audioText: "Toca esta unidad para empezar a trabajar con los ejercicios.",
  },
];

// Pasos del tour de welcome - Unidad 2 (después de completar unidad 1)
const WELCOME_TOUR_UNIT_2: (TourStep & { audioText: string })[] = [
  {
    id: "unit-2",
    title: "Siguiente unidad",
    description:
      "Ahora puedes probar esta otra unidad con ejercicios diferentes.",
    selector: '[data-tour="unit-2"]',
    position: "top",
    audioText: "Muy bien. Ahora puedes probar esta otra unidad con ejercicios diferentes.",
  },
];

// Pasos del tour de welcome - Unidad 3 (después de completar unidad 2)
const WELCOME_TOUR_UNIT_3: (TourStep & { audioText: string })[] = [
  {
    id: "unit-3",
    title: "Continúa aprendiendo",
    description:
      "Sigue adelante con esta nueva unidad de ejercicios.",
    selector: '[data-tour="unit-3"]',
    position: "top",
    audioText: "Excelente trabajo. Continúa con esta nueva unidad de ejercicios.",
  },
];

// Pasos del tour de welcome - Navegación libre (después de completar unidad 3)
const WELCOME_TOUR_FREE_NAV: (TourStep & { audioText: string })[] = [
  {
    id: "free-nav",
    title: "¡Felicidades!",
    description:
      "Ya conoces las unidades. Ahora puedes navegar libremente y explorar todas las unidades disponibles.",
    selector: '[data-tour="units-grid"]',
    position: "center",
    audioText: "¡Felicidades! Ya conoces las primeras unidades. Ahora puedes navegar libremente y explorar todas las unidades disponibles a tu ritmo.",
  },
];

export default function TourGuiado({ isActive, onComplete, currentRoute = "" }: TourGuiadoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elementPosition, setElementPosition] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef<number>(0);
  const { speak, cancel } = useSpeech();
  const hasSpokenRef = useRef(false);
  const previousStepRef = useRef<number>(-1);
  
  // Detectar si ya visitó las unidades
  const hasVisitedUnit1 = sessionStorage.getItem('visited-unit-1') === 'true';
  const hasVisitedUnit2 = sessionStorage.getItem('visited-unit-2') === 'true';
  const hasVisitedUnit3 = sessionStorage.getItem('visited-unit-3') === 'true';

  // Determinar si es el tour de welcome o de ejercicios
  // Verificar también los query params para detectar /units?unitId=X
  const urlParams = new URLSearchParams(window.location.search);
  const hasUnitId = urlParams.has("unitId");
  const isWelcomeTour = currentRoute === "/welcome";
  const isExerciseTour = currentRoute === "/units" || (currentRoute?.startsWith("/exercise") ?? false) || (currentRoute === "/units" && hasUnitId);

  // Construir los pasos del tour dinámicamente
  const TOUR_STEPS = useMemo(() => {
    // Si no es welcome, es tour de ejercicios
    if (!isWelcomeTour) {
      // Para ejercicios, usar EXERCISE_TOUR_STEPS
      return EXERCISE_TOUR_STEPS;
    }
    
    // Para welcome, elegir según el progreso del usuario
    if (hasVisitedUnit3) {
      // Ya visitó las 3 unidades, mostrar navegación libre
      return WELCOME_TOUR_FREE_NAV;
    }
    if (hasVisitedUnit2) {
      // Ya visitó unidad 2, mostrar unidad 3
      return WELCOME_TOUR_UNIT_3;
    }
    if (hasVisitedUnit1) {
      // Ya visitó unidad 1, mostrar unidad 2
      return WELCOME_TOUR_UNIT_2;
    }
    // Primera vez, mostrar unidad 1
    return WELCOME_TOUR_UNIT_1;
  }, [isWelcomeTour, hasVisitedUnit1, hasVisitedUnit2, hasVisitedUnit3]);

  // Disparar evento cuando cambia el paso del tour para que los componentes sepan en qué paso estamos
  // Este useEffect debe ejecutarse ANTES de que se busque el elemento
  useEffect(() => {
    if (isActive) {
      const step = TOUR_STEPS[currentStep];
      const stepId = step?.id || null;
      // Disparar el evento INMEDIATAMENTE cuando cambia el paso
      // Esto permite que los componentes agreguen/remuevan atributos antes de que el tour busque el elemento
      window.dispatchEvent(new CustomEvent('tour-step-changed', { 
        detail: { stepId, currentStep, totalSteps: TOUR_STEPS.length } 
      }));
      // También disparar después de un pequeño delay para asegurar que se actualice
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tour-step-changed', { 
          detail: { stepId, currentStep, totalSteps: TOUR_STEPS.length } 
        }));
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Disparar evento para indicar que el tour se desactivó
      window.dispatchEvent(new CustomEvent('tour-step-changed', { 
        detail: { stepId: null, currentStep: -1, totalSteps: 0 } 
      }));
    }
  }, [currentStep, isActive, TOUR_STEPS]);

  // Actualizar continuamente la posición del elemento para unit-1, unit-2, unit-3 y exercise-content-area para que el spotlight siga al pulso
  useEffect(() => {
    const stepData = TOUR_STEPS[currentStep];
    if (!isActive || (stepData?.id !== "unit-1" && stepData?.id !== "unit-2" && stepData?.id !== "unit-3" && stepData?.id !== "exercise-content-area")) return;

    let animationFrameId: number;
    
    const updatePositionContinuously = () => {
      const step = TOUR_STEPS[currentStep];
      if (!step) return;

      const element = document.querySelector(step.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setElementPosition(rect);
        }
      }
      
      animationFrameId = requestAnimationFrame(updatePositionContinuously);
    };

    updatePositionContinuously();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, currentStep, TOUR_STEPS]);

  useEffect(() => {
    if (!isActive) {
      setElementPosition(null);
      return;
    }

    const updateElementPosition = () => {
      const step = TOUR_STEPS[currentStep];
      if (!step) return;

      // Para el paso de unidad 1, 2 o 3, esperar más tiempo para que el atributo se agregue dinámicamente
      if (step.id === "unit-1" || step.id === "unit-2" || step.id === "unit-3") {
        // Dar más tiempo para que el evento se dispare y el atributo se agregue al DOM
        const checkElement = () => {
          const element = document.querySelector(step.selector);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              retryCountRef.current = 0;
              setElementPosition(rect);
            } else {
              // Si no tiene dimensiones, intentar de nuevo (máximo 10 intentos)
              if (retryCountRef.current < 10) {
                retryCountRef.current += 1;
                setTimeout(checkElement, 300);
              }
            }
          } else {
            // Si no se encuentra, intentar de nuevo (máximo 10 intentos)
            if (retryCountRef.current < 10) {
              retryCountRef.current += 1;
              setTimeout(checkElement, 300);
            }
          }
        };
        
        // Esperar más tiempo para que el evento se dispare y el atributo se agregue
        setTimeout(checkElement, 600);
        return;
      }

      // Intentar encontrar el elemento con un pequeño retraso para asegurar que el DOM esté listo
      // Soportar múltiples selectores (ej: '[data-tour="btn1"], [data-tour="btn2"]') para abarcar ambos
      let rect: DOMRect;
      
      if (step.selector.includes(',')) {
        // Si hay múltiples selectores, encontrar todos y calcular bounding box combinado
        const selectors = step.selector.split(',').map(s => s.trim());
        const elements = selectors.map(sel => document.querySelector(sel)).filter(el => el !== null) as Element[];
        
        if (elements.length > 0) {
          const rects = elements.map(el => el.getBoundingClientRect());
          // Calcular bounding box que abarque todos los elementos
          const minTop = Math.min(...rects.map(r => r.top));
          const minLeft = Math.min(...rects.map(r => r.left));
          const maxBottom = Math.max(...rects.map(r => r.bottom));
          const maxRight = Math.max(...rects.map(r => r.right));
          
          rect = {
            top: minTop,
            left: minLeft,
            bottom: maxBottom,
            right: maxRight,
            width: maxRight - minLeft,
            height: maxBottom - minTop,
            x: minLeft,
            y: minTop,
            toJSON: () => ({})
          } as DOMRect;
        } else {
          // Si no se encuentran elementos, intentar de nuevo
          const maxRetries = 20;
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            setTimeout(updateElementPosition, 200);
          }
          return;
        }
      } else {
        // Si es un único selector, usar querySelector normalmente
        const element = document.querySelector(step.selector);
        if (!element) {
          // Si no se encuentra, intentar de nuevo
          const maxRetries = 20;
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            setTimeout(updateElementPosition, 200);
          }
          return;
        }
        rect = element.getBoundingClientRect();
      }
      
      // Verificar que el elemento tenga dimensiones válidas
      if (rect.width > 0 && rect.height > 0) {
        retryCountRef.current = 0; // Resetear contador cuando se encuentra el elemento
        setElementPosition(rect);
      } else {
        // Si no tiene dimensiones, intentar de nuevo en el siguiente frame
        requestAnimationFrame(updateElementPosition);
      }
    };
    
    // Resetear contador de reintentos cuando cambia el paso
    retryCountRef.current = 0;

    // Determinar el delay inicial según el tipo de paso y tour
    let initialDelay = 500;
    if (TOUR_STEPS[currentStep]?.id === "unit-1" || TOUR_STEPS[currentStep]?.id === "unit-2" || TOUR_STEPS[currentStep]?.id === "unit-3") {
      initialDelay = 800;
    } else if (isExerciseTour && currentStep === 0) {
      // Para el primer paso del tour de ejercicios, dar más tiempo para la transición de página
      initialDelay = 1000;
    }
    
    // Esperar un momento para que el DOM se renderice completamente
    const timer = setTimeout(updateElementPosition, initialDelay);
    
    // Para el tour de ejercicios, recalcular después de un delay adicional para asegurar estabilidad
    let recalculateTimer: ReturnType<typeof setTimeout> | null = null;
    if (isExerciseTour) {
      recalculateTimer = setTimeout(updateElementPosition, initialDelay + 500);
    }

    window.addEventListener("resize", updateElementPosition);
    window.addEventListener("scroll", updateElementPosition, true);

    return () => {
      clearTimeout(timer);
      if (recalculateTimer) {
        clearTimeout(recalculateTimer);
      }
      window.removeEventListener("resize", updateElementPosition);
      window.removeEventListener("scroll", updateElementPosition, true);
    };
  }, [currentStep, isActive, isExerciseTour, TOUR_STEPS]);

  // Resetear el estado cuando el tour se desactiva
  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      retryCountRef.current = 0;
      setElementPosition(null);
      hasSpokenRef.current = false;
      previousStepRef.current = -1;
      // Disparar evento para indicar que el tour se desactivó
      window.dispatchEvent(new CustomEvent('tour-step-changed', { 
        detail: { stepId: null, currentStep: -1, totalSteps: 0 } 
      }));
      cancel(); // Solo cancelar cuando se desactiva completamente el tour
    } else if (isActive && (isWelcomeTour || isExerciseTour)) {
      // Cuando el tour se activa, disparar el evento inmediatamente con el paso actual
      const step = TOUR_STEPS[currentStep];
      window.dispatchEvent(new CustomEvent('tour-step-changed', { 
        detail: { stepId: step?.id || null, currentStep, totalSteps: TOUR_STEPS.length } 
      }));
    }
  }, [isActive, cancel, isWelcomeTour, isExerciseTour, currentStep, TOUR_STEPS]);
  
  // Ya no necesitamos este useEffect - las variables hasNavigatedRight y hasNavigatedLeft se resetean en el useEffect de audio
  
  // Cancelar audio cuando cambia el paso (solo si realmente cambió y el paso anterior no era -1)
  useEffect(() => {
    // Solo cancelar si cambiamos de un paso válido a otro (no en la inicialización)
    if (isActive && (isWelcomeTour || isExerciseTour) && previousStepRef.current !== currentStep && previousStepRef.current >= 0) {
      cancel();
    }
    previousStepRef.current = currentStep;
  }, [currentStep, isActive, isWelcomeTour, isExerciseTour, cancel]);

  // Escuchar eventos de clic en las unidades
  useEffect(() => {
    if (!isActive || !isWelcomeTour) return;
    
    const step = TOUR_STEPS[currentStep] as TourStep & { audioText?: string };
    if (step?.id !== "unit-1" && step?.id !== "unit-2" && step?.id !== "unit-3") return;

    // El tour se activará automáticamente al navegar a la página de ejercicios
    // No necesitamos hacer nada especial aquí, solo permitir que la navegación ocurra normalmente
  }, [currentStep, isActive, isWelcomeTour, TOUR_STEPS]);

  // Reproducir audio automáticamente cuando cambia el paso (para welcome y ejercicios)
  useEffect(() => {
    if (!isActive || (!isWelcomeTour && !isExerciseTour)) return;
    
    const step = TOUR_STEPS[currentStep] as TourStep & { audioText?: string };
    if (!step || !step.audioText) return;

    // Variable para controlar si ya se reprodujo el audio (evitar duplicados)
    let audioPlayed = false;

    // Función para reproducir el audio
    const playAudio = () => {
      // Solo reproducir si no se ha reproducido ya
      if (audioPlayed) return;
      audioPlayed = true;

      hasSpokenRef.current = false;
      const currentStepWhenSpeaking = currentStep; // Capturar el paso actual
      
      // Solo reproducir audio si hay audioText disponible
      if (step.audioText) {
        speak(step.audioText, {
          onEnd: () => {
            hasSpokenRef.current = true;
            // Para el paso de unidad 1, 2 o 3, NO avanzar automáticamente - esperar a que el usuario haga clic
            if (step.id === "unit-1" || step.id === "unit-2" || step.id === "unit-3") {
              // El tour avanzará automáticamente cuando el usuario haga clic en la unidad
              return;
            }
            
            // Si es el último paso, cerrar el tour automáticamente cuando termine el audio
            if (currentStepWhenSpeaking === TOUR_STEPS.length - 1) {
              setTimeout(() => {
                // Verificar que todavía estamos en el último paso antes de cerrar
                if (currentStepWhenSpeaking === TOUR_STEPS.length - 1) {
                  onComplete();
                }
              }, 500);
              return;
            }
            
            // Avanzar automáticamente al siguiente paso cuando termine el audio
            // Solo si no se ha avanzado manualmente y todavía estamos en el mismo paso
            if (currentStepWhenSpeaking < TOUR_STEPS.length - 1) {
              setTimeout(() => {
                setCurrentStep((prev) => {
                  // Solo avanzar si todavía estamos en el mismo paso que cuando empezó el audio
                  if (prev === currentStepWhenSpeaking) {
                    return prev + 1;
                  }
                  return prev;
                });
              }, 500);
            }
          },
        });
      } else {
        // Si no hay audio, marcar como hablado inmediatamente
        hasSpokenRef.current = true;
      }
    };

    // Reproducir audio directamente después de un delay
    // Ya no verificamos si el elemento existe porque eso puede fallar
    const timer = setTimeout(() => {
      playAudio();
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [currentStep, isActive, speak, TOUR_STEPS, onComplete, isWelcomeTour, isExerciseTour]);

  if (!isActive) {
    return null;
  }

  const currentStepData = TOUR_STEPS[currentStep];

  // Calcular el spotlight mejorado - usar forma elíptica/rectangular que se ajuste al elemento
  const getSpotlightShape = () => {
    if (!elementPosition) return null;

    const padding = (currentStepData?.id === "unit-1" || currentStepData?.id === "unit-2" || currentStepData?.id === "unit-3" || currentStepData?.id === "exercise-content-area") ? 25 : 20;
    const minSize = 100; // Tamaño mínimo para elementos muy pequeños
    
    // Para el paso de navigation-buttons, siempre usar rectángulo que encierre ambos botones
    if (currentStepData?.id === "navigation-buttons") {
      return {
        type: 'rect' as const,
        x: elementPosition.left - padding,
        y: elementPosition.top - padding,
        width: elementPosition.width + padding * 2,
        height: elementPosition.height + padding * 2,
        rx: 16, // Radio de esquinas redondeadas
      };
    }

    // Para el paso de unit-1, unit-2 o unit-3, siempre usar rectángulo con border-radius similar a la tarjeta
    if (currentStepData?.id === "unit-1" || currentStepData?.id === "unit-2" || currentStepData?.id === "unit-3") {
      return {
        type: 'rect' as const,
        x: elementPosition.left - padding,
        y: elementPosition.top - padding,
        width: elementPosition.width + padding * 2,
        height: elementPosition.height + padding * 2,
        rx: 20, // Radio similar al de las tarjetas (rounded-2xl = 16px, agregamos un poco más)
      };
    }

    // Para el paso de exercise-content-area, usar rectángulo con border-radius
    if (currentStepData?.id === "exercise-content-area") {
      return {
        type: 'rect' as const,
        x: elementPosition.left - padding,
        y: elementPosition.top - padding,
        width: elementPosition.width + padding * 2,
        height: elementPosition.height + padding * 2,
        rx: 16, // Radio para el área de contenido
      };
    }

    // Para elementos pequeños (botones, iconos), usar círculo más grande
    // Para elementos grandes (áreas), usar forma rectangular/elíptica
    const isSmallElement = elementPosition.width < 150 || elementPosition.height < 150;
    
    if (isSmallElement) {
      // Para elementos pequeños: círculo centrado con radio más generoso
      const radius = Math.max(
        Math.max(elementPosition.width, elementPosition.height) / 2 + padding * 2,
        minSize
      );
      return {
        type: 'circle' as const,
        cx: elementPosition.left + elementPosition.width / 2,
        cy: elementPosition.top + elementPosition.height / 2,
        r: radius,
      };
    } else {
      // Para elementos grandes: rectángulo redondeado que se ajusta al elemento
      return {
        type: 'rect' as const,
        x: elementPosition.left - padding,
        y: elementPosition.top - padding,
        width: elementPosition.width + padding * 2,
        height: elementPosition.height + padding * 2,
        rx: 12, // Radio de esquinas redondeadas
      };
    }
  };

  const spotlightShape = getSpotlightShape();

  return (
    <AnimatePresence>
      {isActive && (
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
        style={{ pointerEvents: "none" }}
      >
        {/* Overlay oscuro con spotlight mejorado usando SVG */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            <mask id={`spotlight-mask-${currentStep}`}>
              {/* Todo el fondo es blanco (visible) */}
              <rect width="100%" height="100%" fill="white" />
              {/* El spotlight es negro (transparente/invisible) */}
              {(() => {
                if (!spotlightShape) return null;
                if (spotlightShape.type === 'circle') {
                  const { cx, cy, r } = spotlightShape as any;
                  return <circle cx={cx} cy={cy} r={r} fill="black" />;
                } else {
                  const { x, y, width, height, rx } = spotlightShape as any;
                  return <rect x={x} y={y} width={width} height={height} rx={rx} fill="black" />;
                }
              })()}
            </mask>
          </defs>
          
          {/* Overlay oscuro con máscara - solo esto, sin colores adicionales */}
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.30)"
            mask={`url(#spotlight-mask-${currentStep})`}
            style={{ mixBlendMode: "normal" }}
          />
        </svg>

        {/* Manita apuntando al elemento (para unit-1, unit-2 y unit-3) */}
        {spotlightShape && (TOUR_STEPS[currentStep]?.id === "unit-1" || TOUR_STEPS[currentStep]?.id === "unit-2" || TOUR_STEPS[currentStep]?.id === "unit-3") && spotlightShape.type === 'rect' && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: 20 }}
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
            className="absolute pointer-events-none drop-shadow-lg"
            style={{
              // Posicionar relativo al spotlight rectangular
              left: (spotlightShape as any).x + (spotlightShape as any).width - 20, // Ajustado para que apunte
              top: (spotlightShape as any).y + (spotlightShape as any).height - 20, // Ajustado para que apunte
              filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.3))"
            }}
          >
            <img
              src={handCursor}
              alt="Click aquí"
              className="w-35 h-35 object-contain rotate-[-15deg]"
            />
          </motion.div>
        )}
      </motion.div>
      )}
    </AnimatePresence>
  );
}
