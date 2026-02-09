import { useEffect, useState } from "react";
import exercises from "../../../exercises.json";
import { UnitEntity } from "../entities/unit.entity";

export const useUnits = () => {
  const [units, setUnits] = useState<UnitEntity[]>([]);

  useEffect(() => {
    const unitsList = exercises[0].content;
    const parsedUnits = unitsList.map((unit, idx) => {
      return new UnitEntity(idx, unit.subject, unit.exercise.length);
    });
    setUnits(parsedUnits);
  }, []);

  return {
    units,
  };
};
