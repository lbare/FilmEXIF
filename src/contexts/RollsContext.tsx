import React, { createContext, useState, ReactNode, useEffect } from "react";
import { FilmRoll, Photo } from "../interfaces";

export interface RollsContextType {
  activeRolls: FilmRoll[];
  developedRolls: FilmRoll[];
  completedRolls: FilmRoll[];
  addRoll: (roll: FilmRoll, stage: keyof RollsContextType) => void;
  addPhotoToRoll: (id: string, newPhoto: Photo) => void;
}

export const RollsContext = createContext<RollsContextType | undefined>(
  undefined
);

export const RollsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeRolls, setActiveRolls] = useState<FilmRoll[]>([]);
  const [developedRolls, setDevelopedRolls] = useState<FilmRoll[]>([]);
  const [completedRolls, setCompletedRolls] = useState<FilmRoll[]>([]);

  useEffect(() => {
    const savedRolls = localStorage.getItem("filmRolls");
    if (savedRolls) {
      const parsedRolls = JSON.parse(savedRolls);
      setActiveRolls(parsedRolls.activeRolls || []);
      setDevelopedRolls(parsedRolls.developedRolls || []);
      setCompletedRolls(parsedRolls.completedRolls || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "filmRolls",
      JSON.stringify({
        activeRolls,
        developedRolls,
        completedRolls,
      })
    );
  }, [activeRolls, developedRolls, completedRolls]);

  const addRoll = (roll: FilmRoll, stage: keyof RollsContextType) => {
    switch (stage) {
      case "activeRolls":
        setActiveRolls((prev) => [...prev, roll]);
        break;
      case "developedRolls":
        setDevelopedRolls((prev) => [...prev, roll]);
        break;
      case "completedRolls":
        setCompletedRolls((prev) => [...prev, roll]);
        break;
    }
  };

  const addPhotoToRoll = (id: string, newPhoto: Photo) => {
    setActiveRolls((prevRolls) =>
      prevRolls.map((roll) =>
        roll.id === id ? { ...roll, photos: [...roll.photos, newPhoto] } : roll
      )
    );
  };

  return (
    <RollsContext.Provider
      value={{
        activeRolls,
        developedRolls,
        completedRolls,
        addRoll,
        addPhotoToRoll,
      }}
    >
      {children}
    </RollsContext.Provider>
  );
};
