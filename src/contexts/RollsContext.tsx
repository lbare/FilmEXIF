import React, {
  createContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { FilmRoll } from "../interfaces";

export interface RollsContextType {
  rolls: FilmRoll[];
  addRoll: (roll: FilmRoll) => void;
}

export const RollsContext = createContext<RollsContextType | undefined>(
  undefined
);

export const RollsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [rolls, setRolls] = useState<FilmRoll[]>(() => {
    const savedRolls = localStorage.getItem("filmRolls");
    return savedRolls ? JSON.parse(savedRolls) : [];
  });

  useEffect(() => {
    localStorage.setItem("filmRolls", JSON.stringify(rolls));
  }, [rolls]);

  const addRoll = (roll: FilmRoll) => {
    setRolls((prevRolls) => [...prevRolls, roll]);
  };

  return (
    <RollsContext.Provider value={{ rolls, addRoll }}>
      {children}
    </RollsContext.Provider>
  );
};
