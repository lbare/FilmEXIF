import { useContext } from "react";
import { RollsContext } from "./RollsContext";

export const useRolls = () => {
  const context = useContext(RollsContext);
  if (!context) {
    throw new Error("useRolls must be used within a RollsProvider");
  }
  return context;
};
