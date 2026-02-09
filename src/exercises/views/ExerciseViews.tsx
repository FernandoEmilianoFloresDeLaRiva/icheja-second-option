import { useParams } from "wouter";
import ExerciseContent from "../components/ExerciseContent";

export default function ExerciseViews() {
  const { unitId } = useParams();
  // Convertir unitId a número, usar 0 por defecto si no está definido o es inválido
  const parsedUnitId = unitId ? Number(unitId) : 0;
  const validUnitId = !isNaN(parsedUnitId) ? parsedUnitId : 0;
  
  return (
    <ExerciseContent unitId={validUnitId} />
  );
}
