import React from "react";
import { Box, Text } from "@mantine/core";
import RollItem from "./RollItem";
import { FilmRoll } from "../interfaces";

interface RollsSectionProps {
  title: string;
  rolls: FilmRoll[];
  stage: "active" | "developed" | "completed";
  loadingRolls: { [key: string]: boolean };
  onAddPhoto?: (roll: FilmRoll) => void;
  onFinishRoll?: (roll: FilmRoll) => void;
  onCompleteRoll?: (roll: FilmRoll) => void;
}

const RollsSection: React.FC<RollsSectionProps> = ({
  title,
  rolls,
  stage,
  loadingRolls,
  onAddPhoto,
  onFinishRoll,
  onCompleteRoll,
}) => {
  return (
    <Box>
      <h2 className="text-2xl font-bold mb-4 mt-8">{title}</h2>
      <div className="grid gap-4">
        {rolls.length > 0 ? (
          rolls.map((roll) => (
            <RollItem
              key={roll.id}
              roll={roll}
              stage={stage}
              isLoading={loadingRolls[roll.id] || roll.isLoading || false}
              onAddPhoto={onAddPhoto}
              onFinishRoll={onFinishRoll}
              onCompleteRoll={onCompleteRoll}
            />
          ))
        ) : (
          <Text className="text-center text-neutral-500">
            No {title.toLowerCase()} rolls available.
          </Text>
        )}
      </div>
    </Box>
  );
};

export default RollsSection;
