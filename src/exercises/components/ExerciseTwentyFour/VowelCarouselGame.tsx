// VowelCarouselGame.tsx
import { useEffect, useMemo, useState } from "react";
import WordCard from "./WordRow";
import CompletionModal from "./CompletationModal";
import { useLocation } from "wouter";

type Props = {
  targetVowel?: string;
  onComplete?: () => void;
};

const words = [
  "mango", "casa", "gato", "pato", "rana", "vaca",
  "agua", "mamá", "papá", "mesa", "cama", "silla",
  "taza", "boca", "cara", "mano", "pan", "sal",
  "mar", "luna", "bola", "caja", "lápiz", "árbol",
];

export default function VowelCarouselGame({
  targetVowel = "a",
  onComplete,
}: Props) {
  const CHUNK_SIZE = 3;
  const [pageIndex, setPageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [, setLocation] = useLocation();

  // estado por palabra en la página
  const [pageSelections, setPageSelections] = useState<
    Record<number, { correct: Set<number>; wrong: Set<number> }>
  >({});

  const start = pageIndex * CHUNK_SIZE;
  const currentWords = words.slice(start, start + CHUNK_SIZE);

  // contar total de 'a' en esta página
  const totalAsInPage = useMemo(() => {
    let total = 0;
    currentWords.forEach((w) => {
      total += Array.from(w).filter(
        (ch) =>
          ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ===
          targetVowel.toLowerCase()
      ).length;
    });
    return total;
  }, [currentWords, targetVowel]);

  // cuántas 'a' ya seleccionó
  const correctAsSelectedCount = useMemo(() => {
    let c = 0;
    for (let i = 0; i < currentWords.length; i++) {
      const info = pageSelections[i];
      if (info) c += info.correct.size;
    }
    return c;
  }, [pageSelections, currentWords.length]);

  // selección de letras
  const handleLetterClick = (
    wordLocalIndex: number,
    letterIndex: number,
    isTarget: boolean
  ) => {
    setPageSelections((prev) => {
      const copy = { ...prev };

      const prevEntry = prev[wordLocalIndex];
      const correctSet = new Set<number>(
        prevEntry ? Array.from(prevEntry.correct) : []
      );
      const wrongSet = new Set<number>(
        prevEntry ? Array.from(prevEntry.wrong) : []
      );

      if (correctSet.has(letterIndex) || wrongSet.has(letterIndex)) {
        return prev;
      }

      if (isTarget) correctSet.add(letterIndex);
      else wrongSet.add(letterIndex);

      copy[wordLocalIndex] = { correct: correctSet, wrong: wrongSet };
      return copy;
    });
  };

  // avanzar o terminar juego → mostrar modal
  useEffect(() => {
    // si ya encontró todas las vocales correctas
    if (totalAsInPage > 0 && correctAsSelectedCount >= totalAsInPage) {
      const t = setTimeout(() => {
        const nextStart = (pageIndex + 1) * CHUNK_SIZE;
        const isLastPage = nextStart >= words.length;

        if (isLastPage) {
          // Mostrar modal final
          setShowModal(true);
          onComplete?.();
          return;
        }

        // pasar a las siguientes 3 palabras
        setPageIndex((p) => p + 1);
        setPageSelections({});
      }, 400);

      return () => clearTimeout(t);
    }
  }, [
    correctAsSelectedCount,
    totalAsInPage,
    pageIndex,
    onComplete,
  ]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-gray-100 rounded-xl p-8">
        <div className="flex gap-6 justify-center items-start">
          {currentWords.map((word, i) => {
            const info = pageSelections[i] ?? {
              correct: new Set<number>(),
              wrong: new Set<number>(),
            };

            return (
              <WordCard
                key={i}
                word={word}
                targetVowel={targetVowel}
                selectedCorrectIndices={info.correct}
                selectedWrongIndices={info.wrong}
                onLetterClick={(letterIndex, isTarget) =>
                  handleLetterClick(i, letterIndex, isTarget)
                }
              />
            );
          })}
        </div>
      </div>

      {/* Modal final */}
      {showModal && (
        <CompletionModal onRedirect={() => setLocation("/units")} />
      )}
    </div>
  );
}
