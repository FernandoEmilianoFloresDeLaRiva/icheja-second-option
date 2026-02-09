import { theme } from "../../../core/config/theme";

interface ExerciseHeaderProps {
  title: string;
  number?: number | null;
  chapter: string;
  subject: string;
}

export default function ExerciseHeader({
  title,
  chapter,
  subject,
  number = null,
}: ExerciseHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-normal leading-relaxed flex-1 min-w-0">
          {title}
        </h1>
        {number && (
          <span
            className="inline-flex items-center justify-center text-white px-4 py-2 rounded-xl text-xl font-bold shadow-lg flex-shrink-0"
            style={{ 
              background: `linear-gradient(135deg, ${theme.colors.primary.pink} 0%, #E91E63 100%)`
            }}
          >
            {number}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm md:text-base">
        <span className="text-gray-700 font-semibold">{chapter}</span>
        <span className="text-gray-500 font-bold">/</span>
        <span 
          className="font-bold text-lg bg-gradient-to-r from-[#C90166] to-[#E91E63] bg-clip-text text-transparent"
        >
          {subject}
        </span>
      </div>
    </div>
  );
}
