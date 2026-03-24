import UnitsView from "../../units/views/UnitsView";
import AlfiImg from "../../assets/images/alfi.png";

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
      {/* Alfi arriba a la derecha - siempre visible, estático */}
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
      <UnitsView />
    </>
  );
}
