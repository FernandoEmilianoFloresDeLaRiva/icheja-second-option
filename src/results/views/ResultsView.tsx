import { useEffect, useState } from "react";
import {
  getAllDrawingsAsObjects,
  drawingStorage,
} from "../../exercises/utils/drawingStorage";
import { Calendar, Download, Trash2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Grid from "@mui/material/Grid";
import Modal from "../../common/components/Modal/Modal";
import { DrawingPreviewModal } from "../components/DrawingPreviewModal";

interface DrawingResult {
  exerciseId: string;
  imageURL: string;
  timestamp: number;
  title: string;
  chapter: string;
  subject: string;
  exerciseNumber?: number;
}

export default function ResultsView() {
  const [results, setResults] = useState<DrawingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedResult, setSelectedResult] = useState<DrawingResult | null>(
    null
  );
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Cargar resultados al montar el componente
  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const drawings = await getAllDrawingsAsObjects();
      // Ordenar por fecha más reciente
      const sortedDrawings = drawings.sort((a, b) => b.timestamp - a.timestamp);
      setResults(sortedDrawings);
    } catch (err) {
      setError("Error cargando los resultados");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadImage = (imageURL: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = imageURL;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePreviewClick = (result: DrawingResult) => {
    setSelectedResult(result);
    setShowPreviewModal(true);
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setSelectedResult(null);
  };

  const handleDownloadFromPreview = () => {
    if (selectedResult) {
      downloadImage(selectedResult.imageURL, `${selectedResult.title}.png`);
    }
  };

  const handleDeleteFromPreview = async () => {
    if (selectedResult) {
      try {
        await drawingStorage.deleteDrawing(selectedResult.exerciseId);
        setResults((prev) =>
          prev.filter((r) => r.exerciseId !== selectedResult.exerciseId)
        );
        handleClosePreview();
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      ></motion.div>

      {/* Grid de resultados */}
      {results.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-2xl font-semibold text-gray-600 mb-2">
            ¡Aún no hay dibujos!
          </h3>
          <p className="text-gray-500">
            Completa algunos ejercicios para ver tus creaciones aquí
          </p>
        </motion.div>
      ) : (
        <Grid container spacing={3}>
          {results.map((result, index) => (
            <Grid
              key={result.exerciseId}
              size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
            >
              <motion.div
                onClick={() => handlePreviewClick(result)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 hover:cursor-pointer"
              >
                {/* Imagen */}
                <div className="aspect-square overflow-hidden font-bold text-lg text-gray-800">
                  <img
                    src={result.imageURL}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Contenido */}
                <div className="p-4">
                  {/* Título del ejercicio */}
                  <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-2">
                    Ejercicio #{result.exerciseNumber}
                  </h3>

                  {/* Información del capítulo y tema */}
                  <div className="text-sm text-gray-600 mb-2">
                    <div className="font-medium">{result.chapter}</div>
                    <div>{result.subject}</div>
                  </div>

                  {/* Fecha */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <Calendar size={14} />
                    {formatDate(result.timestamp)}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreviewClick(result)}
                      className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-600 hover:cursor-pointer transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye size={14} />
                      Ver
                    </button>

                    <button
                      onClick={() =>
                        downloadImage(
                          result.imageURL,
                          `${result.title.replace(/[^a-zA-Z0-9]/g, "_")}.png`
                        )
                      }
                      className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 hover:cursor-pointer transition-colors flex items-center justify-center gap-1"
                    >
                      <Download size={14} />
                      Descargar
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          await drawingStorage.deleteDrawing(result.exerciseId);
                          setResults((prev) =>
                            prev.filter(
                              (r) => r.exerciseId !== result.exerciseId
                            )
                          );
                        } catch (error) {
                          console.error("Error al eliminar:", error);
                        }
                      }}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hover:cursor-pointer transition-colors"
                      title="Eliminar dibujo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal de Preview */}
      <AnimatePresence>
        {showPreviewModal && selectedResult && (
          <Modal isOpen={showPreviewModal} onClose={handleClosePreview}>
            <DrawingPreviewModal
              result={selectedResult}
              onDownload={handleDownloadFromPreview}
              onDelete={handleDeleteFromPreview}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
