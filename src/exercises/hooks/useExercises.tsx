import { useEffect, useState } from "react";
import exercises from "../../../exercises.json";


// USO DE INTERFACES PARA LA DATA DEL JSON
export interface ExerciseContent {
  subtitle: string;
  content: string;
  audioContent?: string; // ← OPCIONAL
}

export interface ExerciseItem {
  title: string;
  img: string;
  case?: number;
  isAudioExercise?: boolean;
  content: ExerciseContent;
}



export const useExercises = (subjectIdx = 0) => {
  // Validar que el índice existe y obtener la lista de ejercicios de forma segura
  const exerciseList: ExerciseItem[] = exercises[0]?.content?.[subjectIdx]?.exercise || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exercise, setExercise] = useState<ExerciseItem | undefined>(exerciseList[currentIndex]);
  const [isLastExercise, setIsLastExercise] = useState(exerciseList.length <= 1);
  const [isFirstExercise, setIsFirstExercise] = useState(true);

  useEffect(() => {
    if (exerciseList && exerciseList.length > 0 && exerciseList[currentIndex]) {
      setExercise(exerciseList[currentIndex]);
    }
  }, [currentIndex, exerciseList]);

  const nextExercise = () => {
    if (exerciseList && exerciseList.length > 0 && currentIndex < exerciseList.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFirstExercise(false);
      setIsLastExercise(currentIndex + 1 === exerciseList.length - 1);
    } else {
      setIsLastExercise(true);
    }
  };

  const previousExercise = () => {
    if (exerciseList && exerciseList.length > 0 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsLastExercise(false);
      setIsFirstExercise(currentIndex - 1 === 0);
    } else {
      setIsFirstExercise(true);
    }
  };

  return {
    chapter: exercises[0]?.chapter,
    subject: exercises[0]?.content[subjectIdx]?.subject,
    exercise,
    previousExercise,
    nextExercise,
    isFirstExercise,
    isLastExercise,
    currentIndex
  };
};
