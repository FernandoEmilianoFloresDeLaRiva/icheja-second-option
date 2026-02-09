import { Calendar, Download, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface DrawingResult {
  exerciseId: string;
  imageURL: string;
  timestamp: number;
  title: string;
  chapter: string;
  subject: string;
  exerciseNumber?: number;
}

interface DrawingPreviewModalProps {
  result: DrawingResult;
  onDownload: () => void;
  onDelete: () => void;
}

export default function DrawingPreviewModal({
  result,
  onDownload,
  onDelete,
}: DrawingPreviewModalProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative">
      {/* Imagen principal */}
      <div className="bg-gray-100 rounded-t-2xl overflow-hidden">
        <motion.img
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          src={result.imageURL}
          alt={result.title}
          className="w-full h-auto max-h-[60vh] object-contain"
        />
      </div>

      {/* Información y controles */}
      <div className="p-6">
        {/* Información del ejercicio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        >
          <div className="bg-pink-50 rounded-lg p-4 text-center">
            <div className="font-semibold text-pink-700 mb-1">Capítulo</div>
            <div className="text-gray-700">{result.chapter}</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="font-semibold text-blue-700 mb-1">Tema</div>
            <div className="text-gray-700">{result.subject}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="font-semibold text-green-700 mb-1">Ejercicio</div>
            <div className="text-gray-700">
              {result.exerciseNumber ? `#${result.exerciseNumber}` : "N/A"}
            </div>
          </div>
        </motion.div>

        {/* Fecha de creación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-gray-600 mb-6"
        >
          <Calendar size={18} />
          <span>Completado el {formatDate(result.timestamp)}</span>
        </motion.div>

        {/* Botones de acción */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex gap-3 justify-center"
        >
          <button
            onClick={onDownload}
            className="flex items-center gap-2 bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-all duration-200 hover:scale-105 hover:cursor-pointer shadow-lg"
          >
            <Download size={20} />
            Descargar
          </button>

          <button
            onClick={onDelete}
            className="flex items-center gap-2 bg-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-600 transition-all duration-200 hover:scale-105 hover:cursor-pointer shadow-lg"
          >
            <Trash2 size={20} />
            Eliminar
          </button>
        </motion.div>
      </div>
    </div>
  );
}
