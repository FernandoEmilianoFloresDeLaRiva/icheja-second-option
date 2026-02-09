import { Volume2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSpeech } from "../../hooks/useSpeech";

interface ImageOption {
  id: string;
  name: string;
  imagePath: string;
  startsWithU: boolean;
}

const imageOptions: ImageOption[] = [
  {
    id: "nube",
    name: "Nube",
    imagePath: "/ejercicio47/nubes.png",
    startsWithU: true,
  },
  {
    id: "police",
    name: "Policía",
    imagePath: "/ejercicio47/police.png",
    startsWithU: false,
  },
  {
    id: "uña",
    name: "Uña",
    imagePath: "/ejercicio47/uña.png",
    startsWithU: true,
  },
  {
    id: "uvas",
    name: "Uvas",
    imagePath: "/ejercicio47/uvas.png",
    startsWithU: true,
  },
];

export default function ExerciseSelectImageU() {
  const { speak } = useSpeech();
  const [selectedImages, setSelectedImages] = useState<
    Record<string, "correct" | "incorrect" | null>
  >({});
  const [showCongrats, setShowCongrats] = useState(false);

  const handleImageClick = (image: ImageOption) => {
    // Reproducir el nombre de la imagen
    speak(image.name, { lang: "es-MX", rate: 0.8 });

    // Marcar como correcta o incorrecta
    setSelectedImages((prev) => ({
      ...prev,
      [image.id]: image.startsWithU ? "correct" : "incorrect",
    }));
  };

  const handleVowelAudioClick = () => {
    // Reproducir el sonido de la vocal U
    speak("U", { lang: "es-MX", rate: 0.7 });
  };

  const getImageBorderClass = (imageId: string) => {
    const status = selectedImages[imageId];
    if (status === "correct") {
      return "border-4 border-green-500 bg-green-50";
    }
    if (status === "incorrect") {
      return "border-4 border-red-500 bg-red-50";
    }
    return "border-4 border-transparent hover:border-gray-300";
  };

  const resetExercise = () => {
    setSelectedImages({});
    setShowCongrats(false);
  };

  // Verificar si todas las respuestas correctas han sido seleccionadas
  useEffect(() => {
    const correctImages = imageOptions.filter((img) => img.startsWithU);
    const allCorrectSelected = correctImages.every(
      (img) => selectedImages[img.id] === "correct"
    );

    if (
      allCorrectSelected &&
      Object.keys(selectedImages).length >= correctImages.length
    ) {
      setTimeout(() => {
        setShowCongrats(true);
        speak("¡Felicidades! ¡Lo hiciste muy bien!", {
          lang: "es-MX",
          rate: 0.9,
        });
      }, 500);
    }
  }, [selectedImages, speak]);

  return (
    <div className="relative">
      {/* Contenedor horizontal que se ajusta al contenido */}
      <div className="w-full flex items-center justify-center gap-6 py-4">
        {/* Grid horizontal de 4 imágenes - MÁS GRANDES */}
        <div className="grid grid-cols-4 gap-5">
          {imageOptions.map((image) => (
            <button
              key={image.id}
              onClick={() => handleImageClick(image)}
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer w-52 h-52 ${getImageBorderClass(
                image.id
              )}`}
            >
              {/* Imagen */}
              <div className="w-full h-full bg-white p-4 flex items-center justify-center">
                <img
                  src={image.imagePath}
                  alt={image.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error(`Error cargando imagen: ${image.imagePath}`);
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='monospace' font-size='16' fill='%23999'%3EImagen no encontrada%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>

              {/* Indicador de audio en la esquina */}
              <div className="absolute bottom-3 right-3 bg-[#009887] text-white p-2 rounded-full">
                <Volume2 size={18} />
              </div>

              {/* Feedback visual */}
              {selectedImages[image.id] === "correct" && (
                <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                  <span className="text-7xl">✓</span>
                </div>
              )}
              {selectedImages[image.id] === "incorrect" && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                  <span className="text-7xl">✗</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Letra objetivo a la derecha con botón de audio */}
        <div className="flex items-center justify-center relative">
          <div className="bg-gray-200 px-10 py-8 rounded-2xl">
            <p className="text-6xl font-bold text-gray-900">Uu</p>
          </div>
          {/* Botón de audio para la vocal */}
          <button
            onClick={handleVowelAudioClick}
            className="absolute -bottom-2 -right-2 bg-[#009887] text-white p-2.5 rounded-full hover:bg-[#009887]/80 transition-all shadow-lg hover:scale-110"
            title="Escuchar la letra U"
          >
            <Volume2 size={22} />
          </button>
        </div>
      </div>

      {/* Modal de felicitaciones */}
      {showCongrats && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-12 shadow-2xl border-4 border-[#009887] min-w-[500px]">
            <div className="text-center">
              <div className="text-8xl mb-6">🎉</div>
              <h2 className="text-5xl font-bold text-[#009887] mb-6">
                ¡Felicidades!
              </h2>
              <p className="text-2xl text-gray-700 mb-8">
                ¡Lo hiciste muy bien! Has completado el ejercicio correctamente.
              </p>
              <button
                onClick={resetExercise}
                className="bg-[#009887] hover:bg-[#009887]/80 text-white font-semibold px-12 py-4 rounded-2xl transition-colors text-xl"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para la animación de fadeIn */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}