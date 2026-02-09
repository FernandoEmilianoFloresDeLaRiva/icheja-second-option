// Utilidad para almacenar imágenes de dibujos en IndexedDB

// Interface para los datos de dibujo con metadata
export interface DrawingData {
  exerciseId: string;
  imageBlob: Blob;
  timestamp: number;
  title: string;
  chapter: string;
  subject: string;
  exerciseNumber?: number;
}

// Interface para los metadatos del ejercicio
export interface ExerciseMetadata {
  title: string;
  chapter: string;
  subject: string;
  exerciseNumber?: number;
}

class DrawingStorage {
  private dbName = "IchejaDrawings";
  private version = 1;
  private storeName = "drawings";
  private db: IDBDatabase | null = null;

  // Inicializar la base de datos
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Crear el object store si no existe
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: "exerciseId",
          });

          // Crear índices adicionales
          objectStore.createIndex("timestamp", "timestamp", { unique: false });
          objectStore.createIndex("chapter", "chapter", { unique: false });
          objectStore.createIndex("subject", "subject", { unique: false });
          objectStore.createIndex("title", "title", { unique: false });
        }
      };
    });
  }

  // Guardar imagen de dibujo con metadata
  async saveDrawing(
    exerciseId: string, 
    imageBlob: Blob, 
    metadata: ExerciseMetadata
  ): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);

      const drawingData: DrawingData = {
        exerciseId,
        imageBlob,
        timestamp: Date.now(),
        title: metadata.title,
        chapter: metadata.chapter,
        subject: metadata.subject,
        exerciseNumber: metadata.exerciseNumber,
      };

      const request = objectStore.put(drawingData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Cargar imagen de dibujo
  async loadDrawing(exerciseId: string): Promise<Blob | null> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.get(exerciseId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.imageBlob : null);
      };
    });
  }

  // Eliminar imagen de dibujo
  async deleteDrawing(exerciseId: string): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.delete(exerciseId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Obtener todos los dibujos con metadata completa
  async getAllDrawings(): Promise<DrawingData[]> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Limpiar todos los dibujos (opcional, para debugging)
  async clearAllDrawings(): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Instancia singleton para usar en toda la aplicación
export const drawingStorage = new DrawingStorage();

// Funciones helper para convertir entre canvas, blob y data URL
export const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to convert canvas to blob"));
      }
    }, "image/png");
  });
};

export const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
};

// Función para descargar imagen desde IndexedDB
export const downloadDrawing = async (
  exerciseId: string,
  filename?: string
): Promise<void> => {
  try {
    const imageBlob = await drawingStorage.loadDrawing(exerciseId);
    if (!imageBlob) {
      console.log("No se encontró imagen para descargar");
      return;
    }

    // Crear URL temporal
    const url = URL.createObjectURL(imageBlob);

    // Crear elemento de descarga
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `drawing_${exerciseId}_${Date.now()}.png`;

    // Trigger download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Limpiar URL temporal
    URL.revokeObjectURL(url);

    console.log("✅ Imagen descargada:", a.download);
  } catch (error) {
    console.error("❌ Error descargando imagen:", error);
  }
};

// Función para obtener todas las imágenes como objetos con URLs y metadata
export const getAllDrawingsAsObjects = async (): Promise<
  { 
    exerciseId: string; 
    imageURL: string; 
    timestamp: number;
    title: string;
    chapter: string;
    subject: string;
    exerciseNumber?: number;
  }[]
> => {
  try {
    const drawings = await drawingStorage.getAllDrawings();
    return drawings.map((drawing) => ({
      exerciseId: drawing.exerciseId,
      imageURL: URL.createObjectURL(drawing.imageBlob),
      timestamp: drawing.timestamp,
      title: drawing.title,
      chapter: drawing.chapter,
      subject: drawing.subject,
      exerciseNumber: drawing.exerciseNumber,
    }));
  } catch (error) {
    console.error("❌ Error obteniendo imágenes:", error);
    return [];
  }
};
