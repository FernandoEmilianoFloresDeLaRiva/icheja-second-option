import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { theme } from "../../../core/config/theme";
import { useSpeech } from "../../../exercises/hooks/useSpeech";

// Función auxiliar para calcular dimensiones responsivas según viewport
function getResponsiveDimensions() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Detectar si está en landscape (ancho > alto)
  const isLandscape = viewportWidth > viewportHeight;
  
  // Calcular tamaños dinámicos basados en viewport
  // Para tablets landscape: tooltip más flexible
  let tooltipWidth = Math.min(400, viewportWidth * 0.35);
  let tooltipHeight = Math.min(280, viewportHeight * 0.6);
  let tooltipOffset = Math.max(15, Math.min(30, viewportWidth * 0.02));
  let padding = Math.max(10, Math.min(20, viewportWidth * 0.03));
  
  // Ajustes adicionales para landscape (menos altura, más ancho)
  if (isLandscape && viewportHeight < 600) {
    tooltipHeight = Math.min(240, viewportHeight * 0.5);
    tooltipOffset = Math.max(12, tooltipOffset);
    padding = Math.max(8, padding);
  }
  
  return { tooltipWidth, tooltipHeight, tooltipOffset, padding, isLandscape };
}

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
    id: "back-button",
    title: "Botón Volver",
    description:
      "Usa este botón para regresar a la página de unidades y seleccionar otra unidad de aprendizaje.",
    selector: '[data-tour="back-button"]',
    position: "bottom",
    audioText: "Usa este botón para regresar a la página de unidades y seleccionar otra unidad de aprendizaje.",
  },
  {
    id: "progress-indicator",
    title: "Indicador de Progreso",
    description:
      "Aquí puedes ver en qué ejercicio estás y cuántos ejercicios tiene esta unidad. La barra muestra tu progreso visualmente.",
    selector: '[data-tour="progress-indicator"]',
    position: "bottom",
    audioText: "Aquí puedes ver en qué ejercicio estás y cuántos ejercicios tiene esta unidad. La barra muestra tu progreso visualmente.",
  },
  {
    id: "exercise-header",
    title: "Información del Ejercicio",
    description:
      "Aquí verás el título del ejercicio, el número y la información de la unidad y materia que estás estudiando.",
    selector: '[data-tour="exercise-header"]',
    position: "bottom",
    audioText: "Aquí verás el título del ejercicio, el número y la información de la unidad y materia que estás estudiando.",
  },
  {
    id: "exercise-instructions",
    title: "Instrucciones",
    description:
      "Lee las instrucciones aquí. Puedes hacer clic en el botón de audio para escuchar las instrucciones, o usar el botón de pantalla completa para una mejor experiencia de audio.",
    selector: '[data-tour="exercise-instructions"]',
    position: "right",
    audioText: "Lee las instrucciones aquí. Puedes hacer clic en el botón de audio para escuchar las instrucciones, o usar el botón de pantalla completa para una mejor experiencia de audio.",
  },
  {
    id: "fullscreen-audio-button",
    title: "Audio en Pantalla Completa",
    description:
      "Toca este botón para escuchar las instrucciones en pantalla completa. Es muy útil si olvidaste qué hacer o quieres escuchar las instrucciones con más claridad.",
    selector: '[data-tour="fullscreen-audio-button"]',
    position: "left",
    audioText: "Toca este botón para escuchar las instrucciones en pantalla completa. Es muy útil si olvidaste qué hacer o quieres escuchar las instrucciones con más claridad.",
  },
  {
    id: "exercise-content-area",
    title: "Área de Trabajo",
    description:
      "Aquí verás la imagen o contenido del ejercicio. Puedes interactuar con ella según el tipo de ejercicio.",
    selector: '[data-tour="exercise-content-area"]',
    position: "top",
    audioText: "Aquí verás la imagen o contenido del ejercicio. Puedes interactuar con ella según el tipo de ejercicio.",
  },
  {
    id: "drawing-button",
    title: "Modo Dibujo",
    description:
      "Activa este botón para dibujar sobre la imagen del ejercicio. Úsalo para completar actividades que requieren dibujar o colorear.",
    selector: '[data-tour="drawing-button"]',
    position: "right",
    audioText: "Activa este botón para dibujar sobre la imagen del ejercicio. Úsalo para completar actividades que requieren dibujar o colorear.",
  },
  {
    id: "fullscreen-drawing-button",
    title: "Dibujar en Pantalla Completa",
    description:
      "Toca este botón para dibujar en pantalla completa. Esto te dará más espacio y precisión para tus dibujos.",
    selector: '[data-tour="fullscreen-drawing-button"]',
    position: "left",
    audioText: "Toca este botón para dibujar en pantalla completa. Esto te dará más espacio y precisión para tus dibujos.",
  },
  {
    id: "navigation-buttons",
    title: "Navegación",
    description:
      "Usa estos botones para ir al ejercicio anterior o siguiente. El botón se desactiva cuando estás en el primer o último ejercicio.",
    selector: '[data-tour="nav-previous-button"], [data-tour="nav-next-button"]',
    position: "left",
    audioText: "Usa estos botones para ir al ejercicio anterior o siguiente. El botón se desactiva cuando estás en el primer o último ejercicio.",
  },
];

// Pasos base del tour de welcome (sin el paso de navegación)
const BASE_WELCOME_TOUR_STEPS: (TourStep & { audioText: string })[] = [
  {
    id: "units-grid",
    title: "Unidades de Aprendizaje",
    description:
      "Aquí verás todas las unidades disponibles. Haz clic en cualquier unidad para comenzar sus ejercicios. Puedes navegar entre páginas si hay muchas unidades.",
    selector: '[data-tour="units-grid"]',
    position: "top",
    audioText: "Aquí verás todas las unidades disponibles. Haz clic en cualquier unidad para comenzar sus ejercicios. Puedes navegar entre páginas si hay muchas unidades.",
  },
];

export default function TourGuiado({ isActive, onComplete, onSkip, currentRoute = "" }: TourGuiadoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elementPosition, setElementPosition] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isTooltipReady, setIsTooltipReady] = useState(false);
  const [tooltipDimensions, setTooltipDimensions] = useState(getResponsiveDimensions());
  const overlayRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef<number>(0);
  const { speak, cancel, isSpeaking } = useSpeech();
  const hasSpokenRef = useRef(false);
  const previousStepRef = useRef<number>(-1);
  const [hasMoreThan6Units, setHasMoreThan6Units] = useState(false);
  const [hasNavigatedRight, setHasNavigatedRight] = useState(false);
  const [hasNavigatedLeft, setHasNavigatedLeft] = useState(false);

  // Resetear isTooltipReady cuando cambia el paso
  useEffect(() => {
    setIsTooltipReady(false);
  }, [currentStep]);

  // Listener para cambios de orientación y resize para actualizar dimensiones responsivas
  useEffect(() => {
    const handleOrientationChange = () => {
      // Retrasar el cálculo para que el navegador termine de cambiar las dimensiones
      setTimeout(() => {
        setTooltipDimensions(getResponsiveDimensions());
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Determinar si es el tour de welcome o de ejercicios
  // Verificar también los query params para detectar /units?unitId=X
  const urlParams = new URLSearchParams(window.location.search);
  const hasUnitId = urlParams.has("unitId");
  const isWelcomeTour = currentRoute === "/welcome";
  const isExerciseTour = currentRoute === "/units" || (currentRoute?.startsWith("/exercise") ?? false) || (currentRoute === "/units" && hasUnitId);

  // Construir los pasos del tour dinámicamente según si hay más de 6 unidades
  const TOUR_STEPS = useMemo(() => {
    // Si no es welcome, es tour de ejercicios
    if (!isWelcomeTour) {
      // Para ejercicios, usar EXERCISE_TOUR_STEPS que ya incluye Alfi
      return EXERCISE_TOUR_STEPS;
    }
    
    const steps = [...BASE_WELCOME_TOUR_STEPS];
    
    // Si hay más de 6 unidades, agregar los pasos de navegación (primero derecha, luego izquierda)
    if (hasMoreThan6Units) {
      steps.push({
        id: "nav-arrow-right",
        title: "Navegar hacia adelante",
        description:
          "Haz clic en esta flecha para ver más unidades hacia adelante. Esto te permitirá explorar todas las unidades disponibles.",
        selector: '[data-tour="nav-arrow-right"]',
        position: "left", // Tooltip a la izquierda de la flecha
        audioText: "Haz clic en esta flecha para ver más unidades hacia adelante. Esto te permitirá explorar todas las unidades disponibles.",
      });
      steps.push({
        id: "nav-arrow-left",
        title: "Navegar hacia atrás",
        description:
          "Haz clic en esta flecha para volver a las unidades anteriores. Puedes navegar libremente entre todas las páginas de unidades.",
        selector: '[data-tour="nav-arrow-left"]',
        position: "right", // Tooltip a la derecha de la flecha
        audioText: "Haz clic en esta flecha para volver a las unidades anteriores. Puedes navegar libremente entre todas las páginas de unidades.",
      });
    }
    
    // Agregar paso para hacer clic en la unidad 1
    steps.push({
      id: "unit-1",
      title: "Selecciona la Unidad 1",
      description:
        "Haz clic en la Unidad 1 para comenzar tus ejercicios. Te guiaré a través de los ejercicios de esta unidad.",
      selector: '[data-tour="unit-1"]',
      position: "top",
      audioText: "Haz clic en la Unidad 1 para comenzar tus ejercicios. Te guiaré a través de los ejercicios de esta unidad.",
    });
    
    return steps;
  }, [currentRoute, hasMoreThan6Units]);

  // Verificar si hay más de 6 unidades para mostrar el paso de navegación
  useEffect(() => {
    if (!isActive || !isWelcomeTour) return;
    
    const checkUnits = () => {
      // Verificar si hay flechas de navegación visibles (solo aparecen si hay más de 6 unidades)
      const navArrows = document.querySelectorAll('[data-tour="nav-arrow-left"], [data-tour="nav-arrow-right"]');
      const hasArrows = navArrows.length > 0 && Array.from(navArrows).some(arrow => {
        const style = window.getComputedStyle(arrow);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
      setHasMoreThan6Units(hasArrows);
    };

    // Verificar inmediatamente y después de un delay para dar tiempo a que se renderice
    checkUnits();
    const timer = setTimeout(checkUnits, 1000);
    const interval = setInterval(checkUnits, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isActive, isWelcomeTour, currentStep]);

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

  useEffect(() => {
    if (!isActive) {
      setElementPosition(null);
      return;
    }

    const updateElementPosition = () => {
      const step = TOUR_STEPS[currentStep];
      if (!step) return;

      // Para el paso de unidad 1, esperar más tiempo para que el atributo se agregue dinámicamente
      if (step.id === "unit-1") {
        // Dar más tiempo para que el evento se dispare y el atributo se agregue al DOM
        const checkElement = () => {
          const element = document.querySelector(step.selector);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              retryCountRef.current = 0;
              setElementPosition(rect);
              // Calcular posición del tooltip con validación de límites
              const { tooltipWidth, padding } = tooltipDimensions;
              const viewportWidth = window.innerWidth;
              
              let top = 0;
              let left = 0;

              // Para unit-1, posicionar en la parte superior de la pantalla, bien separado de la tarjeta
              top = Math.max(padding, 80); // Posición fija cerca del top del viewport
              left = rect.left + rect.width / 2;
              left = Math.max(padding + tooltipWidth / 2, left);
              left = Math.min(viewportWidth - tooltipWidth / 2 - padding, left);

              setTooltipPosition({ top, left });
              setIsTooltipReady(true);
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

        // Calcular posición del tooltip según la posición especificada
        const { tooltipOffset, tooltipWidth, tooltipHeight, padding } = tooltipDimensions;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let top = 0;
        let left = 0;

        switch (step.position) {
          case "top":
            top = Math.max(padding, rect.top - tooltipHeight - tooltipOffset);
            left = rect.left + rect.width / 2;
            // Asegurar que no se salga por la izquierda
            left = Math.max(padding + tooltipWidth / 2, left);
            // Asegurar que no se salga por la derecha
            left = Math.min(viewportWidth - tooltipWidth / 2 - padding, left);
            break;
          case "bottom":
            top = rect.bottom + tooltipOffset;
            // Si se sale por abajo, ponerlo arriba del elemento
            if (top + tooltipHeight > viewportHeight - padding) {
              top = Math.max(padding, rect.top - tooltipHeight - tooltipOffset);
            }
            left = rect.left + rect.width / 2;
            // Asegurar que no se salga por los lados
            left = Math.max(padding + tooltipWidth / 2, left);
            left = Math.min(viewportWidth - tooltipWidth / 2 - padding, left);
            break;
          case "left":
            top = rect.top + rect.height / 2;
            // Para el paso de navegación, mover el tooltip más arriba para que no se salga de pantalla
            if (step.id === "navigation-buttons") {
              top = rect.top - tooltipHeight / 2 - 30; // Posicionar más arriba del centro del elemento
            }
            // Para el paso de Alfi, mover el tooltip más a la izquierda
            const extraLeftOffset = step.id === "alfi" ? 50 : 0;
            left = Math.max(padding, rect.left - tooltipWidth - tooltipOffset - extraLeftOffset);
            // Si se sale por la izquierda, ponerlo a la derecha
            if (left < padding) {
              left = Math.min(viewportWidth - tooltipWidth - padding, rect.right + tooltipOffset);
            }
            // Asegurar que no se salga por arriba/abajo
            if (top - tooltipHeight / 2 < padding) {
              top = padding + tooltipHeight / 2;
            }
            if (top + tooltipHeight / 2 > viewportHeight - padding) {
              top = viewportHeight - tooltipHeight / 2 - padding;
            }
            break;
          case "right":
            top = rect.top + rect.height / 2;
            left = Math.min(
              viewportWidth - tooltipWidth - padding,
              rect.right + tooltipOffset
            );
            // Si se sale por la derecha, ponerlo a la izquierda
            if (left + tooltipWidth > viewportWidth - padding) {
              left = Math.max(padding, rect.left - tooltipWidth - tooltipOffset);
            }
            // Asegurar que no se salga por arriba/abajo
            if (top - tooltipHeight / 2 < padding) {
              top = padding + tooltipHeight / 2;
            }
            if (top + tooltipHeight / 2 > viewportHeight - padding) {
              top = viewportHeight - tooltipHeight / 2 - padding;
            }
            break;
          case "center":
            // Para el paso de navegación, colocar el tooltip en la parte inferior central
            // pero asegurar que quede dentro de la pantalla
            top = Math.min(
              viewportHeight - tooltipHeight - padding,
              Math.max(padding, viewportHeight - 300)
            );
            left = Math.max(
              padding + tooltipWidth / 2,
              Math.min(viewportWidth - tooltipWidth / 2 - padding, viewportWidth / 2)
            );
            break;
        }

        setTooltipPosition({ top, left });
        setIsTooltipReady(true);
      } else {
        // Si no tiene dimensiones, intentar de nuevo en el siguiente frame
        requestAnimationFrame(updateElementPosition);
      }
    };
    
    // Resetear contador de reintentos cuando cambia el paso
    retryCountRef.current = 0;

    // Determinar el delay inicial según el tipo de paso y tour
    let initialDelay = 500;
    if (TOUR_STEPS[currentStep]?.id === "unit-1") {
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
  }, [currentStep, isActive, tooltipDimensions, isExerciseTour]);

  const handleNext = () => {
    // Cancelar el audio si está reproduciéndose
    if (isSpeaking) {
      cancel();
    }
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = useCallback(() => {
    // Simplemente llamar al callback para ocultar el tour
    // El tour se activará automáticamente al navegar a otras páginas
    onComplete();
  }, [onComplete]);

  const handleSkip = () => {
    // El localStorage se maneja en AppLayout para evitar duplicados
    // Solo llamar al callback
    onSkip();
  };

  // Resetear el estado cuando el tour se desactiva
  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      retryCountRef.current = 0;
      setElementPosition(null);
      hasSpokenRef.current = false;
      previousStepRef.current = -1;
      setHasNavigatedRight(false);
      setHasNavigatedLeft(false);
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

  // Escuchar eventos de clic en la unidad 1
  useEffect(() => {
    if (!isActive || !isWelcomeTour) return;
    
    const step = TOUR_STEPS[currentStep] as TourStep & { audioText?: string };
    if (step?.id !== "unit-1") return;

    // El tour se activará automáticamente al navegar a la página de ejercicios
    // No necesitamos hacer nada especial aquí, solo permitir que la navegación ocurra normalmente
  }, [currentStep, isActive, isWelcomeTour, TOUR_STEPS]);

  // Escuchar eventos de navegación para los pasos de flechas
  useEffect(() => {
    if (!isActive || !isWelcomeTour) return;
    
    const step = TOUR_STEPS[currentStep] as TourStep & { audioText?: string };
    if (step?.id !== "nav-arrow-right" && step?.id !== "nav-arrow-left") return;

    const handleRightNavigation = () => {
      if (step.id === "nav-arrow-right") {
        setHasNavigatedRight(true);
        // Avanzar automáticamente al siguiente paso (flecha izquierda) después de navegar
        setTimeout(() => {
          if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
          }
        }, 500);
      }
    };

    const handleLeftNavigation = () => {
      if (step.id === "nav-arrow-left") {
        setHasNavigatedLeft(true);
        // Avanzar automáticamente al siguiente paso (unidad 1) después de navegar
        setTimeout(() => {
          if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
          }
        }, 500);
      }
    };

    const leftArrow = document.querySelector('[data-tour="nav-arrow-left"]');
    const rightArrow = document.querySelector('[data-tour="nav-arrow-right"]');

    if (step.id === "nav-arrow-right" && rightArrow) {
      rightArrow.addEventListener('click', handleRightNavigation);
    }
    
    if (step.id === "nav-arrow-left" && leftArrow) {
      leftArrow.addEventListener('click', handleLeftNavigation);
    }

    return () => {
      if (rightArrow) {
        rightArrow.removeEventListener('click', handleRightNavigation);
      }
      if (leftArrow) {
        leftArrow.removeEventListener('click', handleLeftNavigation);
      }
    };
  }, [currentStep, isActive, isWelcomeTour, TOUR_STEPS, handleComplete]);

  // Ya no necesitamos este useEffect porque ahora avanzamos paso a paso

  // Reproducir audio automáticamente cuando cambia el paso (para welcome y ejercicios)
  useEffect(() => {
    if (!isActive || (!isWelcomeTour && !isExerciseTour)) return;
    
    const step = TOUR_STEPS[currentStep] as TourStep & { audioText?: string };
    if (!step || !step.audioText) return;

    // Para los pasos de navegación, resetear el estado cuando cambiamos de paso
    if (step.id === "nav-arrow-right") {
      setHasNavigatedRight(false);
    }
    if (step.id === "nav-arrow-left") {
      setHasNavigatedLeft(false);
    }

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
            // Para los pasos de navegación y unidad 1, NO avanzar automáticamente - esperar a que el usuario haga clic
            if (step.id === "nav-arrow-right" || step.id === "nav-arrow-left" || step.id === "unit-1") {
              // El tour avanzará automáticamente cuando el usuario haga clic en la flecha o unidad correspondiente
              // Ver useEffect que escucha los clics
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
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Calcular el spotlight mejorado - usar forma elíptica/rectangular que se ajuste al elemento
  const getSpotlightShape = () => {
    if (!elementPosition) return null;

    const padding = 20; // Padding adicional alrededor del elemento
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
              {spotlightShape && (
                spotlightShape.type === 'circle' ? (
                  <circle
                    cx={spotlightShape.cx}
                    cy={spotlightShape.cy}
                    r={spotlightShape.r}
                    fill="black"
                  />
                ) : (
                  <rect
                    x={spotlightShape.x}
                    y={spotlightShape.y}
                    width={spotlightShape.width}
                    height={spotlightShape.height}
                    rx={spotlightShape.rx}
                    fill="black"
                  />
                )
              )}
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

        {/* Tooltip con información del paso */}
        {currentStepData && isTooltipReady && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed z-[10000]"
            style={{
              pointerEvents: "auto",
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform:
                currentStepData.position === "left" ||
                currentStepData.position === "right"
                  ? "translateY(-50%)"
                  : "translateX(-50%)",
              maxWidth: `${Math.min(400, tooltipDimensions.tooltipWidth + 40)}px`,
              minWidth: "280px",
              maxHeight: "calc(100vh - 40px)", // Asegurar que no se salga de la pantalla
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl p-6 relative overflow-hidden"
              style={{
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                maxHeight: "calc(100vh - 40px)",
                overflowY: "auto",
              }}
            >
              {/* Indicador de paso */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: theme.colors.primary.pink }}
                  >
                    {currentStep + 1}
                  </div>
                  <span className="text-sm text-gray-500 font-medium">
                    {currentStep + 1} de {TOUR_STEPS.length}
                  </span>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
                  aria-label="Cerrar tour"
                >
                  ×
                </button>
              </div>

              {/* Título y descripción */}
              <h3
                className="text-2xl font-bold mb-3"
                style={{ color: theme.colors.primary.pink }}
              >
                {currentStepData.title}
              </h3>
              <p className="text-gray-700 text-base leading-relaxed mb-6">
                {currentStepData.description}
              </p>

              {/* Botones de navegación */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={handlePrevious}
                  disabled={isFirstStep || isSpeaking}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm flex-shrink-0 ${
                    isFirstStep || isSpeaking
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Anterior
                </button>

                <div className="flex gap-1.5 flex-shrink-0">
                  {TOUR_STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentStep
                          ? "bg-pink-500 w-5"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                disabled={
                  (isSpeaking && (isWelcomeTour || isExerciseTour)) ||
                  (currentStepData.id === "nav-arrow-right" && !hasNavigatedRight && hasSpokenRef.current) ||
                  (currentStepData.id === "nav-arrow-left" && !hasNavigatedLeft && hasSpokenRef.current) ||
                  (currentStepData.id === "unit-1" && hasSpokenRef.current)
                }
                  className="px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0"
                  style={{ backgroundColor: theme.colors.primary.pink }}
                >
                  {isLastStep ? "Finalizar" : "Siguiente"}
                </button>
              </div>
            </div>

            {/* Flecha apuntando al elemento */}
            {elementPosition && (
              <motion.div
                className="absolute"
                style={{
                  top:
                    currentStepData.position === "bottom"
                      ? "-10px"
                      : currentStepData.position === "top"
                      ? "100%"
                      : "50%",
                  left:
                    currentStepData.position === "left" ||
                    currentStepData.position === "right"
                      ? currentStepData.position === "left"
                        ? "100%"
                        : "-10px"
                      : "50%",
                  transform:
                    currentStepData.position === "left" ||
                    currentStepData.position === "right"
                      ? "translateY(-50%)"
                      : "translateX(-50%)",
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div
                  className="w-0 h-0"
                  style={{
                    borderLeft:
                      currentStepData.position === "right"
                        ? `10px solid white`
                        : "none",
                    borderRight:
                      currentStepData.position === "left"
                        ? `10px solid white`
                        : "none",
                    borderTop:
                      currentStepData.position === "bottom"
                        ? `10px solid white`
                        : "none",
                    borderBottom:
                      currentStepData.position === "top"
                        ? `10px solid white`
                        : "none",
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
