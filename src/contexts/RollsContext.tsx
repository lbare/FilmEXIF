import React, { createContext, useState, ReactNode, useEffect } from "react";
import { FilmRoll, Photo } from "../interfaces";

export interface RollsContextType {
  rolls: FilmRoll[];
  addRoll: (roll: FilmRoll) => void;
  addPhotoToRoll: (id: string, newPhoto: Photo) => void;
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

  const addPhotoToRoll = (id: string, newPhoto: Photo) => {
    setRolls((prevRolls) =>
      prevRolls.map((roll) =>
        roll.id === id ? { ...roll, photos: [...roll.photos, newPhoto] } : roll
      )
    );
  };

  return (
    <RollsContext.Provider value={{ rolls, addRoll, addPhotoToRoll }}>
      {children}
    </RollsContext.Provider>
  );
};
