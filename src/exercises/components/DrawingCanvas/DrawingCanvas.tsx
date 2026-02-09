import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Palette,
  Save,
  Eraser,
  Trash2,
  RotateCcw,
  Download,
} from "lucide-react";
import {
  drawingStorage,
  canvasToBlob,
  blobToDataURL,
  downloadDrawing,
} from "../../utils/drawingStorage";
import type { ExerciseMetadata } from "../../utils/drawingStorage";

interface DrawingCanvasProps {
  isActive: boolean;
  backgroundImage: string;
  exerciseId: string;
  exerciseTitle: string;
  chapter: string;
  subject: string;
  exerciseNumber?: number;
  onSave?: (imageData: string) => void;
}

const DRAWING_COLORS = [
  { name: "A - Rojo", color: "#DC2626", id: "red" }, // A-a
  { name: "E - Azul", color: "#2563EB", id: "blue" }, // E-e
  { name: "I - Naranja", color: "#EA580C", id: "orange" }, // I-i
  { name: "O - Café", color: "#92400E", id: "brown" }, // O-o
  { name: "U - Verde", color: "#16A34A", id: "green" }, // U-u
  { name: "Negro", color: "#000000", id: "black" },
];

const BRUSH_SIZES = [2, 4, 6, 8, 12, 16];

export default function DrawingCanvas({
  isActive,
  backgroundImage,
  exerciseId,
  exerciseTitle,
  chapter,
  subject,
  exerciseNumber,
  onSave,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(DRAWING_COLORS[0].color);
  const [brushSize, setBrushSize] = useState(4);
  const [isErasing, setIsErasing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [imageRect, setImageRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Referencia para la imagen de fondo
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcular las dimensiones y posición exacta de la imagen
  const calculateImageDimensions = useCallback(() => {
    if (!backgroundImageRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const img = backgroundImageRef.current;

    // Obtener dimensiones del contenedor
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Calcular dimensiones de la imagen manteniendo aspect ratio (object-contain)
    const imgAspectRatio = img.naturalWidth / img.naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let imageWidth, imageHeight, imageX, imageY;

    if (imgAspectRatio > containerAspectRatio) {
      // La imagen es más ancha proporcionalmente
      imageWidth = containerWidth;
      imageHeight = containerWidth / imgAspectRatio;
      imageX = 0;
      imageY = (containerHeight - imageHeight) / 2;
    } else {
      // La imagen es más alta proporcionalmente
      imageHeight = containerHeight;
      imageWidth = containerHeight * imgAspectRatio;
      imageX = (containerWidth - imageWidth) / 2;
      imageY = 0;
    }

    setImageRect({
      x: imageX,
      y: imageY,
      width: imageWidth,
      height: imageHeight,
    });
  }, []);

  // Función para guardar el dibujo
  const saveDrawing = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImageRef.current) return;

    try {
      // Crear canvas temporal con el tamaño ORIGINAL de la imagen
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      const originalImg = backgroundImageRef.current;
      tempCanvas.width = originalImg.naturalWidth;
      tempCanvas.height = originalImg.naturalHeight;

      // Dibujar la imagen original a tamaño completo
      tempCtx.drawImage(
        originalImg,
        0,
        0,
        originalImg.naturalWidth,
        originalImg.naturalHeight
      );

      // Extraer solo los trazos del canvas actual (sin la imagen de fondo)
      // para guardarlos por separado
      const drawingOnlyCanvas = document.createElement("canvas");
      const drawingOnlyCtx = drawingOnlyCanvas.getContext("2d");
      if (!drawingOnlyCtx) return;

      drawingOnlyCanvas.width = originalImg.naturalWidth;
      drawingOnlyCanvas.height = originalImg.naturalHeight;

      // Escalar y dibujar los trazos del canvas actual sobre canvas de trazos
      const scaleX = originalImg.naturalWidth / canvas.width;
      const scaleY = originalImg.naturalHeight / canvas.height;

      drawingOnlyCtx.save();
      drawingOnlyCtx.scale(scaleX, scaleY);
      drawingOnlyCtx.drawImage(canvas, 0, 0);
      drawingOnlyCtx.restore();

      // Extraer solo los pixels que son trazos (diferentes de transparencia)
      const drawingData = drawingOnlyCtx.getImageData(
        0,
        0,
        drawingOnlyCanvas.width,
        drawingOnlyCanvas.height
      );

      // Dibujar solo los píxeles con contenido (alpha > 0) en el canvas final
      const finalData = tempCtx.createImageData(
        tempCanvas.width,
        tempCanvas.height
      );

      for (let i = 0; i < drawingData.data.length; i += 4) {
        const alpha = drawingData.data[i + 3];
        if (alpha > 10) {
          // Si hay contenido del trazo, copiar pixel
          finalData.data[i] = drawingData.data[i];
          finalData.data[i + 1] = drawingData.data[i + 1];
          finalData.data[i + 2] = drawingData.data[i + 2];
          finalData.data[i + 3] = alpha;
        }
      }

      // Pegar solo los trazos sobre la imagen
      tempCtx.putImageData(finalData, 0, 0);

      // Convertir a Blob y guardar en IndexedDB con metadata
      const imageBlob = await canvasToBlob(tempCanvas);
      const metadata: ExerciseMetadata = {
        title: exerciseTitle,
        chapter: chapter,
        subject: subject,
        exerciseNumber: exerciseNumber,
      };
      await drawingStorage.saveDrawing(exerciseId, imageBlob, metadata);

      // Convertir a data URL para callback
      const dataURL = await blobToDataURL(imageBlob);
      onSave?.(dataURL);

      console.log("✅ Dibujo guardado en IndexedDB");
    } catch (error) {
      console.error("❌ Error guardando en IndexedDB:", error);
    }
  }, [exerciseId, exerciseTitle, chapter, subject, exerciseNumber, onSave]);

  // Función para recargar el dibujo
  const reloadDrawing = useCallback(async () => {
    if (!canvasRef.current || !backgroundImageRef.current) return;

    try {
      const imageBlob = await drawingStorage.loadDrawing(exerciseId);
      if (!imageBlob) {
        console.log("No hay dibujo guardado para recargar");
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Convertir Blob a data URL
      const dataURL = await blobToDataURL(imageBlob);

      const img = new Image();
      img.onload = () => {
        // Limpiar canvas actual
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Crear canvas con la imagen original para comparación
        const origCanvas = document.createElement("canvas");
        const origCtx = origCanvas.getContext("2d");
        if (!origCtx) return;

        origCanvas.width = canvas.width;
        origCanvas.height = canvas.height;

        // Dibujar la imagen de fondo original escalada al tamaño del canvas actual
        origCtx.drawImage(
          backgroundImageRef.current!,
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Dibujar la imagen guardada escalada al canvas actual
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Extraer datos de píxeles del canvas actual (imagen guardada escalada)
        const completeImageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Crear nueva imagen solo con los trazos
        const tracesOnlyData = ctx.createImageData(canvas.width, canvas.height);

        // Comparar píxeles para identificar trazos (cambios desde la imagen original)
        for (let i = 0; i < completeImageData.data.length; i += 4) {
          const completeR = completeImageData.data[i];
          const completeG = completeImageData.data[i + 1];
          const completeB = completeImageData.data[i + 2];
          const completeA = completeImageData.data[i + 3];

          // Considerar un trazo si el pixel actual tiene contenido (alpha > 0)
          if (completeA > 10) {
            // Pixel tiene contenido, copiarlo
            tracesOnlyData.data[i] = completeR;
            tracesOnlyData.data[i + 1] = completeG;
            tracesOnlyData.data[i + 2] = completeB;
            tracesOnlyData.data[i + 3] = completeA;
          } else {
            // Pixel transparente para las partes sin trazos
            tracesOnlyData.data[i] = 0;
            tracesOnlyData.data[i + 1] = 0;
            tracesOnlyData.data[i + 2] = 0;
            tracesOnlyData.data[i + 3] = 0;
          }
        }

        // Limpiar canvas y dibujar solo los trazos
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(tracesOnlyData, 0, 0);

        console.log("✅ Dibujo recargado desde IndexedDB");
      };
      img.src = dataURL;
    } catch (error) {
      console.error("❌ Error recargando desde IndexedDB:", error);
    }
  }, [exerciseId]);

  // Cargar imagen de fondo
  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        backgroundImageRef.current = img;
        calculateImageDimensions();
      };
      img.src = backgroundImage;
    }
  }, [backgroundImage, calculateImageDimensions]);

  // Configurar canvas cuando se activa
  useEffect(() => {
    if (isActive && backgroundImageRef.current) {
      calculateImageDimensions();
    }
  }, [isActive, calculateImageDimensions]);

  // Configurar canvas cuando imageRect esté listo
  useEffect(() => {
    if (isActive && canvasRef.current && imageRect.width > 0) {
      const canvas = canvasRef.current;

      // Ajustar el canvas al tamaño exacto de la imagen
      canvas.width = imageRect.width;
      canvas.height = imageRect.height;
    }
  }, [isActive, exerciseId, imageRect]);

  // Cargar datos guardados cuando el canvas esté listo
  useEffect(() => {
    if (
      isActive &&
      canvasRef.current &&
      imageRect.width > 0 &&
      backgroundImageRef.current
    ) {
      // Cargar desde IndexedDB
      const loadFromIndexedDB = async () => {
        try {
          const imageBlob = await drawingStorage.loadDrawing(exerciseId);
          if (!imageBlob || !canvasRef.current || !backgroundImageRef.current)
            return;

          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          // Convertir Blob a data URL
          const dataURL = await blobToDataURL(imageBlob);

          const img = new Image();
          img.onload = () => {
            // Limpiar canvas actual
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Dibujar la imagen completa guardada, escalada al tamaño del canvas actual
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Extraer solo los trazos para poder seguir editando
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d");
            if (!tempCtx) return;

            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;

            // Dibujar la imagen original
            tempCtx.drawImage(
              backgroundImageRef.current!,
              0,
              0,
              canvas.width,
              canvas.height
            );

            // Usar diferencia para extraer solo los trazos
            const originalImageData = tempCtx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const completeImageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );

            // Crear nueva imagen solo con los trazos
            const tracesOnlyData = ctx.createImageData(
              canvas.width,
              canvas.height
            );

            for (let i = 0; i < completeImageData.data.length; i += 4) {
              const originalR = originalImageData.data[i];
              const originalG = originalImageData.data[i + 1];
              const originalB = originalImageData.data[i + 2];

              const completeR = completeImageData.data[i];
              const completeG = completeImageData.data[i + 1];
              const completeB = completeImageData.data[i + 2];
              const completeA = completeImageData.data[i + 3];

              // Si el pixel es diferente de la imagen original, es un trazo
              if (
                Math.abs(originalR - completeR) > 10 ||
                Math.abs(originalG - completeG) > 10 ||
                Math.abs(originalB - completeB) > 10
              ) {
                tracesOnlyData.data[i] = completeR;
                tracesOnlyData.data[i + 1] = completeG;
                tracesOnlyData.data[i + 2] = completeB;
                tracesOnlyData.data[i + 3] = completeA;
              } else {
                // Pixel transparente para las partes sin trazos
                tracesOnlyData.data[i] = 0;
                tracesOnlyData.data[i + 1] = 0;
                tracesOnlyData.data[i + 2] = 0;
                tracesOnlyData.data[i + 3] = 0;
              }
            }

            // Limpiar canvas y dibujar solo los trazos
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.putImageData(tracesOnlyData, 0, 0);

          };
          img.src = dataURL;
        } catch (error) {
          console.error("❌ Error cargando desde IndexedDB:", error);
        }
      };

      // Delay para asegurar que el canvas esté completamente configurado
      const timer = setTimeout(loadFromIndexedDB, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, exerciseId, imageRect]);

  // Efecto para recalcular dimensiones cuando cambie el tamaño (menos frecuente en fullscreen)
  useEffect(() => {
    const handleResize = () => {
      if (isActive) {
        calculateImageDimensions();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isActive, calculateImageDimensions]);

  // Funciones de dibujo - Mouse
  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawAtPosition(ctx, x, y);
  };

  // Funciones de dibujo - Touch
  const startDrawingTouch = (e: React.TouchEvent) => {
    e.preventDefault(); // Evitar scroll en móviles
    setIsDrawing(true);
    drawTouch(e);
  };

  const drawTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    drawAtPosition(ctx, x, y);
  };

  // Función unificada para dibujar en una posición
  const drawAtPosition = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) => {
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isErasing) {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = currentColor;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();

    // Auto-guardar después de dibujar
    saveDrawing();
  };

  const clearCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      // Eliminar de IndexedDB
      await drawingStorage.deleteDrawing(exerciseId);
      console.log("✅ Dibujo eliminado de IndexedDB");
    } catch (error) {
      console.error("❌ Error eliminando de IndexedDB:", error);
    }
  };

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 ${
        isActive ? "z-10" : "z-0 pointer-events-none"
      }`}
    >
      {/* Canvas de dibujo posicionado exactamente sobre la imagen */}
      <canvas
        ref={canvasRef}
        className={`absolute ${
          isActive ? "cursor-crosshair" : "pointer-events-none"
        }`}
        // Eventos de mouse - solo activos cuando isActive es true
        onMouseDown={isActive ? startDrawing : undefined}
        onMouseMove={isActive ? draw : undefined}
        onMouseUp={isActive ? stopDrawing : undefined}
        onMouseLeave={isActive ? stopDrawing : undefined}
        // Eventos táctiles para móviles - solo activos cuando isActive es true
        onTouchStart={isActive ? startDrawingTouch : undefined}
        onTouchMove={isActive ? drawTouch : undefined}
        onTouchEnd={isActive ? stopDrawing : undefined}
        onTouchCancel={isActive ? stopDrawing : undefined}
        style={{
          left: `${imageRect.x}px`,
          top: `${imageRect.y}px`,
          width: `${imageRect.width}px`,
          height: `${imageRect.height}px`,
          background: "transparent",
          touchAction: isActive ? "none" : "auto", // Prevenir scroll y zoom en dispositivos móviles solo cuando está activo
          pointerEvents: isActive ? "auto" : "none", // Asegurar que no capture eventos cuando no está activo
        }}
      />

      {/* Herramientas de dibujo - solo mostrar cuando está activo */}
      {isActive && (
        <div className="absolute -top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-3">
          {/* Selector de colores */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center"
              style={{ backgroundColor: currentColor }}
              title="Seleccionar color"
            >
              <Palette size={16} className="text-white" />
            </button>

            {showColorPicker && (
              <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg p-2 grid grid-cols-2 gap-2 z-20">
                {DRAWING_COLORS.map((colorOption) => (
                  <button
                    key={colorOption.id}
                    onClick={() => {
                      setCurrentColor(colorOption.color);
                      setIsErasing(false);
                      setShowColorPicker(false);
                    }}
                    className="w-10 h-10 sm:w-8 sm:h-8 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform touch-manipulation"
                    style={{ backgroundColor: colorOption.color }}
                    title={colorOption.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Tamaño de pincel */}
          <div className="space-y-1">
            <div className="text-xs text-gray-600 text-center">Tamaño</div>
            <select
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full text-xs sm:text-xs p-2 sm:p-1 rounded border touch-manipulation"
            >
              {BRUSH_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>

          {/* Herramientas */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => {
                setIsErasing(!isErasing);
              }}
              className={`p-3 sm:p-2 rounded touch-manipulation ${
                isErasing
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              title="Borrador"
            >
              <Eraser size={20} className="sm:hidden" />
              <Eraser size={16} className="hidden sm:block" />
            </button>

            <button
              onClick={saveDrawing}
              className="p-3 sm:p-2 rounded bg-green-500 text-white hover:bg-green-600 touch-manipulation"
              title="Guardar dibujo"
            >
              <Save size={20} className="sm:hidden" />
              <Save size={16} className="hidden sm:block" />
            </button>

            <button
              onClick={() => reloadDrawing()}
              className="p-3 sm:p-2 rounded bg-blue-500 text-white hover:bg-blue-600 touch-manipulation"
              title="Recargar último guardado"
            >
              <RotateCcw size={20} className="sm:hidden" />
              <RotateCcw size={16} className="hidden sm:block" />
            </button>

            <button
              onClick={() =>
                downloadDrawing(exerciseId, `ejercicio_${exerciseId}.png`)
              }
              className="p-3 sm:p-2 rounded bg-purple-500 text-white hover:bg-purple-600 touch-manipulation"
              title="Descargar imagen completa"
            >
              <Download size={20} className="sm:hidden" />
              <Download size={16} className="hidden sm:block" />
            </button>

            <button
              onClick={clearCanvas}
              className="p-3 sm:p-2 rounded bg-red-500 text-white hover:bg-red-600 touch-manipulation"
              title="Limpiar todo"
            >
              <Trash2 size={20} className="sm:hidden" />
              <Trash2 size={16} className="hidden sm:block" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
