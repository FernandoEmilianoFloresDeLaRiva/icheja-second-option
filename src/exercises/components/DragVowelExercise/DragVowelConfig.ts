// Configuración de palabras por vocal para el ejercicio de arrastrar vocales

export const VOWEL_WORDS_CONFIG: Record<string, string[]> = {
  a: [
    "avena",
    "casa",
    "mesa",
    "manzana",
    "banana",
    "rata",
    "cama",
    "papa",
    "sala",
    "taza",
    "vaca",
    "pala",
    "lata",
    "masa",
    "rama",
    "gata",
    "sana",
    "capa",
    "nata",
    "pata",
  ],
  e: [
    "leche",
    "nene",
    "verde",
    "diente",
    "puente",
    "mente",
    "fuente",
    "gente",
    "frente",
    "suerte",
  ],
  i: [
    "piso",
    "hijo",
    "mina",
    "risa",
    "vida",
    "cita",
    "fila",
    "lima",
    "pila",
    "tiza",
  ],
  o: [
    "oso",
    "lobo",
    "mono",
    "polo",
    "codo",
    "foto",
    "gorro",
    "pozo",
    "rojo",
    "toro",
  ],
  u: [
    "uva",
    "luna",
    "cuna",
    "duda",
    "fuga",
    "junta",
    "mula",
    "nube",
    "puma",
    "ruta",
  ],
};

// Vocal por defecto para el case 25
export const DEFAULT_TARGET_VOWEL = "a";

// Cantidad de palabras a mostrar por sesión
export const WORDS_PER_SESSION = 5;

// Función para obtener palabras aleatorias de una vocal
export const getRandomWords = (
  vowel: string,
  count: number = WORDS_PER_SESSION
): string[] => {
  const words = VOWEL_WORDS_CONFIG[vowel.toLowerCase()] || VOWEL_WORDS_CONFIG["a"];
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};