import { ArrowLeft } from "lucide-react";
import AppLayout from "../../common/layouts/AppLayout/AppLayout";
import { useUnits } from "../hooks/useUnits";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import ExerciseContent from "../../exercises/components/ExerciseContent";
import UnitsGrid from "../components/UnitsGrid";
import { motion } from "framer-motion";
import AlfiImg from "../../assets/images/alfi.png";

// Componente interno para la vista de ejercicios con header
function ExerciseView({ unitId, onBack }: { unitId: number; onBack: () => void }) {
  const [exerciseInfo, setExerciseInfo] = useState({ index: 0, total: 0 });
  
  const handleIndexChange = (index: number, total: number) => {
    setExerciseInfo({ index, total });
  };

  const exerciseNumber = exerciseInfo.index + 1;
  const totalExercises = exerciseInfo.total;

  return (
    <div className="h-full flex flex-col px-1 py-1">
      {/* Fila superior: Botón de regreso + Indicador de ejercicio */}
      <div className="flex items-center gap-3 mb-1 flex-shrink-0">
        <motion.button
          data-tour="back-button"
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-r from-[#009887] to-[#00B8A9] hover:from-[#008577] hover:to-[#009887]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Volver a unidades"
        >
          <ArrowLeft size={18} />
        </motion.button>
        
        {totalExercises > 0 && (
          <div className="px-4 py-2 bg-gradient-to-r from-[#009887] to-[#00B8A9] text-white rounded-xl text-lg font-bold shadow-md">
            Ejercicio {exerciseNumber} de {totalExercises}
          </div>
        )}
      </div>
      
      {/* Canvas de ejercicios - ocupa todo el espacio restante */}
      <div className="flex-1 min-h-0">
        <ExerciseContent unitId={unitId} onIndexChange={handleIndexChange} />
      </div>
    </div>
  );
}

export default function UnitsView() {
  const [location, setLocation] = useLocation();
  const { units } = useUnits();
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);

  // Escuchar cuando el modal de dibujo está abierto para ocultar a Alfi
  useEffect(() => {
    const handleDrawingModalState = (event: CustomEvent<{ isOpen: boolean }>) => {
      setIsDrawingModalOpen(event.detail.isOpen);
    };

    window.addEventListener('drawing-modal-state', handleDrawingModalState as EventListener);
    return () => window.removeEventListener('drawing-modal-state', handleDrawingModalState as EventListener);
  }, []);

  const handleAlfiClick = () => {
    // Activar el tour guardando en sessionStorage
    sessionStorage.setItem("start-tour", "true");
    // Disparar evento personalizado para que AppLayout lo detecte
    // Usar un pequeño delay para asegurar que sessionStorage se actualice primero
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("start-tour"));
    }, 10);
  };

  // Leer el unitId de los query params al montar y cuando cambie location
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const unitIdParam = urlParams.get("unitId");
    
    if (unitIdParam) {
      const parsedUnitId = parseInt(unitIdParam, 10);
      if (!isNaN(parsedUnitId)) {
        setSelectedUnitId(parsedUnitId);
        
        // Marcar que ya visitó la unidad para el tour
        if (parsedUnitId === 0) {
          sessionStorage.setItem('visited-unit-1', 'true');
        } else if (parsedUnitId === 1) {
          sessionStorage.setItem('visited-unit-2', 'true');
        } else if (parsedUnitId === 2) {
          sessionStorage.setItem('visited-unit-3', 'true');
        }
      } else {
        setSelectedUnitId(null);
      }
    } else {
      setSelectedUnitId(null);
      // Si no hay unitId y estamos en /units, redirigir a /welcome
      if (location === "/units") {
        setLocation("/welcome");
      }
    }
  }, [location, setLocation]);

  // También escuchar cambios en la URL (para navegación del navegador)
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const unitIdParam = urlParams.get("unitId");
      if (unitIdParam) {
        const parsedUnitId = parseInt(unitIdParam, 10);
        if (!isNaN(parsedUnitId)) {
          setSelectedUnitId(parsedUnitId);
        } else {
          setSelectedUnitId(null);
        }
      } else {
        setSelectedUnitId(null);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleUnitClick = (unitId: number) => {
    // Actualizar el estado primero para respuesta inmediata
    setSelectedUnitId(unitId);
    // Luego actualizar la URL
    setLocation(`/units?unitId=${unitId}`);
  };

  const handleBackClick = () => {
    setSelectedUnitId(null);
    setLocation("/welcome");
  };

  // Si hay una unidad seleccionada, mostrar los ejercicios
  if (selectedUnitId !== null) {
    return (
      <>
        {/* Alfi arriba a la derecha - oculto cuando el modal de dibujo está abierto */}
        {!isDrawingModalOpen && (
          <div
            data-tour="alfi"
            className="fixed cursor-pointer"
            style={{
              width: "120px",
              height: "120px",
              top: "120px",
              right: "24px",
              zIndex: 10002,
              position: "fixed",
            }}
            onClick={handleAlfiClick}
          >
            <img
              src={AlfiImg}
              alt="Alfi - Asistente virtual"
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <AppLayout>
          <ExerciseView unitId={selectedUnitId} onBack={handleBackClick} />
        </AppLayout>
      </>
    );
  }

  // Si no hay unidad seleccionada, mostrar el grid de unidades
  return (
    <AppLayout>
      <div className="container mx-auto px-4 pt-2 pb-4">
        <div className="mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Unidades de Aprendizaje
          </h1>
          <p className="text-gray-600 text-lg">
            Selecciona una unidad para comenzar tus ejercicios
          </p>
        </div>
        <div data-tour="units-grid">
          <UnitsGrid units={units} onUnitClick={handleUnitClick} />
        </div>
      </div>
    </AppLayout>
  );
}
