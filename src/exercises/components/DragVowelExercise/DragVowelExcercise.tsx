import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Square,
  Sparkles,
} from "lucide-react";
import { theme } from "../../../core/config/theme";
import { useSpeech } from "../../hooks/useSpeech";

// --- (WORD_BANK y funciones auxiliares se mantienen igual, las oculto para ahorrar espacio aquí) ---
const WORD_BANK: Record<string, string[]> = {
  a: [
    "mango",
    "casa",
    "gato",
    "pato",
    "rana",
    "vaca",
    "agua",
    "mamá",
    "papá",
    "mesa",
  ],
  e: ["leche", "nene", "verde", "diente", "puente", "mente", "fuente", "gente"],
  i: ["piso", "hijo", "mina", "risa", "vida", "cita", "fila", "lima"],
  o: ["oso", "lobo", "mono", "polo", "codo", "foto", "gorro", "pozo"],
  u: ["uva", "luna", "cuna", "duda", "fuga", "junta", "mula", "nube"],
};

interface DragVowelExerciseProps {
  targetVowel?: string;
  wordsPerRound?: number;
}

interface LetterSlot {
  letter: string;
  isTarget: boolean;
  isFilled: boolean;
  isCorrect: boolean | null;
  filledWith: string;
}

const getRandomWords = (vowel: string, count: number): string[] => {
  const words = WORD_BANK[vowel.toLowerCase()] || WORD_BANK["a"];
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const processWord = (word: string, targetVowel: string): LetterSlot[] => {
  return word.split("").map((letter) => {
    const isTargetVowel = letter.toLowerCase() === targetVowel.toLowerCase();
    return {
      letter: letter,
      isTarget: isTargetVowel,
      isFilled: !isTargetVowel,
      isCorrect: isTargetVowel ? null : true,
      filledWith: isTargetVowel ? "" : letter,
    };
  });
};

export default function DragVowelExercise({
  targetVowel = "a",
  wordsPerRound = 5,
}: DragVowelExerciseProps) {
  const [words, setWords] = useState<string[]>(() =>
    getRandomWords(targetVowel, wordsPerRound)
  );
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [slots, setSlots] = useState<LetterSlot[]>([]);
  // Reduje las opciones para que quepan mejor, o puedes mantener las 5
  const [vowelOptions] = useState<string[]>(["i", "a", "e", "o", "u"]);
  const [selectedVowel, setSelectedVowel] = useState<string | null>(null);
  const [completedWordsCount, setCompletedWordsCount] = useState(0);
  const [currentWordCompleted, setCurrentWordCompleted] = useState(false);
  const [allWordsCompleted, setAllWordsCompleted] = useState(false);

  const { speak, isSpeaking, cancel } = useSpeech();
  const currentWord = words[currentWordIndex];

  useEffect(() => {
    if (currentWord) {
      setSlots(processWord(currentWord, targetVowel));
      setCurrentWordCompleted(false);
      setSelectedVowel(null);
    }
  }, [currentWordIndex, currentWord, targetVowel]);

  const checkWordComplete = (currentSlots: LetterSlot[]): boolean => {
    const targetSlots = currentSlots.filter((slot) => slot.isTarget);
    return (
      targetSlots.length > 0 &&
      targetSlots.every((slot) => slot.isCorrect === true)
    );
  };

  const handleSelectVowel = (vowel: string) => {
    if (currentWordCompleted || allWordsCompleted) return;
    setSelectedVowel(vowel);
  };

  const handlePlaceVowel = (slotIndex: number) => {
    if (!selectedVowel || currentWordCompleted) return;
    const slot = slots[slotIndex];
    if (!slot.isTarget || slot.isCorrect === true) return;

    const isCorrectVowel =
      selectedVowel.toLowerCase() === targetVowel.toLowerCase();
    const newSlots = slots.map((s, idx) => {
      if (idx !== slotIndex) return s;
      return {
        ...s,
        isFilled: true,
        isCorrect: isCorrectVowel,
        filledWith: selectedVowel,
      };
    });

    setSlots(newSlots);
    setSelectedVowel(null);

    if (isCorrectVowel) {
      if (checkWordComplete(newSlots)) {
        setCurrentWordCompleted(true);
        const newCount = completedWordsCount + 1;
        setCompletedWordsCount(newCount);
        if (newCount >= words.length) setAllWordsCompleted(true);
      }
    } else {
      setTimeout(() => {
        setSlots((prevSlots) =>
          prevSlots.map((s, idx) =>
            idx !== slotIndex
              ? s
              : { ...s, isFilled: false, isCorrect: null, filledWith: "" }
          )
        );
      }, 1000);
    }
  };

  const goToNextWord = () => {
    if (currentWordIndex < words.length - 1)
      setCurrentWordIndex(currentWordIndex + 1);
  };
  const goToPrevious = () => {
    if (currentWordIndex > 0) setCurrentWordIndex(currentWordIndex - 1);
  };
  const goToNext = () => {
    if (currentWordIndex < words.length - 1)
      setCurrentWordIndex(currentWordIndex + 1);
  };

  const generateNewWords = () => {
    setWords(getRandomWords(targetVowel, wordsPerRound));
    setCurrentWordIndex(0);
    setCompletedWordsCount(0);
    setAllWordsCompleted(false);
    setCurrentWordCompleted(false);
    setSelectedVowel(null);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      cancel();
    } else {
      speak(currentWord, { lang: "es-MX", rate: 0.8 });
    }
  };

  const getSlotStyle = (slot: LetterSlot): string => {
    if (!slot.isTarget) return "bg-white border-gray-300 text-gray-800";
    if (slot.isCorrect === true)
      return "bg-green-100 border-green-500 text-green-700";
    if (slot.isCorrect === false)
      return "bg-red-100 border-red-500 text-red-700";
    if (selectedVowel)
      return "bg-blue-50 border-blue-400 border-dashed cursor-pointer";
    return "bg-gray-50 border-gray-400 border-dashed";
  };

  return (
    // CONTENEDOR PRINCIPAL REDUCIDO (max-w-md, p-2)
    <div className="w-full max-w-md mx-auto p-2 bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Progreso Compacto */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex gap-1">
          {words.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx === currentWordIndex
                  ? "bg-pink-500"
                  : idx < completedWordsCount
                  ? "bg-green-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {completedWordsCount}/{words.length}
        </span>
      </div>

      {/* Área de Palabra */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={goToPrevious}
          disabled={currentWordIndex === 0}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 transition-all"
        >
          <ChevronLeft size={20} className="text-gray-500" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={`word-${currentWordIndex}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex gap-1 items-center"
          >
            {slots.map((slot, index) => (
              <motion.div
                key={`slot-${currentWordIndex}-${index}`}
                onClick={() => {
                  if (slot.isTarget && slot.isCorrect !== true && selectedVowel)
                    handlePlaceVowel(index);
                }}
                // SLOT REDUCIDO (w-10 h-12, text-xl)
                className={`
                  w-10 h-12 flex items-center justify-center 
                  text-xl font-bold border rounded-md
                  transition-all select-none
                  ${getSlotStyle(slot)}
                `}
                animate={
                  slot.isCorrect === false
                    ? { x: [0, -3, 3, 0] }
                    : slot.isCorrect === true
                    ? { scale: [1, 1.1, 1] }
                    : {}
                }
              >
                {slot.isFilled ? slot.filledWith || slot.letter : ""}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        <button
          onClick={goToNext}
          disabled={currentWordIndex === words.length - 1}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 transition-all"
        >
          <ChevronRight size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Botón de Audio Compacto */}
      <div className="flex justify-center mb-4">
        <button
          onClick={handleSpeak}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: theme.colors.primary.turquoise }}
        >
          {isSpeaking ? <Square size={14} /> : <Volume2 size={14} />}
          <span>{isSpeaking ? "Parar" : "Escuchar"}</span>
        </button>
      </div>

      {/* Instrucción Compacta */}
      {!currentWordCompleted && !allWordsCompleted && (
        <p className="text-center text-xs text-gray-500 mb-2 h-4">
          {selectedVowel ? "Toca el espacio vacío" : "Elige una vocal:"}
        </p>
      )}

      {/* Opciones Vocales Compactas */}
      {!allWordsCompleted && (
        <div className="flex justify-center gap-2 mb-2">
          {vowelOptions.map((vowel, index) => (
            <motion.button
              key={`vowel-${vowel}-${index}`}
              onClick={() => handleSelectVowel(vowel)}
              disabled={currentWordCompleted}
              // BOTON VOCAL REDUCIDO (w-10 h-10, text-lg)
              className={`
                w-10 h-10 flex items-center justify-center
                text-lg font-bold text-white rounded-lg shadow-sm
                transition-all disabled:opacity-50
                ${
                  selectedVowel === vowel
                    ? "ring-2 ring-yellow-400 scale-105"
                    : ""
                }
              `}
              style={{ backgroundColor: "#0077B6" }}
              whileTap={{ scale: 0.9 }}
            >
              {vowel}
            </motion.button>
          ))}
        </div>
      )}

      {/* Mensajes de Éxito Compactos */}
      <AnimatePresence>
        {currentWordCompleted && !allWordsCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-2"
          >
            <p className="text-sm font-bold mb-2 text-teal-600">¡Correcto!</p>
            {currentWordIndex < words.length - 1 && (
              <button
                onClick={goToNextWord}
                className="px-4 py-1.5 rounded-lg text-white text-sm font-medium hover:opacity-90"
                style={{ backgroundColor: theme.colors.primary.pink }}
              >
                Siguiente →
              </button>
            )}
          </motion.div>
        )}

        {allWordsCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-2"
          >
            <p className="text-base font-bold text-pink-500 mb-2">
              ¡Terminaste!
            </p>
            <button
              onClick={generateNewWords}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-2 mx-auto"
              style={{ backgroundColor: theme.colors.primary.turquoise }}
            >
              <Sparkles size={16} /> Reiniciar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
