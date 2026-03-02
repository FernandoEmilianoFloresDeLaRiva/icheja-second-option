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
  const [currentColor, setCurrentColor] = useState(DRAWING_COLORS[5].color); // Color negro por defecto (índice 5)
  const [brushSize, setBrushSize] = useState(6); // Grosor medio (6px)
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

  // Cargar datos guardados cuando el canvas esté listo - ELIMINADO para no persistencia
  // useEffect(() => {
  //   if (
  //     isActive &&
  //     canvasRef.current &&
  //     imageRect.width > 0 &&
  //     backgroundImageRef.current
  //   ) {
  //     // Cargar desde IndexedDB
  //     const loadFromIndexedDB = async () => { ... }
  //   }
  // }, [isActive, exerciseId, imageRect]);

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
  };

  const clearCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

      {/* Herramientas de dibujo - Simplificado: solo borrar/reiniciar */}
      {isActive && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-2 flex flex-col gap-2 z-20">
          
          <button
            onClick={clearCanvas}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 hover:scale-105 transition-all shadow-sm"
            title="Borrar todo el dibujo"
          >
            <RotateCcw size={24} />
          </button>

          {/* Ocultos pero disponibles en código si se necesitan después: Color, Grosor, Guardar, Descargar */}
        </div>
      )}
    </div>
  );
}
