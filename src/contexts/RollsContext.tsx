import React, { createContext, useState, ReactNode, useEffect } from "react";
import { FilmRoll, Photo } from "../interfaces";
import { getAllRolls, addRollToFirebase, moveRoll } from "../firebase/config";

export interface RollsContextType {
  activeRolls: FilmRoll[];
  developedRolls: FilmRoll[];
  completedRolls: FilmRoll[];
  addRoll: (roll: FilmRoll, stage: keyof RollsContextType) => void;
  addPhotoToRoll: (id: string, newPhoto: Photo) => void;
  moveRoll: (rollId: string, currentStage: string, newStage: string) => void;
  isLoading: boolean;
  loadingRolls: { [key: string]: boolean };
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingRolls, setLoadingRolls] = useState<{ [key: string]: boolean }>(
    {}
  );

  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    const loadRolls = async () => {
      setIsLoading(true);

      try {
        if (!isInitialized) {
          const cachedRolls = localStorage.getItem("filmRolls");
          let rollsData;

          if (cachedRolls) {
            rollsData = JSON.parse(cachedRolls);
            console.log("Loaded rolls from cache", rollsData);
          } else {
            rollsData = await getAllRolls();
            localStorage.setItem("filmRolls", JSON.stringify(rollsData));
            localStorage.setItem("lastUpdated", new Date().toISOString());
            console.log("Loaded rolls from Firebase and cached");
          }

          setActiveRolls(rollsData.activeRolls || []);
          setDevelopedRolls(rollsData.developedRolls || []);
          setCompletedRolls(rollsData.completedRolls || []);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to load rolls:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRolls();
  }, [isInitialized]);

  const addRoll = async (roll: FilmRoll) => {
    setLoadingRolls((prev) => ({ ...prev, [roll.id]: true }));

    try {
      await addRollToFirebase(roll);
      setActiveRolls((prev) => [...prev, roll]);
      localStorage.setItem(
        "filmRolls",
        JSON.stringify({
          activeRolls: [...activeRolls, roll],
          developedRolls,
          completedRolls,
        })
      );
    } catch (error) {
      console.error("Failed to add roll:", error);
    } finally {
      setLoadingRolls((prev) => ({ ...prev, [roll.id]: false }));
    }
  };

  const addPhotoToRoll = (id: string, newPhoto: Photo) => {
    const updatedActiveRolls = activeRolls.map((roll) =>
      roll.id === id ? { ...roll, photos: [...roll.photos, newPhoto] } : roll
    );

    setActiveRolls(updatedActiveRolls);
    localStorage.setItem(
      "filmRolls",
      JSON.stringify({
        activeRolls: updatedActiveRolls,
        developedRolls,
        completedRolls,
      })
    );
  };

  const moveRollToStage = async (
    rollId: string,
    currentStage: string,
    newStage: string
  ) => {
    try {
      await moveRoll(rollId, currentStage, newStage);
      const updatedRolls = await getAllRolls();

      setActiveRolls(updatedRolls.activeRolls);
      setDevelopedRolls(updatedRolls.developedRolls);
      setCompletedRolls(updatedRolls.completedRolls);

      localStorage.setItem("filmRolls", JSON.stringify(updatedRolls));
    } catch (error) {
      console.error("Failed to move roll:", error);
    }
  };

  return (
    <RollsContext.Provider
      value={{
        activeRolls,
        developedRolls,
        completedRolls,
        addRoll,
        addPhotoToRoll,
        moveRoll: moveRollToStage,
        isLoading,
        loadingRolls,
      }}
    >
      {children}
    </RollsContext.Provider>
  );
};
