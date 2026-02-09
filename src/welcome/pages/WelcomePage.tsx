import UnitsView from "../../units/views/UnitsView";
import { motion } from "framer-motion";
import AlfiImg from "../../assets/images/alfi.png";

// Animación flotante para Alfi
const floatingAnimation = {
  y: [0, -15, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

export default function WelcomePage() {
  const handleAlfiClick = () => {
    // Activar el tour guardando en sessionStorage
    sessionStorage.setItem("start-tour", "true");
    // Disparar evento personalizado para que AppLayout lo detecte
    // Usar un pequeño delay para asegurar que sessionStorage se actualice primero
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("start-tour"));
    }, 10);
  };

  return (
    <>
      {/* Alfi arriba a la derecha - siempre visible */}
      <motion.div
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
        onClick={handleAlfiClick}
      >
        <img
          src={AlfiImg}
          alt="Alfi - Asistente virtual"
          className="w-full h-full object-contain"
        />
      </motion.div>
      <UnitsView />
    </>
  );
}
