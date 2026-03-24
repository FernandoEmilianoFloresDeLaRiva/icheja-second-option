import type { ReactNode } from "react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import SideBar from "../../components/SideBar/SideBar";
import HeaderLogo from "../../components/HeaderLogo/HeaderLogo";
import TourGuiado from "../../components/TourGuiado/TourGuiado";
import PageTransition from "../PageTransition/PageTransition";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [showTour, setShowTour] = useState(false);
  const previousLocationRef = useRef<string | null>(null);
  const tourWasActiveRef = useRef(false);

  // Escuchar evento personalizado para iniciar tour manualmente (desde Alfi)
  useEffect(() => {
    const handleStartTour = () => {
      setShowTour(true);
    };

    window.addEventListener("start-tour", handleStartTour);
    return () => {
      window.removeEventListener("start-tour", handleStartTour);
    };
  }, []);

  // Rastrear si el tour estaba activo
  useEffect(() => {
    tourWasActiveRef.current = showTour;
  }, [showTour]);

  useEffect(() => {
    // Verificar si estamos en una ruta que debe mostrar el tour
    // Aceptar /welcome, /exercises, /exercise/:unitId, o /units?unitId=X
    const currentUrlParams = new URLSearchParams(window.location.search);
    const currentHasUnitId = currentUrlParams.has("unitId");
    const isWelcomeRoute = location === "/welcome";
    const currentIsExerciseRoute = location === "/exercises" || location.startsWith("/exercise/") || (location === "/units" && currentHasUnitId);
    const isTourRoute = isWelcomeRoute || currentIsExerciseRoute;
    
    // Si el tour estaba activo en la ruta anterior y cambiamos de ruta, marcar como visto
    if (tourWasActiveRef.current && previousLocationRef.current !== null && previousLocationRef.current !== location) {
      // Determinar qué tour estaba activo basándose en la ruta anterior
      const prevWasWelcome = previousLocationRef.current === "/welcome";
      const prevUrlParams = new URLSearchParams(window.location.search);
      const prevHadUnitId = prevUrlParams.has("unitId");
      const prevWasExercise = previousLocationRef.current === "/exercises" || 
                              previousLocationRef.current?.startsWith("/exercise/") || 
                              (previousLocationRef.current === "/units" && prevHadUnitId);
      
      if (prevWasWelcome) {
        sessionStorage.setItem("tour-shown-welcome", "true");
      }
      if (prevWasExercise) {
        sessionStorage.setItem("tour-shown-exercises", "true");
      }
      setShowTour(false);
    }
    
    // Actualizar la referencia de la ubicación anterior
    previousLocationRef.current = location;
    
    if (!isTourRoute) {
      return;
    }

    // Determinar la clave de sessionStorage según el tipo de ruta
    // - "tour-shown-welcome" para la vista de unidades (/welcome)
    // - "tour-shown-exercises" para cuando se entra a una unidad (/units?unitId=X)
    const tourShownKey = currentIsExerciseRoute ? "tour-shown-exercises" : "tour-shown-welcome";
    
    // Verificar si el tour ya se mostró en esta sesión para este tipo de ruta
    let tourAlreadyShown = sessionStorage.getItem(tourShownKey) === "true";
    
    // Verificar estado de visitas a unidades
    const hasVisitedUnit1 = sessionStorage.getItem('visited-unit-1') === 'true';
    const hasVisitedUnit2 = sessionStorage.getItem('visited-unit-2') === 'true';
    const hasVisitedUnit3 = sessionStorage.getItem('visited-unit-3') === 'true';
    const hasShownFreeNavTour = sessionStorage.getItem('tour-shown-free-nav') === 'true';
    
    // Si ya visitó la unidad 3 Y ya mostró el tour de navegación libre, no mostrar más tours
    if (isWelcomeRoute && hasVisitedUnit3 && hasShownFreeNavTour) {
      return;
    }
    
    // Si visitó unidad 3 pero no ha visto el tour de navegación libre, mostrarlo
    if (isWelcomeRoute && hasVisitedUnit3 && !hasShownFreeNavTour) {
      tourAlreadyShown = false;
    }
    
    // Si acabamos de visitar la unidad 2 y volvemos a welcome, mostrar tour de unidad 3
    if (isWelcomeRoute && hasVisitedUnit2 && !hasVisitedUnit3) {
      tourAlreadyShown = false;
    }
    
    // Si acabamos de visitar la unidad 1 y volvemos a welcome, mostrar tour de unidad 2
    if (isWelcomeRoute && hasVisitedUnit1 && !hasVisitedUnit2) {
      // Forzar mostrar el tour de la unidad 2
      tourAlreadyShown = false;
    }
    
    // Verificar si se solicitó iniciar el tour manualmente (desde Alfi)
    const manualTourRequest = sessionStorage.getItem("start-tour") === "true";
    
    if (tourAlreadyShown && !manualTourRequest) {
      // El tour ya se mostró y no hay solicitud manual, no mostrarlo
      return;
    }

    // Activar el tour automáticamente según la ruta
    const timer = setTimeout(() => {
      // Limpiar flags de solicitud manual
      sessionStorage.removeItem("start-tour");
      sessionStorage.removeItem("continue-tour-exercises");
      setShowTour(true);
    }, 800);

    return () => {
      clearTimeout(timer);
    };
  }, [location]);


  const handleTourComplete = () => {
    // Marcar el tour como completado para este tipo de ruta
    const currentUrlParams = new URLSearchParams(window.location.search);
    const currentHasUnitId = currentUrlParams.has("unitId");
    const isWelcomeRoute = location === "/welcome";
    const currentIsExerciseRoute = location === "/exercises" || location.startsWith("/exercise/") || (location === "/units" && currentHasUnitId);
    const tourShownKey = currentIsExerciseRoute ? "tour-shown-exercises" : (isWelcomeRoute ? "tour-shown-welcome" : "tour-shown-exercises");
    sessionStorage.setItem(tourShownKey, "true");
    
    // Si ya visitó la unidad 3, marcar que ya se mostró el tour de navegación libre
    const hasVisitedUnit3 = sessionStorage.getItem('visited-unit-3') === 'true';
    if (isWelcomeRoute && hasVisitedUnit3) {
      sessionStorage.setItem('tour-shown-free-nav', 'true');
    }
    
    // Ocultar el tour
    setShowTour(false);
    // Limpiar sessionStorage de flags temporales
    sessionStorage.removeItem("start-tour");
    sessionStorage.removeItem("continue-tour-exercises");
  };

  const handleTourSkip = () => {
    // Marcar el tour como visto (aunque se haya saltado) para este tipo de ruta
    const currentUrlParams = new URLSearchParams(window.location.search);
    const currentHasUnitId = currentUrlParams.has("unitId");
    const isWelcomeRoute = location === "/welcome";
    const currentIsExerciseRoute = location === "/exercises" || location.startsWith("/exercise/") || (location === "/units" && currentHasUnitId);
    const tourShownKey = currentIsExerciseRoute ? "tour-shown-exercises" : (isWelcomeRoute ? "tour-shown-welcome" : "tour-shown-exercises");
    sessionStorage.setItem(tourShownKey, "true");
    
    // Si ya visitó la unidad 3, marcar que ya se mostró el tour de navegación libre
    const hasVisitedUnit3 = sessionStorage.getItem('visited-unit-3') === 'true';
    if (isWelcomeRoute && hasVisitedUnit3) {
      sessionStorage.setItem('tour-shown-free-nav', 'true');
    }
    
    // Ocultar el tour
    setShowTour(false);
    // Limpiar sessionStorage de flags temporales
    sessionStorage.removeItem("start-tour");
    sessionStorage.removeItem("continue-tour-exercises");
  };

  return (
    <main className="flex max-w-screen h-screen bg-gray-50 py-1 px-2 overflow-hidden">
      <SideBar />
      <div className="w-full ml-32 rounded-xl pr-4 flex flex-col min-h-0 overflow-hidden">
        <HeaderLogo />
        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <PageTransition ease="easeInOut">{children}</PageTransition>
          </AnimatePresence>
        </div>
      </div>
      <TourGuiado
        isActive={showTour}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
        currentRoute={location || ""}
      />
    </main>
  );
}

export default AppLayout;
