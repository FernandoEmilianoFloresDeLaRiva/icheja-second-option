import { NotebookText, Volume2, Square } from "lucide-react";
import { useCallback } from "react";
import { useSpeech } from "../../hooks/useSpeech";

interface ExerciseInstructionsProps {
  subtitle: string;
  content: string;
  voiceContent: string;
}

export default function ExerciseInstructions({
  subtitle,
  content,
  voiceContent,
}: ExerciseInstructionsProps) {
  const { speak, cancel, isSpeaking } = useSpeech();

  const handleSpeakClick = useCallback(() => {
    if (isSpeaking) {
      cancel();
    } else {
      speak(voiceContent, { lang: "es-MX", rate: 0.9 });
    }
  }, [voiceContent, speak, cancel, isSpeaking]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <div className="p-3 bg-gradient-to-br from-[#009887] to-[#00B8A9] rounded-xl shadow-lg">
          <NotebookText size={24} className="text-white" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-gray-900">
          {subtitle}
        </h3>
      </div>
      <div className="flex items-start gap-4 flex-1 min-h-0 overflow-y-auto">
        <button
          onClick={handleSpeakClick}
          className={`flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl transition-all shadow-xl hover:shadow-2xl border-2 ${
            isSpeaking
              ? "bg-red-500 hover:bg-red-600 text-white border-red-600"
              : "bg-gradient-to-br from-[#009887] to-[#00B8A9] hover:from-[#008577] hover:to-[#009887] text-white border-white"
          }`}
          aria-label={isSpeaking ? "Detener audio - Toca para parar" : "Escuchar instrucciones - Toca para oír"}
          title={isSpeaking ? "Detener audio - Toca para parar" : "Escuchar instrucciones - Toca para oír"}
        >
          {isSpeaking ? <Square size={28} /> : <Volume2 size={28} />}
        </button>
        <p className="text-gray-900 font-semibold text-base md:text-lg leading-relaxed flex-1">
          {content}
        </p>
      </div>
    </div>
  );
}
