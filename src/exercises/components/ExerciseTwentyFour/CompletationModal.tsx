interface Props {
  onRedirect: () => void;
}

export default function CompletionModal({ onRedirect }: Props) {
  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "32px",
            maxWidth: "400px",
            textAlign: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          {/* Emoji animado */}
          <div
            style={{
              fontSize: "64px",
              marginBottom: "16px",
              animation: "bounce 1s infinite",
            }}
          >
            🎊
          </div>

          {/* Título */}
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "12px",
            }}
          >
            ¡Felicitaciones!
          </h2>

          {/* Texto */}
          <p
            style={{
              fontSize: "16px",
              color: "#6b7280",
              marginBottom: "24px",
              lineHeight: "1.5",
            }}
          >
            Has completado todos los ejercicios.  
            Serás redirigido a la pantalla de inicio.
          </p>

          {/* Botón */}
          <button
            onClick={onRedirect}
            style={{
              backgroundColor: "#0891b2",
              color: "white",
              padding: "12px 32px",
              borderRadius: "12px",
              border: "none",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              width: "100%",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#0e7490";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#0891b2";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Ir al inicio
          </button>
        </div>
      </div>

      {/* Animaciones */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
