interface Props {
  letter: string;
  state: "neutral" | "correct" | "wrong";
  onClick?: () => void;
}

export default function LetterBox({ letter, state, onClick }: Props) {
  let border = "border-gray-300";
  let bg = "bg-white";
  let text = "text-black";

  if (state === "correct") {
    border = "border-green-500";
    bg = "bg-green-50";
    text = "text-green-700";
  }
  if (state === "wrong") {
    border = "border-red-500";
    bg = "bg-red-50";
    text = "text-red-700";
  }

  return (
    <button
      onClick={onClick}
      className={`w-16 h-20 rounded-lg border ${border} ${bg} shadow flex justify-center items-center`}
    >
      <span className={`text-3xl font-semibold ${text}`}>{letter}</span>
    </button>
  );
}
