import { Volume2 } from "lucide-react";
import { useSpeech } from "../../hooks/useSpeech";

type Props = {
  word: string;
  targetVowel: string;
  selectedCorrectIndices: Set<number>;
  selectedWrongIndices: Set<number>;
  onLetterClick: (letterIndex: number, isTarget: boolean) => void;
};

function normalize(ch: string) {
  return ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function WordCard({
  word,
  targetVowel,
  selectedCorrectIndices,
  selectedWrongIndices,
  onLetterClick,
}: Props) {
  const { speak } = useSpeech();

  const letters = Array.from(word);

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-xl shadow-md min-w-[220px]">
      {/* fila de letras */}
      <div className="flex gap-3">
        {letters.map((letter, idx) => {
          const isSelectedCorrect = selectedCorrectIndices.has(idx);
          const isSelectedWrong = selectedWrongIndices.has(idx);

          // clases visuales
          const base = "w-14 h-16 rounded-md flex items-center justify-center text-2xl font-semibold border transition";
          const stateClass = isSelectedCorrect
            ? "border-green-500 bg-green-50 text-green-700"
            : isSelectedWrong
            ? "border-red-500 bg-red-50 text-red-700"
            : "border-gray-200 bg-white text-black";

          return (
            <button
              key={idx}
              onClick={() => onLetterClick(idx, normalize(letter) === targetVowel.toLowerCase())}
              className={`${base} ${stateClass}`}
              aria-label={`Letra ${letter}`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* audio abajo con texto */}
      <button
        onClick={() => speak(word)}
        className="mt-1 flex items-center gap-2 text-teal-700 hover:opacity-90 transition"
        aria-label={`Escuchar palabra ${word}`}
      >
        <Volume2 size={18} />
        <span className="font-medium text-sm">Escuchar palabra</span>
      </button>
    </div>
  );
}
