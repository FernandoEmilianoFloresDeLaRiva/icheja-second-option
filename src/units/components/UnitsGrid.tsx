import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { UnitEntity } from "../entities/unit.entity";
import gobiernoLogo from "../../assets/images/gobierno_logo.png";

interface UnitsGridProps {
  units: UnitEntity[];
  onUnitClick: (unitId: number) => void;
}

export default function UnitsGrid({ units, onUnitClick }: UnitsGridProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const unitsPerPage = 6; // 3 columnas x 2 filas = 6 unidades por página
  const totalPages = Math.ceil(units.length / unitsPerPage);
  const showCarousel = units.length > unitsPerPage;

  const handlePrevious = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  return (
    <div className="w-full">
      {/* Grid o Carrusel */}
      {showCarousel ? (
        <div className="relative px-12">
          {/* Botones de navegación */}
          {totalPages > 1 && (
            <div data-tour="nav-arrows-container" className="absolute inset-0 pointer-events-none" style={{ zIndex: 10001 }}>
              <button
                data-tour="nav-arrow-left"
                onClick={handlePrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 hover:cursor-pointer border-2 border-gray-100 group pointer-events-auto"
                aria-label="Anterior"
                style={{ zIndex: 10002 }}
              >
                <ChevronLeft className="w-6 h-6 text-[#009887] group-hover:text-[#007a6e] transition-colors" />
              </button>
              <button
                data-tour="nav-arrow-right"
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 hover:cursor-pointer border-2 border-gray-100 group pointer-events-auto"
                aria-label="Siguiente"
                style={{ zIndex: 10002 }}
              >
                <ChevronRight className="w-6 h-6 text-[#009887] group-hover:text-[#007a6e] transition-colors" />
              </button>
            </div>
          )}

          {/* Contenedor del carrusel */}
          <div className="relative overflow-hidden">
            <motion.div
              className="flex"
              animate={{
                x: `-${currentPage * 100}%`,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              {Array.from({ length: totalPages }).map((_, pageIndex) => (
                <div
                  key={pageIndex}
                  className="min-w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 px-2"
                >
                  {units
                    .slice(
                      pageIndex * unitsPerPage,
                      pageIndex * unitsPerPage + unitsPerPage
                    )
                    .map((unit, index) => (
                      <UnitCard
                        key={unit.id}
                        unit={unit}
                        onUnitClick={onUnitClick}
                        index={pageIndex * unitsPerPage + index}
                      />
                    ))}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Indicadores de página */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentPage === index
                      ? "w-8 bg-[#009887]"
                      : "w-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Ir a página ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {units.map((unit, index) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onUnitClick={onUnitClick}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface UnitCardProps {
  unit: UnitEntity;
  onUnitClick: (unitId: number) => void;
  index: number;
}

function UnitCard({ unit, onUnitClick, index }: UnitCardProps) {
  // Agregar data-tour solo a la unidad 1 (unit.id === 0) y solo cuando el tour esté en el paso 5 (unit-1)
  const isUnit1 = unit.id === 0;
  const [isUnit1StepActive, setIsUnit1StepActive] = useState(false);
  
  // Escuchar eventos del tour para saber cuándo estamos en el paso de unidad 1
  useEffect(() => {
    // Inicializar como false para asegurar que no se muestre desde el inicio
    setIsUnit1StepActive(false);
    
    const handleTourStepChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ stepId: string | null; currentStep: number; totalSteps: number }>;
      const { stepId } = customEvent.detail;
      
      // Solo activar el atributo data-tour cuando el paso actual sea EXACTAMENTE "unit-1"
      // Verificación estricta: solo cuando stepId sea exactamente "unit-1" y no sea null
      if (stepId === "unit-1") {
        setIsUnit1StepActive(true);
      } else {
        // Asegurarse de que se desactive si no es el paso correcto
        setIsUnit1StepActive(false);
      }
    };
    
    window.addEventListener('tour-step-changed', handleTourStepChange);
    
    // Verificación inicial: asegurarse de que no esté activo al montar
    // Esperar un momento para que el tour se inicialice
    const initTimer = setTimeout(() => {
      setIsUnit1StepActive(false);
    }, 100);
    
    return () => {
      window.removeEventListener('tour-step-changed', handleTourStepChange);
      clearTimeout(initTimer);
      setIsUnit1StepActive(false);
    };
  }, []);
  
  // Solo agregar el atributo data-tour cuando isUnit1StepActive sea true
  // Verificación adicional: asegurarse de que el tour esté realmente en el paso de unidad 1
  const shouldShowDataTour = isUnit1 && isUnit1StepActive;
  
  // Verificación adicional en tiempo real antes de renderizar
  const [finalShouldShow, setFinalShouldShow] = useState(false);
  
  useEffect(() => {
    if (shouldShowDataTour) {
      // Verificar que realmente el tour esté buscando este elemento
      const tourOverlay = document.querySelector('[class*="z-[9999]"]');
      if (tourOverlay) {
        const style = window.getComputedStyle(tourOverlay);
        if (style.opacity !== '0') {
          // Verificar que el tooltip mencione "Unidad 1"
          const tooltips = document.querySelectorAll('[class*="bg-white rounded-2xl"]');
          let mentionsUnit1 = false;
          tooltips.forEach(tooltip => {
            const text = tooltip.textContent || '';
            // Verificar que el tooltip tenga el título exacto del paso de unidad 1
            if (text.includes('Selecciona la Unidad 1') || 
                (text.includes('Unidad 1') && text.includes('ejercicios'))) {
              mentionsUnit1 = true;
            }
          });
          setFinalShouldShow(mentionsUnit1);
        } else {
          setFinalShouldShow(false);
        }
      } else {
        setFinalShouldShow(false);
      }
    } else {
      setFinalShouldShow(false);
    }
  }, [shouldShowDataTour]);
  
  const dataTourProps = finalShouldShow ? { "data-tour": "unit-1" } : {};
  
  return (
    <motion.div
      {...dataTourProps}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer group relative overflow-hidden flex flex-col h-full"
      onClick={() => onUnitClick(unit.id)}
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.98 }}
      style={isUnit1 && isUnit1StepActive ? { zIndex: 10002, position: "relative" } : {}}
    >
      {/* Efecto de brillo al hacer hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#009887]/5 via-[#009887]/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Borde superior con color al hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#009887] to-[#009887]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Imagen superior */}
      <div className="relative w-full h-40 bg-gradient-to-br from-[#009887]/10 to-[#009887]/5 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.img
            src={gobiernoLogo}
            alt={`Unidad ${unit.id + 1}`}
            className="w-full h-full object-contain opacity-60 group-hover:opacity-80 transition-opacity duration-300"
            whileHover={{ scale: 1.05 }}
          />
        </div>
        {/* Badge de número de unidad */}
        <div className="absolute top-3 left-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-lg group-hover:bg-[#009887] group-hover:text-white transition-all duration-300">
            <span className="text-sm font-bold text-[#009887] group-hover:text-white transition-colors duration-300">
              {unit.id + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col flex-1 p-5">
        {/* Header con icono y título */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 bg-gradient-to-br from-[#009887]/10 to-[#009887]/5 rounded-lg group-hover:from-[#009887]/20 group-hover:to-[#009887]/10 transition-all duration-300 flex-shrink-0">
            <BookOpen className="w-4 h-4 text-[#009887]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 group-hover:text-[#009887] transition-colors duration-300 mb-1">
              Unidad {unit.id + 1}
            </h2>
            <p className="text-sm text-gray-600 line-clamp-2 group-hover:text-gray-800 transition-colors duration-300 leading-relaxed">
              {unit.title}
            </p>
          </div>
        </div>

        {/* Spacer para empujar el footer abajo */}
        <div className="flex-1" />

        {/* Footer con contador y botón */}
        <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#009887] group-hover:bg-[#007a6e] transition-colors duration-300" />
            <span className="text-xs font-medium text-gray-500">
              {unit.exerciseCount || 0} {unit.exerciseCount === 1 ? "ejercicio" : "ejercicios"}
            </span>
          </div>
          <motion.button
            className="text-xs font-semibold text-[#009887] group-hover:text-[#007a6e] transition-colors duration-300 flex items-center gap-1 px-2 py-1 rounded-md group-hover:bg-[#009887]/5"
            whileHover={{ x: 4 }}
          >
            Ver más
            <ChevronRight className="w-3 h-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

